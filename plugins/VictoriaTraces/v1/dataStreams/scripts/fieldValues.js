// Response body: { status, data: { result: [{ metric: { <field>: value }, value: [t, hits] }] } }
// The top values are selected and counted by VictoriaTraces (`stats by` + `sort` + `limit`),
// so only the requested number of values is transferred.
const field = String(context.config?.field || '').trim();
const results = Array.isArray(data?.data?.result) ? data.data.result : [];
result = results
    .map((r) => {
        const value = (r.metric || {})[field] ?? '';
        return { label: value, value, hits: Number(r.value?.[1]) || 0 };
    })
    .sort((a, b) => b.hits - a.hits);
