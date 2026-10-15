// NetBox GraphQL returns { data: { <query_field>: [ ...items ] } } for list queries
// (e.g. site_list) or { data: { <query_field>: { ... } } } for single-object queries.
// The query is user-supplied, so the columns are unknown in advance and must be built dynamically here.
//
// Row source: the first array found in `data.data` (in key order). If a top-level value is an object
// that wraps a list under a well-known name (results, items, nodes, edges, entries), that list is used.
// If there is no list at all, the single object returned becomes one row.
//
// Flattening: nested objects become dot-notation columns (rack.site.name).
//   - arrays of primitives are joined with ", "
//   - arrays of objects become "<path>.count" plus "<path>", the joined display/name of each item (if any have one)
const WRAPPER_KEYS = ["results", "items", "nodes", "edges", "entries"];
const isObject =(v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isPrimitive = (v) => v === null || typeof v !== "object";

const flatten = (value, path, out) => {
    if (isObject(value)) {
        Object.keys(value).forEach((key) => {
            flatten(value[key], path ? `${path}.${key}` : key, out);
        });
    } else if (Array.isArray(value)) {
        if (value.every(isPrimitive)) {
            out[path] = value.join(", ");
        } else {
            out[`${path}.count`] = value.length;
            out[path] = value
                .map((item) => isObject(item) && (item.display || item.name))
                .filter(Boolean)
                .join(", ");
        }
    } else {
        out[path] = value;
    }
    return out;
};

// GraphQL reports query errors with HTTP 200 and an `errors` array, which errorHandling never sees (it only runs on failed HTTP requests)
if (data && Array.isArray(data.errors) && data.errors.length) {
    throw new Error(data.errors.map((e) => e.message).join("; "));
}

const root = (data && data.data) || {};

let items = null;
for (const key of Object.keys(root)) {
    const value = root[key];
    if (Array.isArray(value)) {
        items = value;
        break;
    }
    if (isObject(value)) {
        // Only well-known wrapper names are unwrapped, otherwise a single object with an array field
        // (e.g. site(id: 1) { name tags { name } }) would be mistaken for a list of its tags
        const inner = Object.keys(value).find((k) => WRAPPER_KEYS.includes(k) && Array.isArray(value[k]));
        if (inner) {
            items = value[inner];
            break;
        }
    }
}

if (items) {
    const rows = items.map((item) => (isObject(item) ? flatten(item, "", {}) : { value: item }));
    // An empty array can't be told apart from an empty primitive list, so it emits no ".count" column.
    // Default that column to 0 on rows that lack it, otherwise the count is blank rather than 0 for empty lists.
    const countCols = new Set();
    rows.forEach((row) => Object.keys(row).forEach((k) => k.endsWith(".count") && countCols.add(k)));
    rows.forEach((row) => countCols.forEach((k) => row[k] === undefined && (row[k] = 0)));
    // A null nested object (e.g. region: null) is emitted as a "region" column, which would sit beside "region.name"
    // from the rows where it is populated. Drop it so only the dotted columns remain (blank where the object is null).
    const allKeys = new Set();
    rows.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));
    const parents = [...allKeys].filter((k) => [...allKeys].some((o) => o.startsWith(`${k}.`)));
    rows.forEach((row) => parents.forEach((k) => row[k] === null && delete row[k]));
    result = rows;
} else {
    const keys = Object.keys(root);
    // A single object field (e.g. site(id: 1) { ... }) is flattened without its field name as a prefix
    const single = keys.length === 1 && isObject(root[keys[0]]) ? root[keys[0]] : root;
    result = keys.length ? [flatten(single, "", {})] : [];
}
