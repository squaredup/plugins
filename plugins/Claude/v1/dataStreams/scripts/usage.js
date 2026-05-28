const selectedModel = context.config.model || null;

result = (data.data || []).flatMap((bucket) =>
    (bucket.results || [])
        .filter((r) => !selectedModel || r.model === selectedModel)
        .map((r) => ({
            timestamp: bucket.starting_at,
            workspace_id: r.workspace_id || null,
            model: r.model || null,
            api_key_id: r.api_key_id || null,
            input_tokens: r.uncached_input_tokens || 0,
            cache_read_tokens: r.cache_read_input_tokens || 0,
            cache_creation_tokens:
                (r.cache_creation?.ephemeral_1h_input_tokens || 0) +
                (r.cache_creation?.ephemeral_5m_input_tokens || 0),
            output_tokens: r.output_tokens || 0,
            total_tokens:
                (r.uncached_input_tokens || 0) +
                (r.cache_read_input_tokens || 0) +
                (r.output_tokens || 0),
        }))
);
