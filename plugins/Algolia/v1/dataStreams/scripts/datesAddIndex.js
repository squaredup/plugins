// Add the index name to allow grouping
var object = context.objects[0];
result =
    data?.dates?.map((r) => ({
        ...r,
        index: object.rawId,
    })) ?? [];

