// Serialises the epoch timestamps /v2/queries/os-patch-installs returns, and tags each row
// with the organization it was requested for.
//
// The endpoint only returns deviceId, so without the tag a tile scoped to several
// organizations (one request each) couldn't group or filter installs by organization.
// Filtering itself is server-side (df, installedAfter/installedBefore) - see osPatchInstalls.js
// for why collectionWindow.js isn't used.
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));
const org = (context.objects && context.objects[0]) || {};

const EPOCH_FIELDS = ['timestamp', 'installedAt'];

const toIso = (value) =>
    typeof value === 'number' && value > 1000000000 && value < 10000000000
        ? new Date(value * 1000).toISOString()
        : value;

result = items.map((item) => {
    const row = { ...item };
    EPOCH_FIELDS.forEach((field) => {
        if (field in row) {
            row[field] = toIso(row[field]);
        }
    });
    row.organizationId = org.organizationId != null ? String(org.organizationId) : null;
    row.organizationName = org.name != null ? String(org.name) : null;
    return row;
});
