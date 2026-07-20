import { LLMClient, setLLMClient } from '../client';
import { OpenRouterProvider } from './openrouter';
import { GeminiProvider } from './gemini';

export { OpenRouterProvider } from './openrouter';
export { GeminiProvider } from './gemini';

/**
 * Factory function to initialize the LLM Client based on environment variables
 */
export function initializeLLM(): LLMClient {
  const provider = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase().trim();

  let client: LLMClient;

  switch (provider) {
    case 'openrouter':
      client = new OpenRouterProvider();
      break;
    case 'gemini':
      client = new GeminiProvider();
      break;
    default:
      throw new Error(`Unsupported LLM provider configured: "${provider}"`);
  }

  // Set the global client for all workflows
  setLLMClient(client);

  // Retrieve logs variables
  const resolvedProviderName = provider === 'openrouter' ? 'OpenRouter' : 'Gemini';
  const model =
    process.env.LLM_MODEL ||
    (provider === 'gemini'
      ? process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      : 'nvidia/nemotron-3-ultra-550b-a55b:free');
  const temperature = parseFloat(
    process.env.LLM_TEMPERATURE ||
      (provider === 'gemini' ? process.env.GEMINI_TEMPERATURE || '0.7' : '0.7'),
  );
  const maxTokens = parseInt(
    process.env.LLM_MAX_TOKENS ||
      (provider === 'gemini' ? process.env.GEMINI_MAX_TOKENS || '4096' : '4096'),
    10,
  );

  console.log('📊 AI Module Configuration:');
  console.log(`   Provider: ${resolvedProviderName}`);
  console.log(`   Model: ${model}`);
  console.log(`   Temperature: ${temperature}`);
  console.log(`   Max Tokens: ${maxTokens}`);
  console.log(`✓ AI module initialized with ${resolvedProviderName} provider`);

  return client;
}
