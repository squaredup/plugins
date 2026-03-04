function state(status) {
    const states = {
        operational: 'success',
        degraded_performance: 'warning',
        partial_outage: 'warning',
        major_outage: 'error',
    };
    return states[status] || 'unknown';
}

result = data.components
    .map((c) => {
        return {
            name: c.name,
            state: state(c.status),
            status: c.status,
        };
    })
    .filter((c) => !c.name.includes('www.githubstatus.com'))
    .sort((a, b) => a.name.localeCompare(b.name));
