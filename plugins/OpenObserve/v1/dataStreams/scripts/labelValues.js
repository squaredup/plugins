// dataStreams/scripts/labelValues.js
// A primitive-array pathToData row auto-names its single column "value",
// which collides with the declared computed "value" column below (Cannot
// append columns, duplicate column names: value,value). Wrap in script
// instead so the raw field is under our own "result" key.
result = (data.data || []).map((v) => ({ result: v }));
