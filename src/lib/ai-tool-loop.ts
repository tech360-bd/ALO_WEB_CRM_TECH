/**
 * Bounded tool-calling loop for ALO agents.
 *
 * The model/provider adapter is injected so this module stays provider-neutral.
 * This follows the safe parts of the OpenRouter tool-calling pattern without
 * importing an external agent framework: every tool call is validated, errors
 * become tool results, repeated calls stop the run, and the final iteration
 * never executes side effects whose result cannot be observed by the model.
 */

export type ToolLoopRole = "system" | "user" | "assistant" | "tool";

export type ToolLoopCall = {
  id: string;
  name: string;
  arguments: string | Record<string, unknown>;
};

export type ToolLoopMessage = {
  role: ToolLoopRole;
  content: string;
  toolCallId?: string;
  toolCalls?: ToolLoopCall[];
};

export type ToolLoopTurn = {
  message: ToolLoopMessage;
  model?: string;
};

export type ToolLoopTool = {
  name: string;
  description?: string;
  execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
};

export type ToolLoopStep = {
  iteration: number;
  toolName: string;
  callId: string;
  status: "completed" | "failed" | "rejected";
  durationMs: number;
  error?: string;
};

export type ToolLoopStopReason =
  | "completed"
  | "iteration_limit"
  | "tool_call_limit"
  | "repeated_call"
  | "invalid_tool_call";

export type ToolLoopResult = {
  text: string | null;
  messages: ToolLoopMessage[];
  steps: ToolLoopStep[];
  iterations: number;
  toolCalls: number;
  stopReason: ToolLoopStopReason;
};

export type RunToolLoopOptions = {
  messages: ToolLoopMessage[];
  tools: ToolLoopTool[];
  requestTurn: (messages: ToolLoopMessage[], tools: ToolLoopTool[]) => Promise<ToolLoopTurn>;
  maxIterations?: number;
  maxToolCalls?: number;
  maxRepeatedCalls?: number;
  maxToolResultChars?: number;
};

const DEFAULT_MAX_ITERATIONS = 6;
const DEFAULT_MAX_TOOL_CALLS = 12;
const DEFAULT_MAX_REPEATED_CALLS = 3;
const DEFAULT_MAX_TOOL_RESULT_CHARS = 8_000;

function positiveLimit(value: number | undefined, fallback: number, label: string, maximum = 100): number {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result < 1 || result > maximum) {
    throw new Error(`${label} must be a safe integer between 1 and ${maximum}`);
  }
  return result;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
}

function parseArguments(value: string | Record<string, unknown>): Record<string, unknown> {
  if (typeof value !== "string") {
    if (value === null || Array.isArray(value)) throw new Error("Tool arguments must be a JSON object");
    return value;
  }
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Tool arguments must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

function safeToolResult(value: unknown, maxChars: number): string {
  let serialized: string;
  try {
    serialized = JSON.stringify(value ?? null);
  } catch {
    serialized = JSON.stringify({ error: "Tool returned a non-serializable result" });
  }
  if (serialized.length <= maxChars) return serialized;
  return JSON.stringify({
    truncated: true,
    originalChars: serialized.length,
    preview: serialized.slice(0, Math.max(0, maxChars - 80)),
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
}

/** Run a provider-neutral, bounded, auditable tool-calling conversation. */
export async function runBoundedToolLoop(options: RunToolLoopOptions): Promise<ToolLoopResult> {
  const maxIterations = positiveLimit(options.maxIterations, DEFAULT_MAX_ITERATIONS, "maxIterations");
  const maxToolCalls = positiveLimit(options.maxToolCalls, DEFAULT_MAX_TOOL_CALLS, "maxToolCalls");
  const maxRepeatedCalls = positiveLimit(options.maxRepeatedCalls, DEFAULT_MAX_REPEATED_CALLS, "maxRepeatedCalls");
  const maxToolResultChars = positiveLimit(options.maxToolResultChars, DEFAULT_MAX_TOOL_RESULT_CHARS, "maxToolResultChars", 100_000);
  const toolMap = new Map(options.tools.map((tool) => [tool.name, tool]));
  const messages = options.messages.map((message) => ({ ...message }));
  const steps: ToolLoopStep[] = [];
  const fingerprints = new Map<string, number>();
  let toolCalls = 0;
  let lastModelText: string | null = null;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const turn = await options.requestTurn(messages.map((message) => ({ ...message })), options.tools);
    const assistantMessage: ToolLoopMessage = {
      ...turn.message,
      role: "assistant",
      content: turn.message.content || "",
    };
    lastModelText = assistantMessage.content || null;
    const calls = assistantMessage.toolCalls || [];

    if (calls.length === 0) {
      return { text: lastModelText, messages, steps, iterations: iteration, toolCalls, stopReason: "completed" };
    }

    // Do not perform side effects on the last model turn: there is no follow-up
    // request that could consume those results.
    if (iteration === maxIterations) {
      return { text: lastModelText, messages, steps, iterations: iteration, toolCalls, stopReason: "iteration_limit" };
    }

    messages.push(assistantMessage);
    for (const call of calls) {
      const fingerprint = `${call.name}:${JSON.stringify(stableValue(call.arguments))}`;
      const repeatCount = (fingerprints.get(fingerprint) || 0) + 1;
      fingerprints.set(fingerprint, repeatCount);
      if (repeatCount >= maxRepeatedCalls) {
        return { text: lastModelText, messages, steps, iterations: iteration, toolCalls, stopReason: "repeated_call" };
      }

      const tool = toolMap.get(call.name);
      if (!tool) {
        steps.push({ iteration, toolName: call.name, callId: call.id, status: "rejected", durationMs: 0, error: "Unknown tool" });
        messages.push({ role: "tool", toolCallId: call.id, content: JSON.stringify({ error: "Unknown tool" }) });
        continue;
      }
      if (toolCalls >= maxToolCalls) {
        return { text: lastModelText, messages, steps, iterations: iteration, toolCalls, stopReason: "tool_call_limit" };
      }

      const startedAt = Date.now();
      try {
        const args = parseArguments(call.arguments);
        const result = await tool.execute(args);
        toolCalls += 1;
        steps.push({ iteration, toolName: call.name, callId: call.id, status: "completed", durationMs: Date.now() - startedAt });
        messages.push({ role: "tool", toolCallId: call.id, content: safeToolResult(result, maxToolResultChars) });
      } catch (error) {
        toolCalls += 1;
        const message = errorMessage(error);
        steps.push({ iteration, toolName: call.name, callId: call.id, status: "failed", durationMs: Date.now() - startedAt, error: message });
        messages.push({ role: "tool", toolCallId: call.id, content: JSON.stringify({ error: message }) });
      }
    }
  }

  return { text: lastModelText, messages, steps, iterations: maxIterations, toolCalls, stopReason: "iteration_limit" };
}
