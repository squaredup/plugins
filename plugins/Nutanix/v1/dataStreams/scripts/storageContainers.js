const value = (v) => (v === undefined ? null : v);
const onOff = (setting) => (setting === 'ON' || setting === 'POST_PROCESS' ? 'On' : 'Off');

// Nutanix-managed containers (NutanixManagementShare, SelfServiceContainer and so on) hold no
// customer workloads, so they are left out.
result = ((data && data.data) || [])
    .filter((container) => !container.isInternal)
    .map((container) => ({
        extId: container.extId,
        // Container names such as "default" repeat across clusters, so the label carries the cluster.
        displayName: container.clusterName ? container.clusterName + ' / ' + container.name : container.name,
        name: container.name,
        clusterExtId: container.clusterExtId || null,
        clusterName: container.clusterName || null,
        maxCapacityTiB: typeof container.maxCapacityBytes === 'number' ? container.maxCapacityBytes / 1099511627776 : null,
        advertisedCapacityTiB: container.logicalAdvertisedCapacityBytes ? container.logicalAdvertisedCapacityBytes / 1099511627776 : null,
        replicationFactor: value(container.replicationFactor),
        compression: container.isCompressionEnabled ? 'On' : 'Off',
        deduplication: onOff(container.onDiskDedup),
        erasureCoding: onOff(container.erasureCode),
        isEncrypted: value(container.isEncrypted),
        isMarkedForRemoval: value(container.isMarkedForRemoval)
    }));
