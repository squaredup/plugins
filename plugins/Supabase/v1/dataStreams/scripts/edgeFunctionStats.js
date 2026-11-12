if (data && data.error) {
    const detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    throw new Error(`Supabase analytics returned an error: ${detail}`);
}

const fn = context.objects[0];
const first = (v) => (Array.isArray(v) ? v[0] : v);
const num = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));
// Supabase returns UTC timestamps without a zone suffix, e.g. 2026-11-12T19:00:00
const toIso = (t) => {
    if (typeof t !== 'string') {
        return null;
    }
    return /(Z|[+-][0-9]{2}:?[0-9]{2})$/.test(t) ? t : `${t}Z`;
};

result = (Array.isArray(data && data.result) ? data.result : []).map((r) => ({
    timestamp: toIso(r.timestamp),
    invocations: num(r.request_count),
    successes: num(r.success_count),
    redirects: num(r.redirect_count),
    clientErrors: num(r.client_err_count),
    serverErrors: num(r.server_err_count),
    avgExecutionTime: num(r.avg_execution_time),
    maxExecutionTime: num(r.max_execution_time),
    functionId: fn.rawId,
    functionName: fn.name,
    projectName: first(fn.projectName)
}));
