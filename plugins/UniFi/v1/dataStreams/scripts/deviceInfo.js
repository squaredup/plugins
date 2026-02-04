const pageVars = '{{variable1.map((v) => v.sourceId)}}';
const sourceIds = pageVars.split(',');
result = data.data.map((s) =>
    s.devices
        .filter((d) => sourceIds.includes(d.id))
        .map((d) => ({
            ...d,
            sourceId: d.id,
            state: d.status
        }))
);
