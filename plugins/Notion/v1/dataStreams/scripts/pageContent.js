// blocks/{{pageId}}/children returns top-level blocks only (nested children require
// separate calls per block — not fetched here). Each block has a `type` key and a
// same-named property containing a `rich_text` array (for text-bearing types) and
// optionally a `checked` boolean (to_do blocks only).
const TEXT_TYPES = new Set([
    "paragraph",
    "heading_1",
    "heading_2",
    "heading_3",
    "bulleted_list_item",
    "numbered_list_item",
    "to_do",
    "toggle",
    "quote",
    "callout",
    "code"
]);

const plain = (richText) =>
    (richText || []).map((t) => t.plain_text || "").join("");

result = (data.results || []).map((block) => {
    const type = block.type;
    const blockData = block[type] || {};
    const text = TEXT_TYPES.has(type) ? plain(blockData.rich_text) : "";
    const checked = type === "to_do" ? (blockData.checked === true) : null;
    return {
        type,
        text,
        checked,
        hasChildren: block.has_children === true
    };
});
