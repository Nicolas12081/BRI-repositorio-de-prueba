import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[config] Falta la variable de entorno ${name}. Revisa tu archivo .env`);
    process.exit(1);
  }
  return value;
}

// Proveedor de IA activo. MOCK_LLM=1 sigue funcionando como atajo de "mock".
type Provider = "anthropic" | "groq" | "gemini" | "mock";
const llmProvider = (process.env.LLM_PROVIDER?.toLowerCase() ||
  (process.env.MOCK_LLM === "1" ? "mock" : "anthropic")) as Provider;

/** Exige la key solo si ese proveedor es el activo. */
function keyFor(provider: Provider, name: string): string {
  return llmProvider === provider ? required(name) : process.env[name] || "";
}

export const env = {
  llmProvider,

  // Claude (Anthropic)
  anthropicApiKey: keyFor("anthropic", "ANTHROPIC_API_KEY"),
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",

  // Groq (compatible OpenAI)
  groqApiKey: keyFor("groq", "GROQ_API_KEY"),
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

  // Google Gemini (compatible OpenAI)
  geminiApiKey: keyFor("gemini", "GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",

  // WhatsApp (solo se exigen al levantar el servidor, ver assertWhatsappConfig)
  whatsappToken: process.env.WHATSAPP_TOKEN || "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  port: Number(process.env.PORT) || 3000,
  // URL publica del servidor (ej: la del tunel), para que WhatsApp alcance fotos locales.
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "",
};

/**
 * Indica si WhatsApp esta configurado. NO detiene el servidor: el chat web y el
 * panel funcionan sin credenciales de Meta. Solo el envio/recepcion por WhatsApp
 * requiere el token. El phone_number_id ya no es global (viene en cada webhook).
 */
export function whatsappEnabled(): boolean {
  const missing = [
    ["WHATSAPP_TOKEN", env.whatsappToken],
    ["WHATSAPP_VERIFY_TOKEN", env.whatsappVerifyToken],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length > 0) {
    console.warn(`[config] WhatsApp desactivado (faltan: ${missing.join(", ")}). El chat web y el panel funcionan igual.`);
    return false;
  }
  return true;
}
