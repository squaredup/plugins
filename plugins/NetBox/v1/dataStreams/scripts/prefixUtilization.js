// Mirrors NetBox Prefix.get_utilization() (ipam/models/ip.py), minus IP ranges marked populated.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const obj = (context.objects && context.objects[0]) || {};
const cidr = String(unwrap(obj.name));
const status = unwrap(obj.status);
const isPool = unwrap(obj.isPool) === true || unwrap(obj.isPool) === 'true';
const markUtilized = unwrap(obj.markUtilized) === true || unwrap(obj.markUtilized) === 'true';
const vrfId = unwrap(obj.vrfId);
const vrfName = unwrap(obj.vrf);

const [addr, lenStr] = cidr.split('/');
const prefixLen = parseInt(lenStr, 10);
const isV6 = addr.includes(':');
const totalBits = isV6 ? 128 : 32;

// Parse an address into a BigInt (IPv4 dotted quad or IPv6, including '::' compression and embedded IPv4).
const toBigInt = (a) => {
    if (!a.includes(':')) {
        return a.split('.').reduce((acc, o) => (acc << 8n) + BigInt(parseInt(o, 10)), 0n);
    }
    let s = a;
    if (s.includes('.')) {
        const idx = s.lastIndexOf(':');
        const v4 = s.slice(idx + 1).split('.').map((o) => parseInt(o, 10));
        s = s.slice(0, idx + 1) + ((v4[0] << 8) | v4[1]).toString(16) + ':' + ((v4[2] << 8) | v4[3]).toString(16);
    }
    const [head, tail] = s.split('::');
    const h = head ? head.split(':') : [];
    const t = tail !== undefined && tail ? tail.split(':') : [];
    const missing = tail === undefined ? 0 : 8 - h.length - t.length;
    const groups = [...h, ...Array(missing).fill('0'), ...t];
    return groups.reduce((acc, g) => (acc << 16n) + BigInt(parseInt(g || '0', 16)), 0n);
};

const parseCidr = (c) => {
    const [a, l] = c.split('/');
    const len = parseInt(l, 10);
    const bits = a.includes(':') ? 128 : 32;
    const size = 1n << BigInt(bits - len);
    const start = (toBigInt(a) >> BigInt(bits - len)) << BigInt(bits - len);
    return { start, end: start + size - 1n, size };
};

const prefixSize = 1n << BigInt(totalBits - prefixLen);
let size = prefixSize;
let used = 0n;
let utilization;

if (markUtilized) {
    utilization = 100;
    if (status === 'container') {
        used = prefixSize;
    }
} else if (status === 'container') {
    // Union of child ranges: sort by start and merge overlaps, so nested children aren't double counted.
    const children = ((data && data.results) || [])
        .filter((r) => r && typeof r.prefix === 'string')
        .map((r) => parseCidr(r.prefix))
        .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    let curEnd = -1n;
    for (const c of children) {
        if (c.start > curEnd) {
            used += c.size;
            curEnd = c.end;
        } else if (c.end > curEnd) {
            used += c.end - curEnd;
            curEnd = c.end;
        }
    }
} else {
    used = BigInt((data && data.count) || 0);
    // IPv4 non-pool prefixes shorter than /31 exclude the network and broadcast addresses
    if (!isV6 && prefixLen < 31 && !isPool) {
        size = prefixSize - 2n;
    }
}

if (utilization === undefined) {
    // Scale by 10000 in BigInt to keep precision for huge IPv6 sizes, then cap at 100
    const scaled = size > 0n ? (used * 10000n) / size : 0n;
    utilization = Math.min(Number(scaled) / 100, 100);
}

result = [
    {
        prefix: cidr,
        vrf: typeof vrfName === 'string' && vrfName ? vrfName : 'Global',
        status: status,
        size: Number(size),
        used: Number(used),
        utilization: utilization,
        prefixId: unwrap(obj.rawId),
        netboxUrl: unwrap(obj.netboxUrl),
    },
];
