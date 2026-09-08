// Edition ids are only unique within a product, so Edition objects are keyed on a
// composite product-edition key and rows need that same key to resolve against them.
// It has to be built here rather than as a computed metadata column, because an object
// lookup resolves its sourceId against the response body and ignores computed values.
const subscriptions = data?.results || [];

result = subscriptions.map((subscription) => ({
    ...subscription,
    productEditionKey: subscription.productId + "-" + subscription.editionId,
}));
