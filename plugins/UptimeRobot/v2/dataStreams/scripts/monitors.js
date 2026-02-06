const sourceName = 'UptimeRobot';

const type = (value) => ({
    1: 'UptimeRobot HTTP Monitor',
    2: 'UptimeRobot Keyword Monitor',
    3: 'UptimeRobot Ping Monitor',
    4: 'UptimeRobot Port Monitor',
    5: 'UptimeRobot Heartbeat Monitor'
})[value];

result = data.monitors.map((monitor) => ({
    links: [{
        label: 'View in UptimeRobot',
        url: `https://uptimerobot.com/dashboard?ref=website-header#${monitor.id}`
    }],
    monitorUrl: monitor.url,
    name: monitor.friendly_name,
    sourceName: sourceName,
    sourceType: type(monitor.type),
    sourceId: monitor.id.toString(),
    monitorId: monitor.id.toString(),
    type: 'monitor'
}));
