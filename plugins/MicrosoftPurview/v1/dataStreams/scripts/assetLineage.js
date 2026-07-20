const baseGuid = data?.baseEntityGuid;
const map = data?.guidEntityMap || {};
const relations = data?.relations || [];

const upstream = new Set();
const downstream = new Set();
for (const r of relations) {
    if (r.toEntityId === baseGuid) upstream.add(r.fromEntityId);
    if (r.fromEntityId === baseGuid) downstream.add(r.toEntityId);
}

result = Object.entries(map).map(([guid, e]) => {
    let role = 'Downstream';
    if (guid === baseGuid) role = 'Base';
    else if (upstream.has(guid)) role = 'Upstream';

    const attrs = e.attributes || {};
    return {
        guid,
        name: attrs.name || e.displayText || guid,
        typeName: e.typeName || '',
        qualifiedName: attrs.qualifiedName || '',
        role,
        status: e.status || '',
        classifications: (e.classificationNames || []).join(', '),
    };
});
