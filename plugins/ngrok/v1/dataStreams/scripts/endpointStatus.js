// ngrok only lists endpoints that are online, so an indexed endpoint whose URL
// is missing from the live list is offline. Several endpoints can share a URL
// (endpoint pooling), so count them rather than expecting exactly one.
const live = data?.endpoints || [];
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const typeNames = { ephemeral: 'Agent', cloud: 'Cloud', edge: 'Edge' };

result = (context.objects || []).map((o) => {
    const url = unwrap(o.rawId);
    const isUrl = String(url).includes('://');
    const matches = isUrl ? live.filter((e) => e.url === url) : [];
    return {
        url,
        status: !isUrl ? 'Unknown' : matches.length ? 'Online' : 'Offline',
        liveEndpoints: matches.length,
        endpointTypes: _.uniq(matches.map((e) => typeNames[e.type] || e.type)),
        agentSessionIds: matches.map((e) => e.tunnel_session?.id).filter(Boolean),
    };
});
