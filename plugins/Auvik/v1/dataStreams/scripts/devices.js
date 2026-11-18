const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (name) =>
    new Set(((context.config && context.config[name]) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const rel = (item, name) => (item.relationships && item.relationships[name] && item.relationships[name].data) || null;
const relAttr = (item, name, attr) => {
    const d = rel(item, name);
    return (d && ((d.attributes && d.attributes[attr]) || d[attr])) || null;
};
const items = Array.isArray(data && data.data) ? data.data : data && data.data ? [data.data] : [];
const deviceFilter = selected("device");

// include=deviceDetail returns discovery/management status in `included`, keyed by the detail id.
const details = {};
for (const inc of (data && data.included) || []) {
    if (inc.type === "deviceDetail") details[inc.id] = inc.attributes || {};
}

result = items
    .filter((d) => !deviceFilter.size || deviceFilter.has(d.id))
    .map((d) => {
        const a = d.attributes || {};
        const detailRef = rel(d, "deviceDetail");
        const detail = details[(detailRef && detailRef.id) || d.id] || {};
        const discovery = detail.discoveryStatus || {};
        const networks = rel(d, "networks") || [];
        return {
            id: d.id,
            name: a.deviceName || d.id,
            onlineStatus: a.onlineStatus || "unknown",
            deviceType: a.deviceType || null,
            vendorName: a.vendorName || null,
            makeModel: a.makeModel || null,
            ipAddresses: a.ipAddresses || [],
            softwareVersion: a.softwareVersion || null,
            firmwareVersion: a.firmwareVersion || null,
            serialNumber: a.serialNumber || null,
            lastSeenTime: a.lastSeenTime || null,
            networkNames: networks.map((n) => (n.attributes && n.attributes.networkName) || n.id).filter(Boolean),
            networkIds: networks.map((n) => n.id).filter(Boolean),
            managed: detail.manageStatus ?? null,
            snmpStatus: discovery.snmp || null,
            wmiStatus: discovery.wmi || null,
            loginStatus: discovery.login || null,
            vmwareStatus: discovery.vmware || null,
            description: a.description || null,
            lastModified: a.lastModified || null,
            tenantId: (rel(d, "tenant") || {}).id || null,
            tenantName: relAttr(d, "tenant", "domainPrefix"),
            link: (d.links && d.links.dashboard) || null,
        };
    });
