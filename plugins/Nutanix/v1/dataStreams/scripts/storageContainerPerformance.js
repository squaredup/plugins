// Storage container stats come back as one { timestamp, value } array per metric, with names
// cased differently from cluster and host stats (kBps, uSecs). This pivots them into one row
// per timestamp, and reduces them to one row when a summary is selected.
const stats = (data && data.data) || {};
const object = context.objects[0] || {};
const summary = (context.config && context.config.summary) || 'timeline';

const same = (v) => v;
const toGiB = (v) => v / 1073741824;
const toTiB = (v) => v / 1099511627776;

const metrics = {
    usedTiB: ['storageUsageBytes', toTiB],
    freeTiB: ['storageFreeBytes', toTiB],
    capacityTiB: ['storageCapacityBytes', toTiB],
    // A saving ratio in parts per million: 1,500,000 means 1.5:1.
    dataReductionRatio: ['dataReductionSavingRatioPpm', (v) => v / 1e6],
    dataReductionSavedTiB: ['dataReductionSavedBytes', toTiB],
    snapshotReclaimableGiB: ['storageSnapshotReclaimable', toGiB],
    iops: ['controllerNumIops', same],
    readIops: ['controllerNumReadIops', same],
    writeIops: ['controllerNumWriteIops', same],
    latencyMs: ['controllerAvgIoLatencyuSecs', (v) => v / 1000],
    bandwidthKBps: ['controllerIoBandwidthkBps', same]
};

const rowsByTime = new Map();
for (const [column, [metric, convert]] of Object.entries(metrics)) {
    for (const point of stats[metric] || []) {
        if (!point || typeof point.value !== 'number') {
            continue;
        }
        const row = rowsByTime.get(point.timestamp) || { timestamp: point.timestamp };
        row[column] = convert(point.value);
        rowsByTime.set(point.timestamp, row);
    }
}

let rows = [...rowsByTime.values()].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

if (summary !== 'timeline' && rows.length > 1) {
    const reduced = { timestamp: rows[rows.length - 1].timestamp };
    for (const column of Object.keys(metrics)) {
        const values = rows.map((row) => row[column]).filter((v) => typeof v === 'number');
        if (values.length === 0) {
            continue;
        }
        if (summary === 'peak') {
            reduced[column] = Math.max(...values);
        } else if (summary === 'latest') {
            reduced[column] = values[values.length - 1];
        } else {
            reduced[column] = values.reduce((sum, v) => sum + v, 0) / values.length;
        }
    }
    rows = [reduced];
}

result = rows.map((row) => ({
    ...row,
    containerExtId: object.rawId,
    containerName: object.name,
    usagePercent: typeof row.usedTiB === 'number' && row.capacityTiB ? (row.usedTiB / row.capacityTiB) * 100 : null
}));
