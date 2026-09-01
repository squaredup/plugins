// dataStreams/scripts/deviceInventory.js
//
// The inventory response nests through arbitrarily-named groups
// (category -> sub_categories -> named group -> data[]), so walk generically
// rather than hardcoding group names - flatten every "data" array found into
// one row per attribute.
const rows = [];

function walk(node, path) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.data)) {
        for (const item of node.data) {
            const value = Array.isArray(item.value) ? JSON.stringify(item.value) : item.value;
            rows.push({
                group: path.join(" > "),
                name: item.friendly_name || item.name,
                value,
                type: item.type,
                collectedAt: item.collected_at,
            });
        }
        return;
    }
    for (const [key, child] of Object.entries(node)) {
        if (key === "sub_categories" || key === "categories") {
            walk(child, path);
        } else if (child && typeof child === "object") {
            walk(child, path.concat(key));
        }
    }
}

for (const item of data || []) {
    walk(item && item.categories, []);
}

result = rows;
