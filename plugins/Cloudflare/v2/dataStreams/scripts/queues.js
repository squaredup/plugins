// Collapses the producers/consumers arrays to counts and stamps the account id
// from the scoped object onto every row so the Queues analytics streams can
// build their account-scoped GraphQL query.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((queue) => ({
    sourceId: queue.queue_id,
    queueName: queue.queue_name,
    accountId: accountId,
    producers:
        typeof queue.producers_total_count === "number"
            ? queue.producers_total_count
            : (queue.producers || []).length,
    consumers:
        typeof queue.consumers_total_count === "number"
            ? queue.consumers_total_count
            : (queue.consumers || []).length,
    // The consuming Worker script names, kept as an array: this is the join
    // key for the Queue -> Worker correlation rule. HTTP-pull consumers have
    // no service name and are filtered out.
    consumerScripts: (queue.consumers || [])
        .map((c) => c && c.service)
        .filter(Boolean)
        .join(", "),
    primaryConsumerScript:
        ((queue.consumers || []).map((c) => c && c.service).filter(Boolean))[0] ||
        "",
    // The producing Worker script names, same join-key reasoning as consumers.
    producerScripts: (queue.producers || [])
        .map((p) => p && p.script)
        .filter(Boolean)
        .join(", "),
    primaryProducerScript:
        ((queue.producers || []).map((p) => p && p.script).filter(Boolean))[0] ||
        "",
    createdOn: queue.created_on,
    modifiedOn: queue.modified_on,
}));
