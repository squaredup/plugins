// Host stats come back as one { timestamp, value } array per metric. This pivots them into
// one row per timestamp. With a summary selected, the API is asked for one sample covering the
// whole timeframe; if it returns more than one anyway, they are reduced here to a single row.
const stats = (data && data.data) || {};
const object = context.objects[0] || {};
const summary = (context.config && context.config.summary) || 'timeline';

const ppmToPercent = (v) => v / 10000;
const usecsToMs = (v) => v / 1000;
const same = (v) => v;
const toGiB = (v) => v / 1073741824;
const toTiB = (v) => v / 1099511627776;

const metrics = {
    cpuUsagePercent: ['hypervisorCpuUsagePpm', ppmToPercent],
    memoryUsagePercent: ['overallMemoryUsagePpm', ppmToPercent],
    iops: ['controllerNumIops', same],
    readIops: ['controllerNumReadIops', same],
    writeIops: ['controllerNumWriteIops', same],
    latencyMs: ['controllerAvgIoLatencyUsecs', usecsToMs],
    readLatencyMs: ['controllerAvgReadIoLatencyUsecs', usecsToMs],
    writeLatencyMs: ['controllerAvgWriteIoLatencyUsecs', usecsToMs],
    bandwidthKBps: ['ioBandwidthKbps', same],
    storageUsedTiB: ['storageUsageBytes', toTiB],
    storageCapacityTiB: ['storageCapacityBytes', toTiB],
    storageFreeTiB: ['freePhysicalStorageBytes', toTiB],
    memoryUsedGiB: ['overallMemoryUsageBytes', toGiB],
    memoryCapacityGiB: ['memoryCapacityBytes', toGiB],
    powerWatts: ['powerConsumptionInstantWatt', same],
    // Nutanix reports -1 when the NCC score is unknown.
    healthScore: ['healthCheckScore', (v) => (v < 0 ? null : v)]
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
        if (column === 'healthScore' && summary !== 'latest') {
            // When several samples come back, keep the worst score so a summary doesn't hide a dip.
            // A single summary sample is whatever $statType gives (best score for Peak).
            reduced[column] = Math.min(...values);
        } else if (summary === 'peak') {
            reduced[column] = Math.max(...values);
        } else if (summary === 'latest') {
            reduced[column] = values[values.length - 1];
        } else {
            reduced[column] = values.reduce((sum, v) => sum + v, 0) / values.length;
        }
    }
    rows = [reduced];
}

// Health score to state, using the bands Nutanix documents for NCC: Good 100, Info 98,
// Warning 74, Critical 24, Error 13.
const healthOf = (score) => {
    if (typeof score !== 'number') {
        return 'Unknown';
    }
    if (score >= 98) {
        return 'Good';
    }
    return score >= 74 ? 'Warning' : 'Critical';
};

result = rows.map((row) => ({
    ...row,
    hostExtId: object.rawId,
    hostName: object.name,
    storageUsagePercent:
        typeof row.storageUsedTiB === 'number' && row.storageCapacityTiB
            ? (row.storageUsedTiB / row.storageCapacityTiB) * 100
            : null,
    health: healthOf(row.healthScore)
}));
