const hasToken = {{ !!((dataSource.projects || []).find(p => p.key === object.rawId) || {}).value }};
const apiMsg = data && (data.message || (typeof data.error === 'string' ? data.error : (data.error || {}).description));

result = hasToken
    ? (apiMsg || ('Request failed with HTTP ' + response.status))
    : 'No API token is configured for project ' + {{ JSON.stringify(object.name) }} + '. Add its Project ID and API token under Project API tokens in the Sanity data source settings to see its members.';
