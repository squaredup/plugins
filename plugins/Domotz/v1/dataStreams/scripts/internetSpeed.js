// Each sample is a [download, upload] pair in bits per second.
result = (data || []).map((s) => ({
    timestamp: s.timestamp,
    downloadBps: s.values && s.values[0],
    uploadBps: s.values && s.values[1],
}));
