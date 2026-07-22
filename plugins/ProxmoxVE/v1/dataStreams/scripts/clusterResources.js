const resources = (data && data.data) || [];

const typeMap = {
    node: 'Proxmox Node',
    qemu: 'Proxmox VM',
    lxc: 'Proxmox Container'
};

result = resources
    .filter(function(r) { return typeMap[r.type]; })
    .map(function(r) {
        return {
            sourceId: r.type === 'node' ? r.node : String(r.vmid),
            sourceType: typeMap[r.type],
            name: r.name || r.node,
            node: r.node,
            vmid: r.vmid != null ? r.vmid : null,
            type: r.type,
            status: r.status,
            cpu: r.cpu || 0,
            maxcpu: r.maxcpu || 0,
            mem: r.mem || 0,
            maxmem: r.maxmem || 0,
            disk: r.disk || 0,
            maxdisk: r.maxdisk || 0,
            uptime: r.uptime || 0
        };
    });
