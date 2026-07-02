// dataStreams/scripts/multiSearch.js
// Typesense multi_search response: { results: [ { found, hits: [ { document:{...}, text_match } ] } ] }
// Flatten hits across all sub-searches, tagging which sub-search each row came from;
// our meta fields must win over document fields.
result = (data.results || []).flatMap((r, i) =>
    (r.hits || []).map((h) => ({ ...h.document, _search: i, _relevance: h.text_match })));
