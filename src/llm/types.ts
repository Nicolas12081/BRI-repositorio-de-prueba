/**
 * Interfaz neutral de proveedor de IA.
 *
 * El resto del bot (bucle de herramientas, tools, prompt) no sabe QUE modelo
 * responde. Cada proveedor (Claude, Groq, Gemini, mock) implementa esta interfaz
 * traduciendo desde/hacia su propio formato. Asi el "cerebro" es intercambiable
 * con solo cambiar una variable de entorno (LLM_PROVIDER).
 */

/** Definicion de una herramienta que el modelo puede invocar (JSON Schema). */
export interface ToolSpec {
  name: string;
  description: string;
  /** JSON Schema del objeto de entrada. */
  parameters: Record<string, unknown>;
}

/** Una llamada a herramienta pedida por el modelo. */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** El resultado de ejecutar una herramienta, para devolverselo al modelo. */
export interface ToolResult {
  id: string;
  content: string;
}

/** Un turno de la conversacion en formato neutral. */
export type ConversationItem =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; toolCalls: ToolCall[] }
  | { role: "tool"; results: ToolResult[] };

/** Lo que devuelve el modelo en un turno: texto y/o llamadas a herramientas. */
export interface AssistantTurn {
  text: string;
  toolCalls: ToolCall[];
}

/** Contrato que implementa cada proveedor de IA. */
export interface LLMProvider {
  /** Identificador legible, ej: "groq:llama-3.3-70b-versatile". */
  readonly name: string;
  complete(req: {
    system: string;
    tools: ToolSpec[];
    messages: ConversationItem[];
    maxTokens: number;
    /** 0 = siempre igual (util para analisis), ~0.9 = variado y natural (para conversar). */
    temperature?: number;
  }): Promise<AssistantTurn>;
}
