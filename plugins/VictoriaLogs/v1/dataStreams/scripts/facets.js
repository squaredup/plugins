// Response body: { facets: [{ field_name, values: [{ field_value, hits }] }] }
const facets = Array.isArray(data?.facets) ? data.facets : [];
result = facets.flatMap((f) =>
    (Array.isArray(f.values) ? f.values : []).map((v) => ({ field: f.field_name, value: v.field_value, hits: Number(v.hits) }))
);
