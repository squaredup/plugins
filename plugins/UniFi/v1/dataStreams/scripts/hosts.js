result = data.data.map((s) => ({
    name: s.reportedState.name,
    hostname: s.reportedState.hostname,
    id: s.id,
    ipAddress: s.ipAddress || s.reportedState.ipAddrs?.[0] || '',
    timezone: s.reportedState.timezone ?? null,
    state: s.reportedState.state === 'connected' ? 'success' : 'unknown',
    releaseChannel: s.reportedState.releaseChannel ?? s.reportedState.release_channel ?? null,
    version: s.reportedState.version,
    hardware: s.reportedState.hardware?.name ?? null,
    lastStateChange: s.lastConnectionStateChange,
    latestBackup: s.latestBackupTime
}));
