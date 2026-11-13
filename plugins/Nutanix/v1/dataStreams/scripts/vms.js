const value = (v) => (v === undefined ? null : v);

const ipAddressesOf = (nics) => {
    const addresses = new Set();
    for (const nic of nics || []) {
        const info = nic.networkInfo || {};
        const ipv4Info = info.ipv4Info || {};
        for (const learned of ipv4Info.learnedIpAddresses || []) {
            if (learned && learned.value) {
                addresses.add(learned.value);
            }
        }
        const configured = info.ipv4Config && info.ipv4Config.ipAddress;
        if (configured && configured.value) {
            addresses.add(configured.value);
        }
    }
    return [...addresses];
};

// Only disks backed by a vDisk carry a size; CD-ROMs and volume group attachments don't.
const diskCapacityOf = (disks) =>
    (disks || []).reduce((total, disk) => {
        const size = disk.backingInfo && disk.backingInfo.diskSizeBytes;
        return typeof size === 'number' ? total + size : total;
    }, 0);

const guestToolsStatusOf = (guestTools) => {
    if (!guestTools || !guestTools.isInstalled) {
        return 'Not installed';
    }
    return guestTools.isReachable ? 'Installed' : 'Not reachable';
};

result = ((data && data.data) || []).map((vm) => {
    const guestTools = vm.guestTools || {};
    const sockets = vm.numSockets || 1;
    const coresPerSocket = vm.numCoresPerSocket || 1;

    return {
        extId: vm.extId,
        name: vm.name,
        powerState: vm.powerState || null,
        clusterExtId: (vm.cluster && vm.cluster.extId) || null,
        clusterName: null,
        hostExtId: (vm.host && vm.host.extId) || null,
        hostName: null,
        vCpus: sockets * coresPerSocket,
        numSockets: value(vm.numSockets),
        numCoresPerSocket: value(vm.numCoresPerSocket),
        memoryGiB: typeof vm.memorySizeBytes === 'number' ? vm.memorySizeBytes / 1073741824 : null,
        diskCapacityGiB: diskCapacityOf(vm.disks) / 1073741824,
        diskCount: (vm.disks || []).filter((disk) => disk.backingInfo && typeof disk.backingInfo.diskSizeBytes === 'number').length,
        guestOs: guestTools.guestOsVersion || null,
        guestTools: guestToolsStatusOf(vm.guestTools),
        ipAddresses: ipAddressesOf(vm.nics),
        machineType: vm.machineType || null,
        isAgentVm: value(vm.isAgentVm),
        description: vm.description || null,
        createTime: vm.createTime || null
    };
});
