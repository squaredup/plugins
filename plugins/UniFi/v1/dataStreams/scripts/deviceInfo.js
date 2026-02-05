const pageVars = '{{objects.map((v) => v.deviceId)}}';
const ids = pageVars.split(',');
result = data.data.map((s) =>
    s.devices
        .filter((d) => ids.includes(d.id))
        .map((d) => ({
            ...d,
            sourceId: d.id,
            state: d.status
        }))
);
