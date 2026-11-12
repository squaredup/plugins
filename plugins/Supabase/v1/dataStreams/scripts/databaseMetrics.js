const project = context.objects[0];
const text = typeof response.body === 'string' ? response.body : '';

// Prometheus exposition format: name{labels} value [timestamp]
const sums = {};
const cpus = new Set();
for (const line of text.split('\n')) {
    if (!line || line.charAt(0) === '#') continue;
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+(\S+)/);
    if (!match) continue;
    const value = Number(match[3]);
    if (Number.isNaN(value)) continue;
    sums[match[1]] = (sums[match[1]] || 0) + value;
    if (match[1] === 'node_cpu_seconds_total' && match[2]) {
        const cpu = match[2].match(/cpu="([^"]*)"/);
        if (cpu) cpus.add(cpu[1]);
    }
}

const get = (name) => (name in sums ? sums[name] : null);
const total = get('node_memory_MemTotal_bytes');
const available = get('node_memory_MemAvailable_bytes');

result = [{
    projectRef: project.rawId,
    projectName: project.name,
    memoryUsedPercent: total && available !== null ? Math.round(((total - available) / total) * 1000) / 10 : null,
    memoryTotalBytes: total,
    load1: get('node_load1'),
    load5: get('node_load5'),
    load15: get('node_load15'),
    cpuCores: cpus.size || null,
    activeConnections: get('pg_stat_database_num_backends'),
    maxConnections: get('max_connections_connection_count')
}];
