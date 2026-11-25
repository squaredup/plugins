// sources and destinations are arrays of objects; reduce them to lists of primitives.
result = (data?.event_subscriptions || []).map((s) => ({
    id: s.id,
    description: s.description || s.id,
    eventTypes: (s.sources || []).map((src) => src.type),
    destinationIds: (s.destinations || []).map((dst) => dst.id),
    destinationCount: (s.destinations || []).length,
    created_at: s.created_at,
}));
