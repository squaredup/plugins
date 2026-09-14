const total = Number(data?.['@search.count']) || 0;
const counts = {};
for (const item of (data?.value || [])) {
    for (const c of (Array.isArray(item.classification) ? item.classification : [])) {
        counts[c] = (counts[c] || 0) + 1;
    }
}
result = Object.entries(counts)
    .map(([classification, assets]) => ({
        classification,
        assets,
        coverage: total > 0 ? assets / total : 0
    }))
    .sort((a, b) => b.assets - a.assets);
