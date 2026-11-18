// Signals pages are GraphQL-style edges; each node is one recorded conversation
result = (data.edges || []).map((e) => e.node).filter(Boolean).map((n) => ({
    sessionId: n.session_id,
    startedAt: n.started_at,
    totalTurns: n.total_turns ?? null,
    durationSeconds: n.duration_seconds ?? null,
    signalCount: n.signal_count ?? 0
}));
