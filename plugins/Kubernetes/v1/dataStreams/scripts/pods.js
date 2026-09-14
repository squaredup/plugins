// Kubernetes Quantity grammar: mantissa is [+-]?(digits[.digits?] | .digits),
// exponent accepts lowercase or uppercase e/E, suffix is a binary (Ki..Ei) or
// decimal (n/u/m/k/M/G/T/P/E) multiplier — never both on the same value.
function parseK8sQuantity(qty) {
    if (qty === undefined || qty === null) return undefined;
    const match = String(qty).match(
        /^([+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+))(?:([eE][+-]?[0-9]+)|(Ki|Mi|Gi|Ti|Pi|Ei|n|u|m|k|M|G|T|P|E))?$/,
    );
    if (!match) return undefined;
    const mantissa = parseFloat(match[1]);
    if (Number.isNaN(mantissa)) return undefined;
    if (match[2]) return mantissa * Math.pow(10, parseInt(match[2].slice(1), 10));
    const suffix = match[3] || "";
    if (suffix === "") return mantissa;
    const multipliers = {
        n: 1e-9,
        u: 1e-6,
        m: 1e-3,
        k: 1e3,
        M: 1e6,
        G: 1e9,
        T: 1e12,
        P: 1e15,
        E: 1e18,
        Ki: 1024,
        Mi: 1024 ** 2,
        Gi: 1024 ** 3,
        Ti: 1024 ** 4,
        Pi: 1024 ** 5,
        Ei: 1024 ** 6,
    };
    return mantissa * multipliers[suffix];
}

function parseCpuMillicores(qty) {
    const cores = parseK8sQuantity(qty);
    return cores === undefined ? undefined : cores * 1000;
}

function parseMemoryBytes(qty) {
    return parseK8sQuantity(qty);
}

function sumContainerResource(containers, resourceType, field, parseFn) {
    let total;
    for (const c of containers || []) {
        const raw =
            c.resources &&
            c.resources[resourceType] &&
            c.resources[resourceType][field];
        const parsed = parseFn(raw);
        if (parsed !== undefined) total = (total || 0) + parsed;
    }
    return total;
}

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

result = (data.items || []).map((item) => {
    const owner = ((item.metadata && item.metadata.ownerReferences) || []).find(
        (ref) => ref.controller === true,
    );
    const labels = (item.metadata && item.metadata.labels) || {};
    const containers = (item.spec && item.spec.containers) || [];
    const containerStatuses =
        (item.status && item.status.containerStatuses) || [];
    const restartCount = containerStatuses.reduce(
        (sum, cs) => sum + (cs.restartCount || 0),
        0,
    );

    return {
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        nodeName: item.spec && item.spec.nodeName,
        ownerUid: owner ? owner.uid : undefined,
        appLabel:
            labels["app"] ||
            labels["app.kubernetes.io/name"] ||
            labels["k8s-app"] ||
            undefined,
        phase: item.status && item.status.phase,
        containerHealth: computeContainerHealth(item),
        restartCount: restartCount,
        cpuRequestMillicores: sumContainerResource(
            containers,
            "requests",
            "cpu",
            parseCpuMillicores,
        ),
        memoryRequestBytes: sumContainerResource(
            containers,
            "requests",
            "memory",
            parseMemoryBytes,
        ),
        cpuLimitMillicores: sumContainerResource(
            containers,
            "limits",
            "cpu",
            parseCpuMillicores,
        ),
        memoryLimitBytes: sumContainerResource(
            containers,
            "limits",
            "memory",
            parseMemoryBytes,
        ),
    };
});
