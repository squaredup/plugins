result = (data.items || []).map((item) => {
    const conditions = (item.status && item.status.conditions) || [];
    const available = conditions.find((c) => c.type === "Available");

    return {
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        desiredReplicas: (item.spec && item.spec.replicas) || 0,
        availableReplicas: (item.status && item.status.availableReplicas) || 0,
        availableStatus: available ? available.status : "Unknown",
    };
});
