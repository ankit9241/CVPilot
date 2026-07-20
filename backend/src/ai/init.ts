import { initializeLLM } from './index';

/**
 * Initialize the AI module with the configured LLM provider.
 * Call this once at application startup.
 */
export function initializeAIModule(): void {
  try {
    initializeLLM();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to initialize AI module: ${errorMsg}`);
    throw error;
  }
}

/**
 * Check if the AI module is properly configured.
 */
export async function checkAIModuleHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const { getLLMClient } = await import('./index');
    const client = getLLMClient();

    if (!client) {
      return {
        healthy: false,
        message: 'AI module not initialized. Call initializeLLM() at startup.',
      };
    }

    return {
      healthy: true,
      message: 'AI module is healthy and ready to use',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      healthy: false,
      message: `AI module health check failed: ${errorMsg}`,
    };
  }
}
