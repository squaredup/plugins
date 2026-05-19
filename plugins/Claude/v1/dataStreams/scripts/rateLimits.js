result = (data.data || []).flatMap((group) =>
    (group.limits || []).map((limit) => ({
        group_type: group.group_type,
        models: (group.models || []).join(', ') || null,
        limit_type: limit.type,
        value: limit.value,
    }))
);
