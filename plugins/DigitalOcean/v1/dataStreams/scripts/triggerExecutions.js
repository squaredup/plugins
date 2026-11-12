// Adds a run duration from the execution's created and updated times
result = (data.executions || []).map((e) => ({
    id: e.execution_id,
    status: e.status,
    failureReason: e.failure_reason || null,
    sessionId: e.session_id || null,
    outputTruncated: e.output_truncated ?? null,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    durationSeconds: e.created_at && e.updated_at && ["succeeded", "failed"].includes(e.status) ? (Date.parse(e.updated_at) - Date.parse(e.created_at)) / 1000 : null
}));
