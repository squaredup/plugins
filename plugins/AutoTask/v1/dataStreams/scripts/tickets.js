var statusMap = {
    1: { name: 'New', state: 'warning' },
    5: { name: 'Complete', state: 'success' },
    8: { name: 'In Progress', state: 'warning' },
    9: { name: 'Waiting Customer', state: 'unknown' },
    10: { name: 'Waiting Materials', state: 'unknown' },
    11: { name: 'Waiting Vendor', state: 'unknown' },
    12: { name: 'Escalate', state: 'error' },
    13: { name: 'Waiting Approval', state: 'unknown' }
};

result = (data.items || []).map(function(ticket) {
    var mapped = statusMap[ticket.status] || { name: 'Status ' + ticket.status, state: 'unknown' };
    return Object.assign({}, ticket, { statusName: mapped.name, stateValue: mapped.state });
});
