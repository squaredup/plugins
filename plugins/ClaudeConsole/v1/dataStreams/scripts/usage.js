const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

// Build set of selected workspace rawIds (empty → account-wide, no filter)
const selected = (context.config && context.config.workspace) || [];
const workspaceIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

// Flatten nested time-bucket response: data[].results[] → one row per bucket×group
let rows = (data.data || []).flatMap(function (bucket) {
    var results = bucket.results;
    if (!results || results.length === 0) return [];
    return results.map(function (r) {
        var uncached = r.uncached_input_tokens || 0;
        var cacheRead = r.cache_read_input_tokens || 0;
        var creation5m =
            (r.cache_creation && r.cache_creation.ephemeral_5m_input_tokens) ||
            0;
        var creation1h =
            (r.cache_creation && r.cache_creation.ephemeral_1h_input_tokens) ||
            0;
        var output = r.output_tokens || 0;
        return {
            start: bucket.starting_at,
            uncached_input_tokens: uncached,
            cache_read_input_tokens: cacheRead,
            cache_creation_5m: creation5m,
            cache_creation_1h: creation1h,
            output_tokens: output,
            web_search_requests:
                (r.server_tool_use && r.server_tool_use.web_search_requests) ||
                0,
            total_tokens:
                uncached + cacheRead + creation5m + creation1h + output,
            model: r.model || null,
            workspace_id: r.workspace_id || "default",
            api_key_id: r.api_key_id || null,
            service_tier: r.service_tier || null,
            context_window: r.context_window || null,
        };
    });
});

// Apply optional workspace scope filter
if (workspaceIds.size) {
    rows = rows.filter((r) => workspaceIds.has(r.workspace_id));
}

result = rows;

