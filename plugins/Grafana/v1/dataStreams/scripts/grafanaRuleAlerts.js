const groups = data?.data?.groups || [];
const alerts = [];

for (const group of groups) {
    for (const rule of group.rules) {
        if (rule.type !== 'alerting') continue;

        for (const alert of rule.alerts || []) {
            alerts.push({
                ruleName: rule.name,
                groupName: group.name,
                namespace: group.file,
                state: alert.state,
                activeAt: alert.activeAt,
                labels: JSON.stringify(alert.labels || {}),
                annotations: JSON.stringify(alert.annotations || {}),
                value: alert.value || ''
            });
        }
    }
}

result = alerts;
