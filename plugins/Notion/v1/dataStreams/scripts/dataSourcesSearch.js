// POST /v1/search (filter data_source) returns paged results accumulated under
// data.results. The title is a rich-text array; flatten it to plain text.
result = (data.results || []).map((ds) => ({
    id: ds.id,
    name: (ds.title || []).map((t) => t.plain_text).join("").trim() || "Untitled",
    createdTime: ds.created_time || null,
    lastEditedTime: ds.last_edited_time || null,
    url: ds.url || null,
    parentDatabaseId: (ds.parent && ds.parent.database_id) || null
}));
