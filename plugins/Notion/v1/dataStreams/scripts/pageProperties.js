// GET /v1/pages/{id} returns a single page object. Flatten its properties bag
// into a plain row so custom fields become columns. Copied helpers from dataSourceRows.js.
const plain = (rich) => (rich || []).map((t) => t.plain_text).join("");

const valueOf = (prop) => {
    if (!prop) return null;
    switch (prop.type) {
        case "title":
            return plain(prop.title);
        case "rich_text":
            return plain(prop.rich_text);
        case "number":
            return prop.number;
        case "select":
            return prop.select ? prop.select.name : null;
        case "status":
            return prop.status ? prop.status.name : null;
        case "multi_select":
            return (prop.multi_select || []).map((s) => s.name).join(", ");
        case "date":
            return prop.date ? prop.date.start : null;
        case "checkbox":
            return prop.checkbox;
        case "url":
            return prop.url;
        case "email":
            return prop.email;
        case "phone_number":
            return prop.phone_number;
        case "people":
            return (prop.people || []).map((p) => p.name || p.id).join(", ");
        case "files":
            return (prop.files || []).map((f) => f.name).join(", ");
        case "created_time":
            return prop.created_time;
        case "last_edited_time":
            return prop.last_edited_time;
        case "created_by":
            return prop.created_by ? prop.created_by.name || prop.created_by.id : null;
        case "last_edited_by":
            return prop.last_edited_by ? prop.last_edited_by.name || prop.last_edited_by.id : null;
        case "unique_id":
            return prop.unique_id
                ? (prop.unique_id.prefix ? prop.unique_id.prefix + "-" : "") + prop.unique_id.number
                : null;
        case "formula":
            return prop.formula
                ? prop.formula.string ??
                      prop.formula.number ??
                      prop.formula.boolean ??
                      (prop.formula.date ? prop.formula.date.start : null)
                : null;
        case "rollup":
            if (!prop.rollup) return null;
            if (prop.rollup.type === "array") {
                return (prop.rollup.array || []).map((item) => valueOf(item)).filter((v) => v != null).join(", ");
            }
            return prop.rollup.number ?? (prop.rollup.date ? prop.rollup.date.start : null);
        case "relation":
            return (prop.relation || []).map((r) => r.id).join(", ");
        default:
            return null;
    }
};

// data is the single page object returned by GET /v1/pages/{id}
const page = data;
const props = page.properties || {};
const row = {
    id: page.id,
    url: page.url || null,
    createdTime: page.created_time || null,
    lastEditedTime: page.last_edited_time || null
};
let title = "";
for (const key of Object.keys(props)) {
    const prop = props[key];
    const value = valueOf(prop);
    // The title property is surfaced as `name` — don't also emit it as a duplicate column.
    if (prop && prop.type === "title") {
        title = value || title;
        continue;
    }
    row[key] = value;
}
row.name = title || "Untitled";

result = [row];
