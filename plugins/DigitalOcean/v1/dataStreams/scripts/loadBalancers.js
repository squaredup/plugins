// Flattens region and counts backend Droplets
result = (data.load_balancers || []).map((l) => ({
    id: l.id,
    name: l.name,
    status: l.status,
    ip: l.ip || null,
    region: l.region?.slug || null,
    type: l.type || null,
    network: l.network || null,
    size: l.size || null,
    sizeUnit: l.size_unit ?? null,
    backendDroplets: (l.droplet_ids || []).length,
    // Correlation matches scalars only, so only the first backend can be related
    primaryBackendDropletId: l.droplet_ids?.length ? String(l.droplet_ids[0]) : null,
    targetTag: l.tag || null,
    vpcUuid: l.vpc_uuid || null,
    createdAt: l.created_at
}));

// Optional Project/VPC object pickers arrive at context.config.<name> as arrays whose rawId is a single-element array; empty means no filter
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
for (const [param, column] of Object.entries({ vpc: "vpcUuid" })) {
    const ids = new Set((context.config?.[param] || []).map((o) => unwrap(o.rawId)).filter(Boolean));
    if (ids.size) result = result.filter((row) => ids.has(row[column]));
}
