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
    targetTag: l.tag || null,
    vpcUuid: l.vpc_uuid || null,
    createdAt: l.created_at
}));
