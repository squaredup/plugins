// VM stats come back as one tuple per timestamp, with every metric as a sibling key, which is
// already row-shaped; the script converts units and reduces to one row when a summary is selected.
const vmStats = (data && data.data) || {};
const object = context.objects[0] || {};
const summary = (context.config && context.config.summary) || 'timeline';

const ppmToPercent = (v) => v / 10000;
const same = (v) => v;
const toGiB = (v) => v / 1073741824;
const toMiB = (v) => v / 1048576;

const metrics = {
    cpuUsagePercent: ['hypervisorCpuUsagePpm', ppmToPercent],
    cpuReadyPercent: ['hypervisorCpuReadyTimePpm', ppmToPercent],
    memoryUsagePercent: ['memoryUsagePpm', ppmToPercent],
    guestMemoryUsagePercent: ['guestMemoryUsagePpm', ppmToPercent],
    diskUsagePercent: ['diskUsagePpm', ppmToPercent],
    diskCapacityGiB: ['diskCapacityBytes', toGiB],
    iops: ['controllerNumIops', same],
    readIops: ['controllerNumReadIops', same],
    writeIops: ['controllerNumWriteIops', same],
    latencyMs: ['controllerAvgIoLatencyMicros', (v) => v / 1000],
    bandwidthKBps: ['controllerIoBandwidthKbps', same],
    networkReceivedMiB: ['hypervisorNumReceivedBytes', toMiB],
    networkTransmittedMiB: ['hypervisorNumTransmittedBytes', toMiB]
};

let rows = (vmStats.stats || [])
    .filter((tuple) => tuple && tuple.timestamp)
    .map((tuple) => {
        const row = { timestamp: tuple.timestamp };
        for (const [column, [metric, convert]] of Object.entries(metrics)) {
            if (typeof tuple[metric] === 'number') {
                row[column] = convert(tuple[metric]);
            }
        }
        return row;
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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

result = rows.map((row) => ({ ...row, vmExtId: object.rawId, vmName: object.name }));
