// The API filters by a single repo_id only, so narrow to the selected repositories here when more
// than one is chosen. The bulky evidence fields are dropped to keep the response small.
const selected = (context.config && context.config.repository) || [];
const ids = new Set(selected.map((o) => [].concat(o.rawId)[0]));

result = (data.data || [])
    .filter((f) => ids.size === 0 || ids.has(f.repository_id))
    .map(({ reachability_call_stack, scan_provenance, ...f }) => f);
