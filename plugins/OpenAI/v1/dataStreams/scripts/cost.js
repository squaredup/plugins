// cost.js — flatten bucket × result into one row per combination, split line_item
// into model and cost type, and optionally scope to selected project(s).

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

// Empty selection → organization-wide, no filter
// An unset picker can arrive as null, "" or {} rather than an empty array
const picked = context.config && context.config.project;
const selected = Array.isArray(picked) ? picked : [];
const projectIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

// "gpt-4o-mini-2024-07-18" -> "gpt-4o-mini"; batch line items are prefixed "batch api | "
const familyOf = (model) =>
    model
        .replace(/^batch api \|\s*/i, "")
        .replace(/-\d{4}-\d{2}-\d{2}$/, "")
        .replace(/\s+(image|text)$/i, "")
        .trim();

const categoryOf = (model) => {
    const m = model.toLowerCase();
    if (/search tool calls|code interpreter|container/.test(m)) return "Tools";
    if (/moderation/.test(m)) return "Moderation";
    if (/embedding/.test(m)) return "Embeddings";
    if (/image|dall-e/.test(m)) return "Images";
    if (/tts|whisper|transcribe|audio|realtime/.test(m)) return "Audio";
    if (/vector stor|file search storage/.test(m)) return "Storage";
    return "Chat & text";
};

let rows = (data.data || []).flatMap((bucket) =>
    (bucket.results || []).map((r) => {
        // line_item looks like "gpt-4o-2024-08-06, input"
        const lineItem = r.line_item || "";
        const commaAt = lineItem.indexOf(",");
        const model = commaAt === -1 ? lineItem : lineItem.slice(0, commaAt).trim();
        return {
            date: new Date(bucket.start_time * 1000).toISOString(),
            amount: Number(r.amount && r.amount.value) || 0,
            currency: (r.amount && r.amount.currency) || "usd",
            project_id: r.project_id,
            line_item: r.line_item,
            model,
            modelFamily: familyOf(model),
            category: categoryOf(model),
            batch: /^batch api/i.test(lineItem),
            costType: commaAt === -1 ? "" : lineItem.slice(commaAt + 1).trim(),
            quantity: r.quantity,
            quantity_unit: r.quantity_unit,
        };
    }),
);

if (projectIds.size) {
    rows = rows.filter((r) => projectIds.has(r.project_id));
}

result = rows;
