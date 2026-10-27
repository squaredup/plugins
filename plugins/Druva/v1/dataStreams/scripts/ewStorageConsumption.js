// Optional `customer` object picker; empty means all customers.
// The Customer sourceId is the Druva customerGlobalId, so rawId compares directly.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.customer) || [];
const customerIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

// Druva returns sizes as unit-suffixed strings ("3.16GB", "13.50KB") and "--"
// when there is no value. Convert to bytes so the columns are sortable/summable.
const UNITS = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5 };
const toBytes = (s) => {
    const m = /^\s*([\d.,]+)\s*([KMGTP]?B)\s*$/i.exec(s || "");
    return m ? Math.round(parseFloat(m[1].replace(/,/g, "")) * UNITS[m[2].toUpperCase()]) : null;
};

// storageSourceReductionFactor looks like "<account>_<region>(19.9x)".
const parseReduction = (s) => {
    const m = /^(.*)_([^_()]+)\(([\d.]+)x\)\s*$/.exec(s || "");
    return m
        ? { region: m[2], factor: parseFloat(m[3]) }
        : { region: null, factor: null };
};

// "WARM" and "Warm" both occur; normalise the casing.
const tidyTier = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t);

result = (data.data || [])
    .filter((r) => !customerIds.size || customerIds.has(r.customerGlobalId))
    .map((r) => {
        const reduction = parseReduction(r.storageSourceReductionFactor);
        return {
            dcpUniqueKey: r.dcpUniqueKey,
            customerGlobalId: r.customerGlobalId,
            customerName: r.customerName,
            accountName: r.accountName,
            administrativeGroup: r.administrativeGroup,
            organization: r.organization,
            backupset: r.backupset,
            backupsetType: r.backupsetType,
            backupPolicy: r.backupPolicy,
            backupContent: r.backupContent,
            storageCloud: r.storageCloud,
            storageRegion: reduction.region,
            storageTier: tidyTier(r.storageTier),
            currentSource: toBytes(r.currentSource),
            sourceChanges: toBytes(r.sourceChanges),
            estimatedStorage: toBytes(r.estimatedStorage),
            reductionFactor: reduction.factor,
            lastUpdatedTime: r.lastUpdatedTime,
        };
    });

// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor, re-requests with `pageToken=`, and trips the paging loop guard.
// Normalise the empty string to undefined here to end paging.
pagingContext = data.nextPageToken || undefined;
