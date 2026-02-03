const getStatus = (lineStatuses) => {
    if ([0, 3, 5, 7, 8, 9, 11, 14, 15, 17].includes(lineStatuses?.[0]?.statusSeverity)) { return 'warning'; }
    if ([1, 2, 4, 6, 16, 20].includes(lineStatuses?.[0]?.statusSeverity)) { return 'error'; }
    if ([10, 18].includes(lineStatuses?.[0]?.statusSeverity)) { return 'success'; }
    return 'unknown';
};

result = data.map((line) => ({
    id: line.id,
    name: line.name,
    status: getStatus(line.lineStatuses),
    statusDescription: line.lineStatuses?.[0]?.statusSeverityDescription || 'Unknown',
    reason: line.lineStatuses?.[0]?.reason
}));