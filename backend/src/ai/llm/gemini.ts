import { createHash } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { LLMClient, LLMConfig, LLMMessage, LLMResponse } from './client';
import { PROMPT_VERSION } from '../prompts';

// Cache key = ResumeContext + Job Description + Model + Prompt version.
// Messages already contain the resume context and job description text (each
// node serializes them into the prompt), so hashing (messages, model,
// PROMPT_VERSION) covers all four dimensions without threading extra params
// through every node.
// ponytail: in-memory, per-process cache — swap for Redis if it needs to
// survive restarts or be shared across instances.
const responseCache = new Map<string, LLMResponse>();

function cacheKey(messages: LLMMessage[], model: string): string {
  const payload = JSON.stringify({ messages, model, promptVersion: PROMPT_VERSION });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Gemini LLM Provider using Google's official Gen AI SDK (@google/genai)
 * Implements LLMClient interface for use in AI workflows
 */
export class GeminiLLMClient implements LLMClient {
  private client: GoogleGenAI;
  private defaultConfig: LLMConfig;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. Please configure it in .env or pass it to the constructor.',
      );
    }
    this.client = new GoogleGenAI({ apiKey: key });

    // Read model from environment or use default
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

    this.defaultConfig = {
      model,
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096', 10),
    };
  }

  async call(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };

    const key = cacheKey(messages, finalConfig.model);
    const cached = responseCache.get(key);
    if (cached) {
      return cached;
    }

    // Separate system message from user/assistant messages
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: this.mapRole(m.role),
        parts: [{ text: m.content }],
      }));

    try {
      // Call generateContent via the new genai SDK
      const result = await this.client.models.generateContent({
        model: finalConfig.model,
        contents: conversationMessages,
        config: {
          systemInstruction: systemMessage || undefined,
          temperature: finalConfig.temperature,
          maxOutputTokens: finalConfig.maxTokens,
        },
      });

      // Extract text content from response
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('No text content in Gemini response');
      }

      // Get usage information if available
      const usageMetadata = result.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount || 0;
      const outputTokens = usageMetadata?.candidatesTokenCount || 0;

      const response: LLMResponse = {
        content: responseText,
        stopReason: result.candidates?.[0]?.finishReason || 'STOP',
        usage: {
          inputTokens,
          outputTokens,
        },
      };
      responseCache.set(key, response);
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini API call failed: ${errorMsg}`);
    }
  }

  /**
   * Map LLMClient role to Gemini API role
   */
  private mapRole(role: LLMMessage['role']): 'user' | 'model' {
    switch (role) {
      case 'system':
        // System messages are handled separately as systemInstruction
        return 'user';
      case 'user':
        return 'user';
      case 'assistant':
        return 'model';
      default:
        return 'user';
    }
  }
}

/**
 * Factory function to create Gemini client with error handling
 */
export function createGeminiClient(apiKey?: string): LLMClient {
  try {
    return new GeminiLLMClient(apiKey);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Gemini client: ${errorMsg}`);
  }
}
