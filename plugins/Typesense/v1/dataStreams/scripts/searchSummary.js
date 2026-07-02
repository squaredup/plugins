// dataStreams/scripts/searchSummary.js
// Typesense search response root is an OBJECT: { found, out_of, search_time_ms, page, hits: [...] }
// Build a single summary row from the top-level counts, ignoring hits.
result = [{
    found: data.found,
    out_of: data.out_of,
    search_time_ms: data.search_time_ms,
    page: data.page
}];
