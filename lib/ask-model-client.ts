// The Anthropic adapter for the shared model contract. The core decides what the model may say
// and rebuilds every served sentence from approved strings; this file only carries the request
// to the provider. Dormant without ANTHROPIC_API_KEY; ASK_MODEL_DISABLED=1 switches it off.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { DEFAULT_MODEL, MODEL_TIMEOUT_MS, type ModelClient, type ModelMessage } from "@/lib/ask-core/index.ts";

const EFFORT_SUPPORTED = (model: string) => /^claude-(opus|sonnet)-(5|4-[678])/.test(model);

export function isModelEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ASK_MODEL_DISABLED !== "1";
}

export function modelName(): string {
  return process.env.ASK_MODEL || DEFAULT_MODEL;
}

let cached: Anthropic | null = null;

export const anthropicClient: ModelClient = {
  async send(m: ModelMessage) {
    cached ??= new Anthropic({ timeout: MODEL_TIMEOUT_MS, maxRetries: 0 });
    const effort = EFFORT_SUPPORTED(m.model);
    const res = await cached.messages.create({
      model: m.model,
      max_tokens: effort ? 1_500 : m.max_tokens,
      system: [{ type: "text", text: m.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: m.user }],
      output_config: { format: jsonSchemaOutputFormat(m.output_schema), ...(effort ? { effort: "low" } : {}) },
    });
    const usage = res.usage as { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number | null } | undefined;
    return {
      stop_reason: res.stop_reason,
      text: res.content.map((b) => (b.type === "text" ? b.text : "")).join(""),
      usage: { input_tokens: usage?.input_tokens, output_tokens: usage?.output_tokens, cache_read_input_tokens: usage?.cache_read_input_tokens ?? 0 },
    };
  },
};
