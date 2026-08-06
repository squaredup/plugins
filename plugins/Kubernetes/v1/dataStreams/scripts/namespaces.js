result = (data.items || []).map((item) => ({
    uid: item.metadata.uid,
    name: item.metadata.name,
    phase: item.status && item.status.phase,
}));
