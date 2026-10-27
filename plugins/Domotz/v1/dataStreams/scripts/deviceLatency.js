// Latency values arrive as numeric strings, and the response only carries the device id,
// so build the composite sourceId used by Device objects.
const agentId = context.objects[0].rawId;
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

result = (data || []).map((r) => ({
    deviceSourceId: `${agentId}-${r.device_id}`,
    timestamp: r.timestamp,
    latestMedian: num(r.latest_median),
    avgMedian: num(r.avg_median),
    avgMin: num(r.avg_min),
    avgMax: num(r.avg_max),
    packetLoss: r.latest_sent_packet_count
        ? (100 * (r.latest_lost_packet_count || 0)) / r.latest_sent_packet_count
        : null,
}));
