// Flatten bucket -> results[] into one row per bucket x group
const num = (v) => (typeof v === "number" ? v : 0);

result = (data.data || []).flatMap((bucket) =>
    (bucket.results || []).map((r) => {
        const input = num(r.input_tokens);
        const cached = num(r.input_cached_tokens);
        return {
            date: new Date(bucket.start_time * 1000).toISOString(),
            model: r.model || null,
            project_id: r.project_id || null,
            api_key_id: r.api_key_id || null,
            user_id: r.user_id || null,
            batch: typeof r.batch === "boolean" ? r.batch : null,
            service_tier: r.service_tier || null,
            requests: num(r.num_model_requests),
            input_tokens: input,
            output_tokens: num(r.output_tokens),
            input_cached_tokens: cached,
            input_uncached_tokens: input - cached,
            cacheHitRate: input > 0 ? (cached / input) * 100 : null,
            input_audio_tokens: num(r.input_audio_tokens),
            output_audio_tokens: num(r.output_audio_tokens),
        };
    }),
);
