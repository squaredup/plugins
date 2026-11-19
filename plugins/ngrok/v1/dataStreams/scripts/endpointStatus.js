// ngrok only lists endpoints that are online, so an indexed endpoint whose URL
// is missing from the live list is offline. Several endpoints can share a URL
// (endpoint pooling), so count them rather than expecting exactly one.
// Post-request scripts run once per page and cannot combine pages, so only the
// first page (up to 100 endpoints) is read. When ngrok reports more pages, a URL
// missing from this page may still be online, so report it as Unknown instead
// of raising a false Offline.
const live = data?.endpoints || [];
const truncated = Boolean(data?.next_page_uri);
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const typeNames = { ephemeral: 'Agent', cloud: 'Cloud', edge: 'Edge' };

const statusOf = (isUrl, matchCount) => {
    if (!isUrl) return 'Unknown';
    if (matchCount) return 'Online';
    return truncated ? 'Unknown' : 'Offline';
};

result = (context.objects || []).map((o) => {
    const url = unwrap(o.rawId);
    const isUrl = String(url).includes('://');
    const matches = isUrl ? live.filter((e) => e.url === url) : [];
    return {
        url,
        status: statusOf(isUrl, matches.length),
        liveEndpoints: matches.length,
        endpointTypes: _.uniq(matches.map((e) => typeNames[e.type] || e.type)),
        agentSessionIds: matches.map((e) => e.tunnel_session?.id).filter(Boolean),
    };
});
