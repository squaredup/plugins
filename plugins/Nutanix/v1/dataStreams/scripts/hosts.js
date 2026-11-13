const value = (v) => (v === undefined ? null : v);
const ipv4 = (address) => (address && address.ipv4 && address.ipv4.value) || null;

const statusOf = (host, hypervisor, controllerVm) => {
    if (hypervisor.acropolisConnectionState === 'DISCONNECTED') {
        return 'Disconnected';
    }
    if (controllerVm.isInMaintenanceMode || /MAINTENANCE/.test(hypervisor.state || '')) {
        return 'Maintenance';
    }
    if (host.isDegraded) {
        return 'Degraded';
    }
    if (host.isRebootPending) {
        return 'Reboot pending';
    }
    return 'Normal';
};

result = ((data && data.data) || []).map((host) => {
    const hypervisor = host.hypervisor || {};
    const controllerVm = host.controllerVm || {};
    const cluster = host.cluster || {};

    return {
        extId: host.extId,
        hostName: host.hostName,
        status: statusOf(host, hypervisor, controllerVm),
        // The host list refers to its cluster by `uuid`, which is the cluster's extId.
        clusterExtId: cluster.uuid || null,
        clusterName: cluster.name || null,
        hostType: host.hostType || null,
        hypervisorType: hypervisor.type || null,
        hypervisorVersion: hypervisor.fullName || null,
        hypervisorState: hypervisor.state || null,
        vmCount: value(hypervisor.numberOfVms),
        cpuModel: host.cpuModel || null,
        cpuSockets: value(host.numberOfCpuSockets),
        cpuCores: value(host.numberOfCpuCores),
        cpuThreads: value(host.numberOfCpuThreads),
        cpuCapacityGhz: typeof host.cpuCapacityHz === 'number' ? host.cpuCapacityHz / 1e9 : null,
        memoryGiB: typeof host.memorySizeBytes === 'number' ? host.memorySizeBytes / 1073741824 : null,
        cvmIp: ipv4(controllerVm.externalAddress),
        hypervisorIp: ipv4(hypervisor.externalAddress),
        ipmiIp: ipv4(host.ipmi && host.ipmi.ip),
        blockModel: host.blockModel || null,
        blockSerial: host.blockSerial || null,
        isRebootPending: value(host.isRebootPending)
    };
});
