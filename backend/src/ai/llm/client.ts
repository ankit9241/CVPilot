// Abstraction for LLM client. Injected from outside.
// This keeps the graph completely independent of Claude, OpenAI, etc.

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  json?: boolean;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMClient {
  call(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
}

// Default LLM client (will be overridden in production)
export class DefaultLLMClient implements LLMClient {
  async call(_messages: LLMMessage[], _config?: Partial<LLMConfig>): Promise<LLMResponse> {
    throw new Error(
      'LLM Client not configured. Provide a valid LLMClient implementation via dependency injection.',
    );
  }
}

export let llmClient: LLMClient = new DefaultLLMClient();

export function setLLMClient(client: LLMClient): void {
  llmClient = client;
}

export function getLLMClient(): LLMClient {
  return llmClient;
}
