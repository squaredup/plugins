// Add the index name to allow grouping
var object = context.objects[0];
result =
    data?.countries?.map((r) => ({
        ...r,
        index: object.rawId,
    })) ?? [];

