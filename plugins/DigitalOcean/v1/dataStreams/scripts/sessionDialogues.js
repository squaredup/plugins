// One row per dialogue turn, summarising its steps: tool calls and failures, tool time, token usage and detected signals
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
result = (data.edges || []).map((e) => e.node).filter(Boolean).map((n) => {
    const steps = n.steps || [];
    const results = steps.filter((s) => s.type === "tool_result");
    const usage = steps.filter((s) => s.type === "usage").map((s) => s.usage || {});
    const sum = (k) => usage.reduce((t, u) => t + (num(u[k]) || 0), 0);
    const signals = n.signals || [];
    return {
        id: n.id,
        sequence: num(n.sequence),
        createdAt: n.created_at || null,
        runStatus: n.run_status || null,
        failureCode: n.failure_code || null,
        toolCalls: steps.filter((s) => s.type === "tool_call").length,
        toolFailures: results.filter((s) => s.ok === false).length,
        toolDurationMs: results.reduce((t, s) => t + (num(s.duration_ms) || 0), 0),
        // Each usage step is one model call (the figures are not running totals), so the turn's tokens are the sum
        inputTokens: sum("input_tokens"),
        outputTokens: sum("output_tokens"),
        cachedInputTokens: sum("cached_input_tokens"),
        reasoningTokens: sum("reasoning_tokens"),
        modelCalls: usage.length,
        model: usage.map((u) => u.model_id).filter(Boolean)[0] || null,
        signalCount: signals.length,
        signalLabels: [...new Set(signals.map((s) => s.label).filter(Boolean))].join(", "),
        userMessage: n.user_message || null
    };
});
