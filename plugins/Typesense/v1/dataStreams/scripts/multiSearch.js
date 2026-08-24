// dataStreams/scripts/multiSearch.js
// Federated multi_search response: { results: [ { found, hits: [ { document:{...}, text_match } ] } ] }
// A "union": true query instead merges everything into one set at the top level: { found, hits: [...] }.
// Flatten hits either way; only federated rows can be attributed to a numbered sub-search,
// so union rows leave _search empty. Our meta fields must win over document fields.
const federated = Array.isArray(data.results);
result = (federated ? data.results : [data]).flatMap((r, i) =>
    (r.hits || []).map((h) => ({ ...h.document, _search: federated ? i + 1 : null, _relevance: h.text_match })));
