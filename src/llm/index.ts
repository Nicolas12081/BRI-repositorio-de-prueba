import { env } from "../env";
import type { LLMProvider } from "./types";
import { createAnthropicProvider } from "./anthropic";
import { createOpenAICompatibleProvider } from "./openai-compatible";
import { createMockProvider } from "./mock";

/**
 * Fabrica el proveedor de IA segun LLM_PROVIDER. Cambiar de "cerebro" es solo
 * cambiar esa variable de entorno (util para probar gratis o ajustar costo/calidad).
 */
let instance: LLMProvider | null = null;

/** Proveedor compartido (se crea una sola vez). Lo usan el agente y el calificador. */
export function getProvider(): LLMProvider {
  if (!instance) instance = createProvider();
  return instance;
}

export function createProvider(): LLMProvider {
  switch (env.llmProvider) {
    case "mock":
      return createMockProvider();

    case "groq":
      return createOpenAICompatibleProvider({
        apiKey: env.groqApiKey,
        model: env.groqModel,
        baseUrl: "https://api.groq.com/openai/v1",
        label: `groq:${env.groqModel}`,
      });

    case "gemini":
      return createOpenAICompatibleProvider({
        apiKey: env.geminiApiKey,
        model: env.geminiModel,
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        label: `gemini:${env.geminiModel}`,
      });

    case "anthropic":
    default:
      return createAnthropicProvider(env.anthropicApiKey, env.anthropicModel);
  }
}

export type { LLMProvider } from "./types";
