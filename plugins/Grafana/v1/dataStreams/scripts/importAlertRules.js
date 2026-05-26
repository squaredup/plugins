const groups = data?.data?.groups || [];
const rules = [];

for (const group of groups) {
    for (const rule of group.rules) {
        if (rule.type !== 'alerting') continue;
        rules.push({
            sourceId: rule.uid,
            name: rule.name,
            groupName: group.name,
            namespace: group.file,
            query: rule.query || '',
            duration: typeof rule.duration === 'number' ? rule.duration : 0,
            labels: rule.labels ? JSON.stringify(rule.labels) : '{}',
            annotations: rule.annotations ? JSON.stringify(rule.annotations) : '{}'
        });
    }
}

result = rules;
