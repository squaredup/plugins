// dataStreams/scripts/deviceAssets.js
//
// GET api/devices/{deviceId}/assets returns a bag of asset categories, each
// either a singleton object (e.g. "os", "processor") or a { list: [...] }
// array (e.g. "application", "memory"). A near-duplicate set of the same
// category names is repeated under "_extra" with a different (usually
// complementary, occasionally overlapping) set of fields for the same
// entities. Flatten everything into one row per discrete asset item, tagged
// with which category it came from.
const body = (data && data.data) || {};
const extra = body._extra || {};

// Organizational/hierarchy context, not device asset info - already covered
// by the customers/sites data streams.
const skipCategories = new Set(["customer", "site", "socustomer"]);

function nameFor(category, item) {
    return (
        item.displayname ||
        item.caption ||
        item.name ||
        item.description ||
        item.title ||
        item.model ||
        item.modelnumber ||
        item.volumename ||
        item.servicename ||
        item.longname ||
        item.netbiosname ||
        item.reportedos ||
        item.product ||
        item.sharename ||
        item.partnumber ||
        item.uniqueid ||
        category
    );
}

const rows = [];
const counters = {};

function addItem(category, item) {
    if (!item) {
        return;
    }
    const { _index, ...details } = item;
    const i = (counters[category] = (counters[category] || 0) + 1);
    // Spread the raw fields first, then set our own columns last so a raw
    // field that happens to share a name (e.g. "patch" items have their own
    // "category" field, a UUID) can never clobber the synthetic ones below.
    rows.push({
        ...details,
        category,
        name: nameFor(category, item),
        id: `${category}-${i}`,
    });
}

// Singleton categories describe the device itself; top-level and "_extra"
// hold different (non-overlapping) fields for the same entity, so merge them
// into a single row per category instead of emitting two.
["device", "computersystem", "os", "processor", "motherboard"].forEach(
    (key) => {
        const merged = Object.assign({}, body[key] || {}, extra[key] || {});
        if (Object.keys(merged).length > 0) {
            addItem(key, merged);
        }
    },
);

// List categories: prefer "_extra"'s version when both exist (it's a strict
// superset for "application"); otherwise use whichever side has the list.
const listKeys = new Set([
    ...Object.keys(body).filter(
        (k) => k !== "_extra" && body[k] && Array.isArray(body[k].list),
    ),
    ...Object.keys(extra).filter(
        (k) => extra[k] && Array.isArray(extra[k].list),
    ),
]);

listKeys.forEach((key) => {
    if (skipCategories.has(key)) {
        return;
    }
    const list =
        extra[key] && Array.isArray(extra[key].list)
            ? extra[key].list
            : body[key] && body[key].list;
    (list || []).forEach((item) => addItem(key, item));
});

result = rows;
