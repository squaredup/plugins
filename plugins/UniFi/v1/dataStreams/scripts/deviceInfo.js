const pageVars = '{{objects.map((v) => v.sourceId)}}';
const sourceIds = pageVars.split(',').map(i => i.split('/')[1]);
result = data.data.map((s) =>
    s.devices
        .filter((d) => sourceIds.includes(d.id))
        .map((d) => ({
            ...d,
            sourceId: d.id,
            state: d.status
        }))
);
