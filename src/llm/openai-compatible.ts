import type { LLMProvider, ConversationItem, AssistantTurn, ToolCall } from "./types";

/**
 * Proveedor para cualquier API compatible con OpenAI (Chat Completions).
 * Sirve para Groq y Google Gemini (ambos exponen un endpoint compatible),
 * y tambien para el propio OpenAI. Usa fetch, sin SDK extra.
 */
export function createOpenAICompatibleProvider(opts: {
  apiKey: string;
  model: string;
  baseUrl: string; // ej: https://api.groq.com/openai/v1
  label: string; // ej: groq:llama-3.3-70b-versatile
}): LLMProvider {
  return {
    name: opts.label,
    async complete({ system, tools, messages, maxTokens, temperature }): Promise<AssistantTurn> {
      const body: Record<string, unknown> = {
        model: opts.model,
        max_tokens: maxTokens,
        messages: toOpenAI(system, messages),
      };
      if (typeof temperature === "number") body.temperature = temperature;
      // Solo mandamos herramientas si las hay (algunas APIs rechazan un array vacio).
      if (tools.length > 0) {
        body.tools = tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
        body.tool_choice = "auto";
      }

      const res = await fetchWithRetry(
        `${opts.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
        opts.label
      );

      if (!res) {
        // Rate limit persistente: devolvemos un aviso amable en vez de fallar feo.
        return {
          text: "Uff, en este momento tengo muchas solicitudes a la vez (estamos en el plan gratuito de Groq). Dame unos segunditos y escribeme de nuevo, porfa 🙏",
          toolCalls: [],
        };
      }

      const data: any = await res.json();
      const msg = data.choices?.[0]?.message ?? {};
      const toolCalls: ToolCall[] = (msg.tool_calls ?? []).map((c: any) => ({
        id: c.id,
        name: c.function?.name ?? "",
        input: safeParse(c.function?.arguments),
      }));

      return { text: stripToolLeak(msg.content ?? ""), toolCalls };
    },
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Presupuesto de tiempo por peticion: ni un solo mensaje debe colgarse "para siempre".
const REQUEST_TIMEOUT_MS = 20_000; // corta una llamada HTTP que no responde
// Presupuesto amplio a proposito: ante rate limit, el cliente prefiere esperar unos
// segundos y recibir su respuesta antes que un error rapido. En el plan gratuito de
// Groq el deposito de tokens se recarga solo, asi que casi siempre pasa al 2o o 3er intento.
const RETRY_BUDGET_MS = 35_000;
// Tope por espera. Respetamos lo que pide el servidor (suele decir "try again in Xs").
const MAX_WAIT_SEC = 15;

/**
 * Hace la peticion reintentando ante rate limit (429) o errores temporales (5xx),
 * pero acotado en tiempo. Devuelve undefined si se agota el presupuesto de reintentos
 * (para que la capa de arriba responda con un aviso, no con un cuelgue).
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  label: string
): Promise<Response | undefined> {
  const start = Date.now();
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
      // Timeout o fallo de red: reintenta si queda presupuesto.
      if (Date.now() - start >= RETRY_BUDGET_MS) return undefined;
      console.warn(`[${label}] fallo de red/timeout; reintentando...`);
      await sleep(1500);
      continue;
    }
    if (res.ok) return res;

    const retriable = res.status === 429 || res.status >= 500;
    const detail = await res.text();
    if (!retriable) {
      throw new Error(`[${label}] API error ${res.status}: ${detail}`);
    }

    // Segundos sugeridos: header Retry-After o "try again in X.Ys" del mensaje.
    const headerWait = Number(res.headers.get("retry-after"));
    const msgWait = Number(detail.match(/try again in ([\d.]+)s/i)?.[1]);
    const waitSec = Math.min(headerWait || msgWait || 2 ** attempt, MAX_WAIT_SEC);

    // Si esperar nos pasa del presupuesto, nos rendimos con gracia.
    if (Date.now() - start + waitSec * 1000 >= RETRY_BUDGET_MS) {
      console.warn(`[${label}] ${res.status}; presupuesto de reintentos agotado, respondo aviso.`);
      return undefined;
    }
    console.warn(`[${label}] ${res.status}; reintentando en ${waitSec.toFixed(1)}s (intento ${attempt + 1})`);
    await sleep(waitSec * 1000 + 250);
  }
}

/**
 * Algunos modelos (Llama en Groq) a veces "fugan" una llamada a herramienta como
 * texto, ej: <function=consultar_menu></function> o <tool_call>...</tool_call>.
 * Esto lo quita del mensaje visible para que nunca le llegue al cliente.
 */
function stripToolLeak(text: string): string {
  return text
    .replace(/<function\s*=[^>]*>[\s\S]*?<\/function>/gi, "")
    .replace(/<function\s*=[^>]*>/gi, "")
    .replace(/<\/?function[^>]*>/gi, "")
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "")
    .replace(/<\/?tool_call>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function safeParse(s: unknown): Record<string, unknown> {
  if (typeof s !== "string" || !s.trim()) return {};
  try {
    const parsed = JSON.parse(s);
    // El modelo a veces manda "null" o un valor no-objeto; normalizamos a {}.
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function toOpenAI(system: string, messages: ConversationItem[]): any[] {
  const out: any[] = [{ role: "system", content: system }];

  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.text });
    } else if (m.role === "assistant") {
      const msg: any = { role: "assistant", content: m.text || null };
      if (m.toolCalls.length > 0) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.input) },
        }));
      }
      out.push(msg);
    } else {
      // Cada resultado de herramienta es un mensaje "tool" independiente.
      for (const r of m.results) {
        out.push({ role: "tool", tool_call_id: r.id, content: r.content });
      }
    }
  }
  return out;
}
