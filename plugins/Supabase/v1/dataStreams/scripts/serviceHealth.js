const project = context.objects[0];
const names = {
    auth: 'Auth',
    db: 'Database',
    pooler: 'Connection pooler',
    realtime: 'Realtime',
    rest: 'Data API',
    storage: 'Storage'
};

result = (Array.isArray(data) ? data : []).map((svc) => ({
    service: names[svc.name] || svc.name,
    serviceKey: svc.name,
    status: svc.status,
    version: svc.info && typeof svc.info.version === 'string' ? svc.info.version : null,
    error: typeof svc.error === 'string' ? svc.error : null,
    projectRef: project.rawId,
    projectName: project.name
}));
