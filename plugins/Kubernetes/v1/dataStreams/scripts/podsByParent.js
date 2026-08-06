function computeContainerHealth(pod) {
    const phase = pod.status && pod.status.phase;
    const statuses = (pod.status && pod.status.containerStatuses) || [];

    for (const cs of statuses) {
        const waitingReason =
            cs.state && cs.state.waiting && cs.state.waiting.reason;
        if (waitingReason === "CrashLoopBackOff") return "crashloop";
        if (waitingReason) return "waiting:" + waitingReason;

        const terminatedReason =
            cs.state && cs.state.terminated && cs.state.terminated.reason;
        if (terminatedReason === "OOMKilled") return "crashloop";
    }

    if (phase === "Running") return "healthy";
    if (phase === "Pending") return "pending";
    return phase ? phase.toLowerCase() : "unknown";
}

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const ownerName = context.objects[0].name;
const ownerNamespace = unwrap(context.objects[0].namespace);
const selectorAppLabel = unwrap(context.objects[0].selectorAppLabel);

let items = data.items || [];

if (ownerNamespace) {
    if (selectorAppLabel !== undefined) {
        items = items.filter((item) => {
            const labels = (item.metadata && item.metadata.labels) || {};
            const podAppLabel =
                labels["app"] ||
                labels["app.kubernetes.io/name"] ||
                labels["k8s-app"] ||
                undefined;

            return (
                podAppLabel !== undefined && podAppLabel === selectorAppLabel
            );
        });
    } else {
        const ownerUid = unwrap(context.objects[0].uid);
        items = items.filter((item) => {
            const owner = ((item.metadata && item.metadata.ownerReferences) ||
                []).find((ref) => ref.controller === true);
            return owner && owner.uid === ownerUid;
        });
    }
}

result = items.map((item) => ({
    uid: item.metadata.uid,
    name: item.metadata.name,
    namespace: item.metadata.namespace,
    nodeName: item.spec && item.spec.nodeName,
    ownerName: ownerName,
    phase: item.status && item.status.phase,
    containerHealth: computeContainerHealth(item),
}));
