// GET /v1/comments?block_id=<pageId> returns paged results under data.results.
// Each comment has: id, created_time, created_by: { object: "user", id },
// rich_text: [{ plain_text, ... }], parent.
// Join all plain_text segments to produce a single text string per comment.

result = (data.results || []).map((comment) => ({
    id: comment.id,
    createdTime: comment.created_time || null,
    createdById: (comment.created_by && comment.created_by.id) || null,
    text: (comment.rich_text || []).map((rt) => rt.plain_text || "").join("").trim() || null
}));
