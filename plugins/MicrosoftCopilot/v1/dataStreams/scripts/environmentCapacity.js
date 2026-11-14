// Rows need the environment's id and name, which sit outside the allocations array (id in the
// response envelope, name on the scoped object), so a declarative pathToData cannot carry them.
const prop = (v) => (Array.isArray(v) ? v[0] : v);
const env = (context.objects && context.objects[0]) || {};
const LABELS = { MCSMessages: "Copilot Credits" };
result = ((data && data.currencyAllocations) || []).map((a) => ({
    environmentName: prop(env.name),
    environmentId: data.environmentId,
    currency: LABELS[a.currencyType] || a.currencyType,
    allocated: a.allocated,
    currencyType: a.currencyType,
}));
