// The domains endpoint is account-wide and has no server-side filter, so the optional
// Customer parameter is applied here. It stays a parameter rather than the stream's
// `matches`: indexDefinitions uses this same stream unscoped to discover every SaaS
// Customer object, and scoping the stream itself would leave the import with nothing to
// import. With nothing selected the filter is a no-op and the account-wide rows flow
// through unchanged.
//
// GOTCHA: objects arriving via context.config carry rawId as a single-element ARRAY, not
// a scalar (see build-plugin references, "the context object"). Comparing the array to a
// string silently matches nothing, so unwrap before building the id set.
const unwrap = (value) => (Array.isArray(value) ? value[0] : value);

const selectedIds = new Set(
    (context.config?.customer || []).map((object) => String(unwrap(object.rawId))).filter(Boolean)
);

result = (data || []).filter((row) => selectedIds.size === 0 || selectedIds.has(String(row.saasCustomerId)));
