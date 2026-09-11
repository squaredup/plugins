// /v1/saas/domains is account-wide with no server-side filter, so scoping happens here.
// The stream is httpRequestScoped rather than httpRequestScopedSingle on purpose: the
// endpoint returns every domain whatever is asked of it, so ScopedSingle would fire one
// identical full-account request per selected customer. This way it is fetched once and
// filtered against the whole selection.
//
// GOTCHA: rawId on context.objects is a scalar, unlike the single-element array you get
// from an objects parameter on context.config (see build-plugin references, "the context
// object"). Coerce to string anyway - saasCustomerId comes back from the API as a number.
const selectedIds = new Set((context.objects || []).map((object) => String(object.rawId)).filter(Boolean));

result = (data || []).filter((row) => selectedIds.size === 0 || selectedIds.has(String(row.saasCustomerId)));
