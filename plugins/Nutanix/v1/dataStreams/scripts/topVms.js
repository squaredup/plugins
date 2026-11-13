// The bulk VM stats endpoint returns each VM with its stats tuples. The request asks for one
// sample covering the whole timeframe, so each VM normally has a single tuple; any extra tuples
// are averaged so a VM is always one row. VM and cluster names come from the imported objects.
const ppmToPercent = (v) => v / 10000;
const same = (v) => v;

const metrics = {
    cpuUsagePercent: ['hypervisorCpuUsagePpm', ppmToPercent],
    cpuReadyPercent: ['hypervisorCpuReadyTimePpm', ppmToPercent],
    memoryUsagePercent: ['memoryUsagePpm', ppmToPercent],
    iops: ['controllerNumIops', same],
    latencyMs: ['controllerAvgIoLatencyMicros', (v) => v / 1000],
    bandwidthKBps: ['controllerIoBandwidthKbps', same]
};

result = ((data && data.data) || []).map((vm) => {
    const tuples = (vm.stats || []).filter(Boolean);
    const row = {
        vmExtId: vm.extId,
        vmName: null,
        clusterExtId: (tuples.find((tuple) => tuple.cluster) || {}).cluster || null,
        clusterName: null
    };
    for (const [column, [metric, convert]] of Object.entries(metrics)) {
        const values = tuples.map((tuple) => tuple[metric]).filter((v) => typeof v === 'number');
        row[column] = values.length ? convert(values.reduce((sum, v) => sum + v, 0) / values.length) : null;
    }
    return row;
});
