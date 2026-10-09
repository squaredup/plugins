result = ((data && data.results) || []).map((r) => ({
    label: r.name,
    value: r.slug,
}));
