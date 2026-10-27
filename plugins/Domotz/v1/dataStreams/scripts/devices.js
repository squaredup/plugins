// The device list does not repeat the collector id, but device ids are only addressable
// per collector, so stamp it on every row to build a unique sourceId.
const agentId = Number(context.objects[0].rawId);

result = (data || []).map((d) => ({
    sourceId: `${agentId}-${d.id}`,
    name: d.display_name,
    deviceId: d.id,
    agentId,
    status: d.status,
    lastStatusChange: d.last_status_change,
    deviceType: d.type && d.type.label,
    vendor: d.vendor,
    model: d.model,
    ipAddresses: d.ip_addresses || [],
    macAddress: d.hw_address,
    importance: d.importance,
    operatingSystem: d.os && d.os.name,
    firstSeen: d.first_seen_on,
}));
