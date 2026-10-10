import { describe, expect, it, vi } from "vitest";
import { runBoundedToolLoop } from "@/lib/ai-tool-loop";

describe("bounded AI tool loop", () => {
  it("executes validated calls and returns the next model answer", async () => {
    const requestTurn = vi
      .fn()
      .mockResolvedValueOnce({
        model: "test-model",
        message: {
          role: "assistant",
          content: "I will check the application.",
          toolCalls: [{ id: "call-1", name: "readApplication", arguments: JSON.stringify({ id: "app-1" }) }],
        },
      })
      .mockResolvedValueOnce({
        message: { role: "assistant", content: "The application is ready for review." },
      });

    const result = await runBoundedToolLoop({
      messages: [{ role: "user", content: "Check application app-1" }],
      tools: [{ name: "readApplication", execute: (args) => ({ id: args.id, status: "READY" }) }],
      requestTurn,
    });

    expect(result.stopReason).toBe("completed");
    expect(result.text).toBe("The application is ready for review.");
    expect(result.toolCalls).toBe(1);
    expect(result.steps[0]).toMatchObject({ toolName: "readApplication", status: "completed" });
    expect(requestTurn).toHaveBeenCalledTimes(2);
    expect(requestTurn.mock.calls[1][0].at(-1)).toMatchObject({ role: "tool", toolCallId: "call-1" });
  });

  it("returns tool failures to the model instead of throwing", async () => {
    const requestTurn = vi
      .fn()
      .mockResolvedValueOnce({ message: { role: "assistant", content: "", toolCalls: [{ id: "call-1", name: "send", arguments: "{}" }] } })
      .mockResolvedValueOnce({ message: { role: "assistant", content: "I could not send it." } });

    const result = await runBoundedToolLoop({
      messages: [{ role: "user", content: "Send it" }],
      tools: [{ name: "send", execute: () => { throw new Error("approval required"); } }],
      requestTurn,
    });

    expect(result.stopReason).toBe("completed");
    expect(result.steps[0]).toMatchObject({ status: "failed", error: "approval required" });
    expect(requestTurn.mock.calls[1][0].at(-1)?.content).toContain("approval required");
  });

  it("does not execute side effects on the final iteration", async () => {
    const execute = vi.fn();
    const result = await runBoundedToolLoop({
      messages: [{ role: "user", content: "Do work" }],
      tools: [{ name: "write", execute }],
      maxIterations: 1,
      requestTurn: vi.fn().mockResolvedValue({ message: { role: "assistant", content: "", toolCalls: [{ id: "call-1", name: "write", arguments: "{}" }] } }),
    });

    expect(result.stopReason).toBe("iteration_limit");
    expect(execute).not.toHaveBeenCalled();
    expect(result.toolCalls).toBe(0);
  });

  it("stops a repeated tool call before the third execution", async () => {
    const execute = vi.fn().mockResolvedValue({ ok: true });
    const requestTurn = vi.fn().mockResolvedValue({
      message: { role: "assistant", content: "", toolCalls: [{ id: "same", name: "read", arguments: { id: "1" } }] },
    });

    const result = await runBoundedToolLoop({
      messages: [{ role: "user", content: "Read" }],
      tools: [{ name: "read", execute }],
      maxIterations: 5,
      maxRepeatedCalls: 3,
      requestTurn,
    });

    expect(result.stopReason).toBe("repeated_call");
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
