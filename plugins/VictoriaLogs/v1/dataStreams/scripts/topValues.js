// Response body is NDJSON from a `| top N by (<field>)` query: one { <field>: value, hits }
// per line, most logs first (a single-row response is auto-parsed into one object). The
// counts are exact for the values returned; logs without the field come back without it.
const body = response?.body !== undefined ? response.body : data;
let rows = [];
if (typeof body === 'string') {
    rows = body
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => {
            try {
                return JSON.parse(l);
            } catch (e) {
                return null;
            }
        })
        .filter((r) => r);
} else if (Array.isArray(body)) {
    rows = body;
} else if (body && typeof body === 'object') {
    rows = [body];
}
result = rows.map((r) => {
    const value = Object.keys(r).filter((k) => k !== 'hits').map((k) => r[k])[0] || '';
    return { label: value, value, hits: Number(r.hits) || 0 };
});
