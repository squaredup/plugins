// Kubernetes Quantity grammar: mantissa is [+-]?(digits[.digits?] | .digits),
// exponent accepts lowercase or uppercase e/E, suffix is a binary (Ki..Ei) or
// decimal (n/u/m/k/M/G/T/P/E) multiplier — never both on the same value.
function parseMemoryBytes(qty) {
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

result = (data.items || []).map((item) => {
    const claimRef = (item.spec && item.spec.claimRef) || {};
    const capacity = (item.spec && item.spec.capacity) || {};

    return {
        uid: item.metadata.uid,
        name: item.metadata.name,
        phase: (item.status && item.status.phase) || "Unknown",
        claimName: claimRef.name || undefined,
        claimNamespace: claimRef.namespace || undefined,
        capacityBytes: parseMemoryBytes(capacity.storage),
    };
});
