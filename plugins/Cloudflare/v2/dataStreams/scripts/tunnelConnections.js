// The connections endpoint returns one entry per connector, each with a nested
// `conns` array (the connector's individual edge connections). Flatten that
// array-into-rows structure so each row is one active connection, carrying the
// parent connector's architecture down onto every connection row.
result = ((data && data.result) || []).flatMap((connector) =>
    ((connector && connector.conns) || []).map((conn) => ({
        connectionId: conn.id,
        colo_name: conn.colo_name,
        origin_ip: conn.origin_ip,
        opened_at: conn.opened_at,
        client_version: conn.client_version || connector.version,
        arch: connector.arch,
        is_pending_reconnect: !!conn.is_pending_reconnect,
    })),
);
