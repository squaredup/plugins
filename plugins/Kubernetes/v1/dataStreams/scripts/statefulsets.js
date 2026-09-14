result = (data.items || []).map((item) => {
    const desiredReplicas = (item.spec && item.spec.replicas) || 0;
    const readyReplicas = (item.status && item.status.readyReplicas) || 0;

    const statefulSetHealth =
        readyReplicas === desiredReplicas
            ? "success"
            : readyReplicas < desiredReplicas
              ? "error"
              : "unknown";

    return {
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        desiredReplicas,
        readyReplicas,
        statefulSetHealth,
    };
});
