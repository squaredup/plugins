// Serialises the epoch timestamps /v2/queries/os-patch-installs returns.
//
// Unlike the snapshot queries, this endpoint is install history filtered server-side by
// installedAfter/installedBefore, so collectionWindow.js's upper-bound trim on `timestamp`
// would be wrong here: it would drop installs inside the window whose record was collected
// after it.
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));

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
    return row;
});
