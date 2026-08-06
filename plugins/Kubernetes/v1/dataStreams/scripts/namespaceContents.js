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

function parseCount(value) {
    return value !== undefined ? parseInt(value, 10) : undefined;
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

const detailType = "{{detailType}}";

result = (data.items || []).map((item) => {
    const base = {
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
    };

    if (detailType === "deployments") {
        const conditions = (item.status && item.status.conditions) || [];
        const available = conditions.find((c) => c.type === "Available");
        return {
            ...base,
            desiredReplicas: (item.spec && item.spec.replicas) || 0,
            availableReplicas:
                (item.status && item.status.availableReplicas) || 0,
            availableStatus: available ? available.status : "Unknown",
        };
    }

    if (detailType === "daemonsets") {
        const desiredNumberScheduled =
            (item.status && item.status.desiredNumberScheduled) || 0;
        const numberReady = (item.status && item.status.numberReady) || 0;
        const daemonSetHealth =
            desiredNumberScheduled === 0
                ? "success"
                : numberReady === desiredNumberScheduled
                  ? "success"
                  : numberReady < desiredNumberScheduled
                    ? "error"
                    : "unknown";
        return {
            ...base,
            desiredNumberScheduled,
            numberReady,
            daemonSetHealth,
        };
    }

    if (detailType === "statefulsets") {
        const desiredReplicas = (item.spec && item.spec.replicas) || 0;
        const readyReplicas = (item.status && item.status.readyReplicas) || 0;
        const statefulSetHealth =
            readyReplicas === desiredReplicas
                ? "success"
                : readyReplicas < desiredReplicas
                  ? "error"
                  : "unknown";
        return { ...base, desiredReplicas, readyReplicas, statefulSetHealth };
    }

    if (detailType === "replicasets") {
        const owner = ((item.metadata && item.metadata.ownerReferences) || []).find(
            (ref) => ref.controller === true,
        );
        return {
            ...base,
            ownerUid: owner ? owner.uid : undefined,
            desiredReplicas: (item.spec && item.spec.replicas) || 0,
            readyReplicas: (item.status && item.status.readyReplicas) || 0,
        };
    }

    if (detailType === "services") {
        const selector = (item.spec && item.spec.selector) || {};
        return {
            ...base,
            serviceType: item.spec && item.spec.type,
            selectorAppLabel:
                selector["app"] ||
                selector["app.kubernetes.io/name"] ||
                selector["k8s-app"] ||
                undefined,
        };
    }

    if (detailType === "ingresses") {
        const rules = (item.spec && item.spec.rules) || [];
        const hosts = rules
            .map((rule) => rule.host)
            .filter(Boolean)
            .join(",");
        const defaultBackendService =
            item.spec &&
            item.spec.defaultBackend &&
            item.spec.defaultBackend.service &&
            item.spec.defaultBackend.service.name;
        const firstRulePath =
            rules[0] &&
            rules[0].http &&
            rules[0].http.paths &&
            rules[0].http.paths[0];
        const firstRuleService =
            firstRulePath &&
            firstRulePath.backend &&
            firstRulePath.backend.service &&
            firstRulePath.backend.service.name;
        return {
            ...base,
            ingressClassName:
                (item.spec && item.spec.ingressClassName) || undefined,
            hosts,
            primaryBackendServiceName:
                defaultBackendService || firstRuleService || undefined,
        };
    }

    if (detailType === "persistentvolumeclaims") {
        const requests =
            (item.spec &&
                item.spec.resources &&
                item.spec.resources.requests) ||
            {};
        return {
            ...base,
            phase: (item.status && item.status.phase) || "Unknown",
            volumeName: (item.spec && item.spec.volumeName) || undefined,
            requestedStorageBytes: parseMemoryBytes(requests.storage),
        };
    }

    if (detailType === "resourcequotas") {
        const hard =
            (item.status && item.status.hard) ||
            (item.spec && item.spec.hard) ||
            {};
        const used = (item.status && item.status.used) || {};
        return {
            ...base,
            cpuRequestHardMillicores: parseCpuMillicores(hard["requests.cpu"]),
            cpuRequestUsedMillicores: parseCpuMillicores(used["requests.cpu"]),
            memoryRequestHardBytes: parseMemoryBytes(hard["requests.memory"]),
            memoryRequestUsedBytes: parseMemoryBytes(used["requests.memory"]),
            cpuLimitHardMillicores: parseCpuMillicores(hard["limits.cpu"]),
            cpuLimitUsedMillicores: parseCpuMillicores(used["limits.cpu"]),
            memoryLimitHardBytes: parseMemoryBytes(hard["limits.memory"]),
            memoryLimitUsedBytes: parseMemoryBytes(used["limits.memory"]),
            podsHard: parseCount(hard.pods),
            podsUsed: parseCount(used.pods),
        };
    }

    if (detailType === "limitranges") {
        const limits = (item.spec && item.spec.limits) || [];
        const limit =
            limits.find((l) => l.type === "Container") || limits[0] || {};
        const def = limit.default || {};
        const defaultRequest = limit.defaultRequest || {};
        const max = limit.max || {};
        const min = limit.min || {};
        return {
            ...base,
            limitType: limit.type,
            defaultCpuMillicores: parseCpuMillicores(def.cpu),
            defaultMemoryBytes: parseMemoryBytes(def.memory),
            defaultRequestCpuMillicores: parseCpuMillicores(defaultRequest.cpu),
            defaultRequestMemoryBytes: parseMemoryBytes(defaultRequest.memory),
            maxCpuMillicores: parseCpuMillicores(max.cpu),
            maxMemoryBytes: parseMemoryBytes(max.memory),
            minCpuMillicores: parseCpuMillicores(min.cpu),
            minMemoryBytes: parseMemoryBytes(min.memory),
        };
    }

    if (detailType === "pods") {
        return {
            ...base,
            nodeName: item.spec && item.spec.nodeName,
            podPhase: item.status && item.status.phase,
            containerHealth: computeContainerHealth(item),
        };
    }

    return base;
});
