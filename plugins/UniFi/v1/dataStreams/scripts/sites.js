const getState = (count) => {
    if (count >= 10) return 'error';
    if (count >= 5) return 'warn';
    return 'success';
};
result = data.data.map((s) => {
    const counts = s.statistics.counts || {};
    const stateCount = counts.criticalNotification ?? 0;
    return {
        name: s.meta.desc,
        timezone: s.meta.timezone,
        state: getState(stateCount),
        ...counts,
        id: s.siteId,
        sourceId: s.siteId
    };
});
