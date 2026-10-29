// The API returns Unix seconds; SquaredUp expects ISO 8601
const toIso = (v) => (v ? new Date(v * 1000).toISOString() : null);
const rows = Array.isArray(data) ? data : (data?.data ?? []);

result = rows.map((r) => ({
    ...r,
    created_at: toIso(r.created_at),
    archived_at: toIso(r.archived_at),
}));
