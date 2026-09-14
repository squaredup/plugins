const rows = (data.items || []).map((item) => {
    const selector = (item.spec && item.spec.selector) || {};

    return {
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        serviceType: item.spec && item.spec.type,
        selectorAppLabel:
            selector["app"] ||
            selector["app.kubernetes.io/name"] ||
            selector["k8s-app"] ||
            undefined,
    };
});

// Object-picker fields can be arrays. Normalize them before key comparison.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.ingress) || [];
const backends = new Set(
    selected
        .map(
            (o) =>
                `${unwrap(o.namespace)}/${unwrap(o.primaryBackendServiceName)}`,
        )
        .filter((key) => key !== "undefined/undefined"),
);

result = backends.size
    ? rows.filter((r) => backends.has(`${r.namespace}/${r.name}`))
    : rows;
