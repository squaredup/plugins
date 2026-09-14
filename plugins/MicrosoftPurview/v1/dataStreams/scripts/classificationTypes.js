const arrayToText = (v) => Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v));

result = (data?.classificationDefs || []).map((def) => ({
    ...def,
    superTypes: arrayToText(def.superTypes)
}));
