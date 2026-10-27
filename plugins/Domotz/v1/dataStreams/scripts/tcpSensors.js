// The sensor list only carries the device id, so build the composite sourceId used by Device objects.
const agentId = context.objects[0].rawId;

result = (data || []).map((s) => ({
    id: s.id,
    deviceSourceId: `${agentId}-${s.device_id}`,
    port: s.port,
    status: s.status,
    lastUpdate: s.last_update,
}));
