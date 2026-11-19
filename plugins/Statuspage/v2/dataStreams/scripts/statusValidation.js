// A 2xx alone doesn't prove the address is a Statuspage page: an unknown *.statuspage.io subdomain redirects to
// Atlassian's marketing site, and non-Statuspage status pages (e.g. Algolia) serve their HTML app for any path.
// Both arrive as a 200 that doesn't parse as JSON, so check for the summary document's shape.
if (!data || !data.page || !data.status || !Array.isArray(data.components)) {
    api.report.error('The address did not return a Statuspage summary document.');
}

result = [
    {
        page: data.page.name,
        pageId: data.page.id,
        indicator: data.status.indicator,
        description: data.status.description
    }
];
