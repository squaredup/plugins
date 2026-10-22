// Flattens nested region/size/image/networks and joins tags, which would otherwise arrive as an array
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
    locked: d.locked,
    tagList: (d.tags || []).join(", "),
    createdAt: d.created_at
}));
