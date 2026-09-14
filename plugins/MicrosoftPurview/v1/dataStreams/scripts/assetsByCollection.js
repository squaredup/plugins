const arrayToText = (v) => Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v));

result = (data?.value || []).map((hit) => ({
    ...hit,
    assetType: arrayToText(hit.assetType),
    classification: arrayToText(hit.classification),
    term: arrayToText(hit.term),
    label: arrayToText(hit.label)
}));
