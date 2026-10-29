// The API returns Unix seconds; SquaredUp expects ISO 8601
const toIso = (v) => (v ? new Date(v * 1000).toISOString() : null);
const rows = Array.isArray(data) ? data : (data?.data ?? []);

result = rows.map((r) => ({
    ...r,
    added_at: toIso(r.added_at),
}));
