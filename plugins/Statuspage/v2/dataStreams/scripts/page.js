if (!data || !data.page || !data.page.id) {
    api.report.error('The status page did not return a status document.');
}

result = [
    {
        id: data.page.id,
        name: data.page.name,
        url: data.page.url,
        timeZone: data.page.time_zone
    }
];
