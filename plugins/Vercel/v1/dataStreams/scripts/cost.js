// GET /v1/billing/charges returns application/jsonl — newline-delimited JSON
// objects (FOCUS v1.3 cost/usage records), NOT a JSON array. The handler only
// auto-parses JSON/XML, so `data` is null/incomplete here; the raw text is on
// response.body. Split on newlines, drop empties, JSON.parse each line, then map
// each FOCUS record to a flat row with real JS primitives.
const records = (response.body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

result = records.map((r) => {
    const tags = r.Tags || {};
    return {
        service: r.ServiceName,
        billedCost: num(r.BilledCost),
        effectiveCost: num(r.EffectiveCost),
        quantity: num(r.ConsumedQuantity),
        unit: r.ConsumedUnit,
        projectName: tags.ProjectName || tags.ProjectId || null,
        periodStart: r.ChargePeriodStart
    };
});
