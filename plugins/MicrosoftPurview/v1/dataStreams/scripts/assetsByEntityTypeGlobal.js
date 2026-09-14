const counts = {};
for (const item of (data?.value || [])) {
    const et = item.entityType || 'unknown';
    counts[et] = (counts[et] || 0) + 1;
}
result = Object.entries(counts)
    .map(([entityType, count]) => ({ entityType, count }))
    .sort((a, b) => b.count - a.count);
