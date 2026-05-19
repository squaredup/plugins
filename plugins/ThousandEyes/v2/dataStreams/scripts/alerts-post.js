result = data.alerts;

result = result.map(r => ({
    ...r,
    testId: r._links.test.href.split('/')[6]
}))