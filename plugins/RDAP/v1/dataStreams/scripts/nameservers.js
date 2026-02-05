result = data.nameservers
    .filter((ns) => ns.objectClassName === 'nameserver')
    .map((ns) => ({
        name: ns.ldhName
    }));
