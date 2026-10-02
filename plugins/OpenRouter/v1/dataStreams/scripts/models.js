// Optional `models` object-picker parameter: selected objects arrive at
// context.config.models as an array, each rawId a single-element array.
// Empty/absent (including the import run) returns every model.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = context.config?.models ?? [];
const ids = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

const models = data?.data ?? [];
result = ids.size ? models.filter((m) => ids.has(m.id)) : models;
