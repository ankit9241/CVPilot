import { createHash } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { LLMClient, LLMConfig, LLMMessage, LLMResponse } from '../client';
import { PROMPT_VERSION } from '../../prompts';

const responseCache = new Map<string, LLMResponse>();

function cacheKey(messages: LLMMessage[], model: string): string {
  const payload = JSON.stringify({ messages, model, promptVersion: PROMPT_VERSION });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Gemini LLM Provider using Google's official Gen AI SDK (@google/genai)
 */
export class GeminiProvider implements LLMClient {
  private client: GoogleGenAI;
  private defaultConfig: LLMConfig;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. Please configure it in .env.',
      );
    }
    this.client = new GoogleGenAI({ apiKey: key });

    // Read config from environment or use defaults
    const model = process.env.LLM_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    this.defaultConfig = {
      model,
      temperature: parseFloat(
        process.env.LLM_TEMPERATURE || process.env.GEMINI_TEMPERATURE || '0.7',
      ),
      maxTokens: parseInt(
        process.env.LLM_MAX_TOKENS || process.env.GEMINI_MAX_TOKENS || '4096',
        10,
      ),
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
      const result = await this.client.models.generateContent({
        model: finalConfig.model,
        contents: conversationMessages,
        config: {
          systemInstruction: systemMessage || undefined,
          temperature: finalConfig.temperature,
          maxOutputTokens: finalConfig.maxTokens,
          // Support JSON output if requested via config
          responseMimeType: finalConfig.json ? 'application/json' : undefined,
        },
      });

      const responseText = result.text || "";

      if (!responseText) {
        throw new Error('No text content in Gemini response');
      }

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

  private mapRole(role: LLMMessage['role']): 'user' | 'model' {
    switch (role) {
      case 'system':
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
