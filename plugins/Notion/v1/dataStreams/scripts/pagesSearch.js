// POST /v1/search (filter page) returns paged results accumulated under
// data.results. A page's title lives in a dynamically-named property whose
// type is "title" — scan the properties bag to find it.
const titleOf = (page) => {
    const props = page.properties || {};
    for (const key of Object.keys(props)) {
        const p = props[key];
        if (p && p.type === "title" && Array.isArray(p.title)) {
            return p.title.map((t) => t.plain_text).join("").trim();
        }
    }
    return "";
};

const rows = (data.results || []).map((page) => {
    const parent = page.parent || {};
    return {
        id: page.id,
        name: titleOf(page) || "Untitled",
        createdTime: page.created_time || null,
        lastEditedTime: page.last_edited_time || null,
        url: page.url || null,
        parentType: parent.type || null,
        parentDataSourceId: parent.data_source_id || null
    };
});

// Optional scope filter: page(s) or data source(s) selected via the ui "scope" picker.
// context.config.scope is an array of object envelopes; each rawId may itself be a
// single-element array — unwrap it before comparing.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.scope) || [];
const selectedIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

result = selectedIds.size
    ? rows.filter((r) => selectedIds.has(r.id) || selectedIds.has(r.parentDataSourceId))
    : rows;
