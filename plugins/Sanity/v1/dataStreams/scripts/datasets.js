const object = context.objects[0];

result = (data || []).map((d) => ({
    ...d,
    datasetId: d.name,
    projectName: object?.name,
    projectId: object?.rawId,
    uid: `${object?.rawId}-${d.name}`,
    displayName: `${object?.name} - ${d.name}`,
}));
