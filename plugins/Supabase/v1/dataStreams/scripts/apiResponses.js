const project = context.objects[0];

if (data && data.error) {
    const detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    throw new Error(`Supabase logs query failed: ${detail}`);
}

// The logs API returns bucket starts as UTC without a zone suffix
const toIso = (value) => {
    if (typeof value !== 'string' || !value) return null;
    const date = new Date(/(Z|[+-]\d\d:?\d\d)$/.test(value) ? value : `${value}Z`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

result = (Array.isArray(data && data.result) ? data.result : []).filter((row) => toIso(row.bucket)).map((row) => ({
    timestamp: toIso(row.bucket),
    service: row.service,
    statusClass: row.status_class,
    requests: Number(row.requests) || 0,
    projectRef: project.rawId,
    projectName: project.name
}));
