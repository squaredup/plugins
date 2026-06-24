// Add the index name to allow grouping
var object = context.objects[0];
result =
    data?.searches?.map((r) => ({
        ...r,
        index: object.rawId,
    })) ?? [];

