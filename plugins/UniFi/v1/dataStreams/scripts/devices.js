const types = { protect: 'UniFi Protect', network: 'UniFi Network', access: 'UniFi Access' };
result = data.data.map((s) => {
    return s.devices.map((d) => {
        const sourceType = types[d.productLine] || d.productLine;
        return { site: s.hostName, ...d, sourceType, sourceId: d.id };
    });
});
