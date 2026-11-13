const value = (v) => (v === undefined ? null : v);
const ipv4 = (address) => (address && address.ipv4 && address.ipv4.value) || null;

// Prism Central lists itself as a cluster whose function is PRISM_CENTRAL. It runs no
// workload, so it is left out rather than shown as an empty cluster.
const isPrismCentral = (cluster) => ((cluster.config && cluster.config.clusterFunction) || []).includes('PRISM_CENTRAL');

const statusOf = (config, faultTolerance) => {
    if (config.isAvailable === false) {
        return 'Unavailable';
    }
    if (config.operationMode && config.operationMode !== 'NORMAL') {
        return 'Degraded';
    }
    if (
        typeof faultTolerance.currentMaxFaultTolerance === 'number' &&
        typeof faultTolerance.desiredMaxFaultTolerance === 'number' &&
        faultTolerance.currentMaxFaultTolerance < faultTolerance.desiredMaxFaultTolerance
    ) {
        return 'Reduced resilience';
    }
    return 'Available';
};

result = ((data && data.data) || [])
    .filter((cluster) => !isPrismCentral(cluster))
    .map((cluster) => {
        const config = cluster.config || {};
        const faultTolerance = config.faultToleranceState || {};
        const network = cluster.network || {};

        return {
            extId: cluster.extId,
            name: cluster.name,
            status: statusOf(config, faultTolerance),
            aosVersion: (config.buildInfo && config.buildInfo.version) || null,
            hypervisorTypes: config.hypervisorTypes || [],
            nodeCount: cluster.nodes ? value(cluster.nodes.numberOfNodes) : null,
            vmCount: value(cluster.vmCount),
            inefficientVmCount: value(cluster.inefficientVmCount),
            redundancyFactor: value(config.redundancyFactor),
            currentFaultTolerance: value(faultTolerance.currentMaxFaultTolerance),
            desiredFaultTolerance: value(faultTolerance.desiredMaxFaultTolerance),
            isAvailable: value(config.isAvailable),
            operationMode: config.operationMode || null,
            upgradeStatus: cluster.upgradeStatus || null,
            externalAddress: ipv4(network.externalAddress),
            fqdn: network.fqdn || null,
            isLts: value(config.isLts),
            timezone: config.timezone || null
        };
    });
