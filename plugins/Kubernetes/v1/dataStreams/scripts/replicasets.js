const rows = (data.items || []).map((item) => {
    const owner = ((item.metadata && item.metadata.ownerReferences) || []).find(
        (ref) => ref.controller === true,
    );

    return {
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        ownerUid: owner ? owner.uid : undefined,
        desiredReplicas: (item.spec && item.spec.replicas) || 0,
        readyReplicas: (item.status && item.status.readyReplicas) || 0,
    };
});

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.deployment) || [];
const deploymentUids = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

result = deploymentUids.size
    ? rows.filter((r) => deploymentUids.has(r.ownerUid))
    : rows;
