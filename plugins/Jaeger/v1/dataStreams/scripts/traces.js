// dataStreams/scripts/traces.js
//
// The /api/v3/traces response is a single JSON object shaped
// { "result": { "resourceSpans": [...] } } (OTLP JSON) - not NDJSON - so the
// platform's automatic JSON parse populates `data` and we read it directly.
//
// OTLP JSON encodes int64 (startTimeUnixNano/endTimeUnixNano) as STRING.
// Epoch nanoseconds (~1.7e18) exceed JS Number safe-integer precision, so we
// do the nanosecond arithmetic in BigInt and only convert to Number once
// we've reduced to milliseconds (~1.7e12, well within safe range).

const SPAN_KIND = {
    0: "UNSPECIFIED",
    1: "INTERNAL",
    2: "SERVER",
    3: "CLIENT",
    4: "PRODUCER",
    5: "CONSUMER",
};

const STATUS_CODE = {
    0: "UNSET",
    1: "OK",
    2: "ERROR",
};

function anyValueToJs(value) {
    if (!value) return undefined;
    if (value.arrayValue) {
        return (value.arrayValue.values || []).map(anyValueToJs);
    }
    if (value.kvlistValue) {
        const obj = {};
        (value.kvlistValue.values || []).forEach((kv) => {
            obj[kv.key] = anyValueToJs(kv.value);
        });
        return obj;
    }
    return (
        value.stringValue ??
        value.boolValue ??
        value.intValue ??
        value.doubleValue ??
        value.bytesValue
    );
}

function attrsToObject(attributes) {
    const obj = {};
    (attributes || []).forEach((a) => {
        obj[a.key] = anyValueToJs(a.value);
    });
    return obj;
}

function nanoStrToBig(nanoStr) {
    return BigInt(nanoStr || "0");
}

const resourceSpans = (data && data.result && data.result.resourceSpans) || [];

result = _.flatMap(resourceSpans, (rs) => {
    const resourceAttrs = attrsToObject((rs.resource || {}).attributes);
    const serviceName = resourceAttrs["service.name"] || "";

    return _.flatMap(rs.scopeSpans || [], (ss) => {
        return (ss.spans || []).map((s) => {
            const startNsBig = nanoStrToBig(s.startTimeUnixNano);
            const endNsBig = nanoStrToBig(s.endTimeUnixNano);
            // Compute duration from the full-precision nanosecond values before
            // rounding to ms — rounding each endpoint first and then subtracting
            // can be off by up to 1ms (e.g. start=1.999999ms, end=2.000001ms
            // truncate to 1ms/2ms, giving a 1ms duration for a ~2ns span).
            const durationMsBig = (endNsBig - startNsBig) / 1000000n;
            const status = s.status || {};
            // proto3 JSON omits fields at their default value, so an
            // INTERNAL/unspecified-kind span (kind 0) typically has no `kind`
            // field at all — default the missing case to 0 rather than
            // stringifying `undefined`.
            const kind = s.kind ?? 0;

            return {
                traceId: s.traceId,
                spanId: s.spanId,
                parentSpanId: s.parentSpanId || "",
                operationName: s.name,
                serviceName,
                kind: SPAN_KIND[kind] ?? String(kind),
                startTime: new Date(
                    Number(startNsBig / 1000000n),
                ).toISOString(),
                durationMs: Number(durationMsBig),
                statusCode: STATUS_CODE[status.code] ?? "UNSET",
                statusMessage: status.message || "",
                attributes: attrsToObject(s.attributes),
            };
        });
    });
});
