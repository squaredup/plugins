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

function sumCpuMillicores(containers) {
    let total;
    for (const c of containers || []) {
        const parsed = parseCpuMillicores(c.usage && c.usage.cpu);
        if (parsed !== undefined) total = (total || 0) + parsed;
    }
    return total;
}

function sumMemoryBytes(containers) {
    let total;
    for (const c of containers || []) {
        const parsed = parseMemoryBytes(c.usage && c.usage.memory);
        if (parsed !== undefined) total = (total || 0) + parsed;
    }
    return total;
}

const rows = (data.items || []).map((item) => {
    const containers = item.containers || [];
    return {
        name: item.metadata && item.metadata.name,
        namespace: item.metadata && item.metadata.namespace,
        cpuUsageMillicores: sumCpuMillicores(containers),
        memoryUsageBytes: sumMemoryBytes(containers),
    };
});

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.pod) || [];
const podKeys = new Set(
    selected
        .map((o) => {
            const name = unwrap(o.name);
            const namespace = unwrap(o.namespace);
            return name ? `${namespace}/${name}` : undefined;
        })
        .filter(Boolean),
);

result = podKeys.size
    ? rows.filter((r) => podKeys.has(`${r.namespace}/${r.name}`))
    : rows;
