// Collapses the nested connections array to a count and stamps the account id
// from the scoped object onto every row.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((tunnel) => ({
    sourceId: tunnel.id,
    tunnelName: tunnel.name,
    accountId: accountId,
    status: tunnel.status || "",
    tunnelType: tunnel.tun_type || "",
    activeConnections: (tunnel.connections || []).length,
    createdOn: tunnel.created_at,
}));
