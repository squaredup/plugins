// R2 nests the bucket array under result.buckets, and bucket names are only
// unique within an account, so the account id from the scoped object is
// prefixed onto the name to form a globally-unique sourceId.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result && data.result.buckets) || []).map((bucket) => ({
    sourceId: `${accountId}:${bucket.name}`,
    bucketName: bucket.name,
    accountId: accountId,
    location: bucket.location || "",
    storageClass: bucket.storage_class || "",
    createdOn: bucket.creation_date,
}));
