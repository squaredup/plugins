// Webhook endpoint URLs can carry secrets in their query string or credentials, so they
// are reduced to host and path before being shown or used as the Webhook object's name.
const rows = (data && data.data) || [];
const hostAndPath = (url) =>
    String(url || '')
        .split('#')[0]
        .split('?')[0]
        .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
        .replace(/^[^/]*@/, '');

result = rows.map((row) => ({ ...row, endpoint: hostAndPath(row.endpoint) }));
