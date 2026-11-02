// One row per signal detected in a session's turns; confidence can arrive as a string
result = (data.edges || []).map((e) => e.node).filter(Boolean).flatMap((n) =>
    (n.signals || []).map((s, i) => ({
        id: `${n.id}-${i}`,
        turn: n.sequence === undefined ? null : Number(n.sequence),
        createdAt: n.created_at || null,
        category: s.category || null,
        label: s.label || null,
        signalType: s.signal_type || null,
        layer: s.layer || null,
        confidence: s.confidence === undefined || s.confidence === null ? null : Number(s.confidence),
        snippet: s.snippet || null,
        stepIndex: s.step_index ?? null
    }))
);
