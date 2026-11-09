// A 2xx alone doesn't prove the page is usable - an HTML error or maintenance page would also
// arrive as 200 and reach this script as `data === undefined`. Check it parsed as Statuspage JSON.
if (!data || !data.page || !data.status) {
    api.report.error('The Splunk Cloud status page did not return a status document.');
}

result = [
    {
        page: data.page.name,
        indicator: data.status.indicator,
        description: data.status.description
    }
];
