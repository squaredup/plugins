result = (data.data || []).flatMap((bucket) =>
    (bucket.results || []).map((r) => ({
        timestamp: bucket.starting_at,
        workspace_id: r.workspace_id || 'default',
        amount_usd: (r.amount || 0) / 100,
    }))
);
