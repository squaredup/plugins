// Emits ONE row per binding, as its own object type.
//
// It deliberately does NOT reuse the Worker's sourceId/type: when two import
// steps write the same object, the later step REPLACES the property set rather
// than merging it, so writing Worker objects here silently wiped every property
// the workerScripts step had set (accountId, usageModel, createdOn, ...).
//
// Each binding carries a type-specific SCALAR id column, populated only for its
// own type. Correlation rules then match one column per target type - a missing
// or empty value never matches, so the rules stay precise without relying on
// array-valued property matching.
const worker = (context.objects && context.objects[0]) || {};
const rawId = worker.rawId || "";
const accountId = rawId.indexOf(":") > -1 ? rawId.split(":")[0] : "";
const scriptName = worker.name || "";
const bindings = (data && data.result && data.result.bindings) || [];

result = bindings
    .filter((b) => b && b.type)
    .map((b) => {
        const bindingName = b.name || b.type;
        const isD1 = b.type === "d1" || b.type === "d1_database";
        return {
            sourceId: `${accountId}:${scriptName}:${bindingName}`,
            bindingName: bindingName,
            bindingType: b.type,
            scriptName: scriptName,
            accountId: accountId,
            // Exactly one of these is populated per row, keyed by binding type.
            kvNamespaceId:
                b.type === "kv_namespace" ? b.namespace_id || "" : "",
            r2BucketName: b.type === "r2_bucket" ? b.bucket_name || "" : "",
            d1DatabaseId: isD1 ? b.id || b.database_id || "" : "",
            queueName: b.type === "queue" ? b.queue_name || "" : "",
            durableObjectNamespaceId:
                b.type === "durable_object_namespace"
                    ? b.namespace_id || ""
                    : "",
            vectorizeIndexName:
                b.type === "vectorize" ? b.index_name || "" : "",
            hyperdriveConfigId: b.type === "hyperdrive" ? b.id || "" : "",
            serviceName: b.type === "service" ? b.service || "" : "",
        };
    });
