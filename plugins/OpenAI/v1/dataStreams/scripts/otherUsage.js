// otherUsage.js — normalise the per-type usage shapes into common columns.
// Each type reports a different main measure; pick it and label its unit.

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const usageType = (context.config && context.config.usageType) || "embeddings";

const MEASURES = {
    embeddings: { field: "input_tokens", unit: "tokens" },
    moderations: { field: "input_tokens", unit: "tokens" },
    images: { field: "images", unit: "images" },
    audio_speeches: { field: "characters", unit: "characters" },
    audio_transcriptions: { field: "seconds", unit: "seconds" },
    vector_stores: { field: "usage_bytes", unit: "bytes" },
    code_interpreter_sessions: { field: "num_sessions", unit: "sessions" },
    file_search_calls: { field: "num_requests", unit: "calls" },
    web_search_calls: { field: "num_model_requests", unit: "calls" },
};
const measure = MEASURES[usageType] || { field: "num_model_requests", unit: "requests" };

// Empty selection means organization-wide, no filter
// An unset picker can arrive as null, "" or {} rather than an empty array
const picked = context.config && context.config.project;
const selected = Array.isArray(picked) ? picked : [];
const projectIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

let rows = (data.data || []).flatMap((bucket) =>
    (bucket.results || []).map((r) => {
        const { object, ...extra } = r;
        return {
            ...extra,
            // The API returns Unix seconds; SquaredUp expects ISO 8601
            date: new Date(bucket.start_time * 1000).toISOString(),
            usageType,
            model: r.model,
            project_id: r.project_id,
            // File search reports num_requests and code interpreter num_sessions instead of num_model_requests
            requests: r.num_model_requests ?? r.num_requests ?? r.num_sessions,
            quantity: r[measure.field],
            unit: measure.unit,
        };
    }),
);

if (projectIds.size) {
    rows = rows.filter((r) => projectIds.has(r.project_id));
}

result = rows;
