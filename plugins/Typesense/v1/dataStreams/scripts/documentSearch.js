// dataStreams/scripts/documentSearch.js
// Typesense search response: { found, out_of, hits: [ { document: {...}, text_match, highlight, highlights } ] }
// Documents have an arbitrary, unknown schema per collection, so flatten each hit's
// document fields to top-level columns and add the relevance score.
result = (data.hits || []).map((h) => ({ ...h.document, _relevance: h.text_match }));
