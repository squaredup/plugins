const getType = (value) => ({
    1: 'UptimeRobot HTTP Monitor',
    2: 'UptimeRobot Keyword Monitor',
    3: 'UptimeRobot Ping Monitor',
    4: 'UptimeRobot Port Monitor',
    5: 'UptimeRobot Heartbeat Monitor'
})[value];

const getStatus = (value) => ({
    0: 'Paused',
    1: 'Not Checked Yet',
    2: 'Up',
    8: 'Seems Down',
    9: 'Down'
})[value];

const getState = (value) => ({
    0: 'unknown',
    1: 'unknown',
    2: 'success',
    8: 'warning',
    9: 'error'
})[value];

result = data.monitors.map((result) => ({
    ...result,
    id: result.id.toString(),
    link: `https://uptimerobot.com/dashboard?ref=website-header#${result.id}`,
    status: getStatus(result.status),
    state: getState(result.status),
    type: getType(result.type)
}));
