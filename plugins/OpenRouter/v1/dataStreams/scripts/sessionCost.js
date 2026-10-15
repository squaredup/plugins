// Labels session lengths (with a sort order, as "10-49 turns" sorts before
// "2-9 turns" alphabetically), applies the optional `models` object picker,
// and adds the as-of date and citation OpenRouter requires to every row.
const lengths = {
    '1-turn': ['1 turn', 1],
    '2-9-turns': ['2–9 turns', 2],
    '10-49-turns': ['10–49 turns', 3],
    '50-plus-turns': ['50+ turns', 4],
};

// Selected Model objects arrive with each property as a single-element array.
// Match on permaslug, as a :free model's session costs differ from its base's.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const slugs = new Set((context.config?.models ?? []).map((o) => unwrap(o.permaslug)).filter(Boolean));

const asOf = data?.meta?.as_of;
const citation = `Source: OpenRouter (openrouter.ai/rankings), as of ${asOf}. Licensed under CC BY 4.0.`;

result = (data?.data ?? [])
    .filter((r) => !slugs.size || slugs.has(r.model_permaslug))
    .map((r) => {
        const [sessionLength, sessionLengthOrder] = lengths[r.turn_range] ?? [r.turn_range, null];

        return { ...r, sessionLength, sessionLengthOrder, asOf, citation };
    });
