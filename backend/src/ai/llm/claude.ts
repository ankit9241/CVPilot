import { LLMClient, LLMConfig, LLMMessage, LLMResponse } from './client';

// This is injected from the application layer, NOT imported directly
// Allows the AI module to remain independent of external dependencies
export interface AnthropicSDK {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      temperature: number;
      system: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    }): Promise<{
      content: Array<{ type: string; text: string }>;
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
    }>;
  };
}

export class ClaudeLLMClient implements LLMClient {
  private anthropic: AnthropicSDK;
  private defaultConfig: LLMConfig = {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 4096,
  };

  constructor(anthropic: AnthropicSDK) {
    this.anthropic = anthropic;
  }

  async call(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };

    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.anthropic.messages.create({
      model: finalConfig.model,
      max_tokens: finalConfig.maxTokens,
      temperature: finalConfig.temperature,
      system: systemMessage,
      messages: userMessages,
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in LLM response');
    }

    return {
      content: textContent.text,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
