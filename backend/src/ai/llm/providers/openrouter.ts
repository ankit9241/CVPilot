import { createHash } from 'crypto';
import * as https from 'https';
import { LLMClient, LLMConfig, LLMMessage, LLMResponse } from '../client';
import { PROMPT_VERSION } from '../../prompts';

const responseCache = new Map<string, LLMResponse>();

function cacheKey(messages: LLMMessage[], model: string): string {
  const payload = JSON.stringify({ messages, model, promptVersion: PROMPT_VERSION });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Helper to make HTTPS requests without external dependencies
 */
function makeRequest(url: string, headers: Record<string, string>, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response JSON: ${data}`));
          }
        } else {
          const err = new Error(data || `HTTP Error ${res.statusCode}`);
          (err as any).statusCode = res.statusCode;
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('OpenRouter API request timed out after 60s'));
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * OpenRouter LLM Provider using OpenAI-compatible Chat Completions API
 */
export class OpenRouterProvider implements LLMClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultConfig: LLMConfig;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error(
        'OPENROUTER_API_KEY environment variable is not set. Please configure it in .env.',
      );
    }
    this.apiKey = key;
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    const model = process.env.LLM_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';

    this.defaultConfig = {
      model,
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096', 10),
    };
  }

  async call(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };

    const key = cacheKey(messages, finalConfig.model);
    const cached = responseCache.get(key);
    if (cached) {
      return cached;
    }

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://cvpilot.app',
      'X-Title': 'CVPilot',
    };

    const body: any = {
      model: finalConfig.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens,
    };

    if (finalConfig.json) {
      body.response_format = { type: 'json_object' };
    }

    let data: any;
    try {
      data = await makeRequest(`${this.baseUrl}/chat/completions`, headers, body);
    } catch (error: any) {
      // If failed with 400 Bad Request and response_format was used, retry without response_format
      if (
        body.response_format &&
        (error.statusCode === 400 || String(error).includes('response_format'))
      ) {
        console.warn(
          `⚠️ OpenRouter model "${finalConfig.model}" may not support JSON mode. Retrying without response_format...`,
        );
        delete body.response_format;
        try {
          data = await makeRequest(`${this.baseUrl}/chat/completions`, headers, body);
        } catch (retryError: any) {
          throw new Error(
            `OpenRouter API call failed (retry without JSON mode): ${retryError.message || retryError}`,
          );
        }
      } else {
        throw new Error(`OpenRouter API call failed: ${error.message || error}`);
      }
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenRouter response returned no choices');
    }

    const choice = data.choices[0];
    const content = choice.message?.content;
    if (content === undefined || content === null) {
      throw new Error('OpenRouter response contains empty content');
    }

    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;

    const llmResponse: LLMResponse = {
      content,
      stopReason: choice.finish_reason || 'stop',
      usage: {
        inputTokens,
        outputTokens,
      },
    };

    responseCache.set(key, llmResponse);
    return llmResponse;
  }
}
