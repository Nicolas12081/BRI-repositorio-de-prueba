import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ConversationItem, AssistantTurn, ToolCall } from "./types";

/** Proveedor que usa la API oficial de Claude (Anthropic). */
export function createAnthropicProvider(apiKey: string, model: string): LLMProvider {
  const client = new Anthropic({ apiKey });

  return {
    name: `anthropic:${model}`,
    async complete({ system, tools, messages, maxTokens, temperature }): Promise<AssistantTurn> {
      const res = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        ...(typeof temperature === "number" && { temperature }),
        // Solo mandamos herramientas si las hay (el calificador no las necesita).
        ...(tools.length > 0 && {
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters as Anthropic.Tool.InputSchema,
          })),
        }),
        messages: toAnthropic(messages),
      });

      let text = "";
      const toolCalls: ToolCall[] = [];
      for (const block of res.content) {
        if (block.type === "text") {
          text += (text ? "\n" : "") + block.text;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }
      return { text: text.trim(), toolCalls };
    },
  };
}

function toAnthropic(messages: ConversationItem[]): Anthropic.MessageParam[] {
  return messages.map((m): Anthropic.MessageParam => {
    if (m.role === "user") {
      return { role: "user", content: m.text };
    }
    if (m.role === "assistant") {
      const content: Anthropic.ContentBlockParam[] = [];
      if (m.text) content.push({ type: "text", text: m.text });
      for (const tc of m.toolCalls) {
        content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.input });
      }
      return { role: "assistant", content };
    }
    // Resultados de herramientas: van como un mensaje "user" con bloques tool_result.
    return {
      role: "user",
      content: m.results.map((r) => ({
        type: "tool_result",
        tool_use_id: r.id,
        content: r.content,
      })),
    };
  });
}
