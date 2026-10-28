// Flattens nested region/size/image/networks and joins tags, which would otherwise arrive as an array
// DOKS tags each worker node "k8s:<cluster uuid>"; other k8s:* tags (e.g. k8s:worker) are not ids
const clusterId = (d) => (d.tags || []).map((t) => /^k8s:([0-9a-f-]{36})$/.exec(t)).find(Boolean)?.[1] || null;
const ip = (d, type) => ((d.networks && d.networks.v4) || []).find((n) => n.type === type)?.ip_address || null;

result = (data.droplets || []).map((d) => ({
    id: String(d.id),
    name: d.name,
    status: d.status,
    region: d.region?.slug || null,
    sizeSlug: d.size_slug,
    vcpus: d.vcpus,
    memory: d.memory,
    disk: d.disk,
    image: [d.image?.distribution, d.image?.name].filter(Boolean).join(" "),
    publicIp: ip(d, "public"),
    privateIp: ip(d, "private"),
    vpcUuid: d.vpc_uuid || null,
    kubernetesClusterId: clusterId(d),
    locked: d.locked,
    tagList: (d.tags || []).join(", "),
    createdAt: d.created_at
}));

// Optional Project/VPC object pickers arrive at context.config.<name> as arrays whose rawId is a single-element array; empty means no filter
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
for (const [param, column] of Object.entries({ vpc: "vpcUuid" })) {
    const ids = new Set((context.config?.[param] || []).map((o) => unwrap(o.rawId)).filter(Boolean));
    if (ids.size) result = result.filter((row) => ids.has(row[column]));
}
