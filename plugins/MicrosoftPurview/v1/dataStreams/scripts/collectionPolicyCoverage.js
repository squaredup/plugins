const policies = data?.values || data?.value || [];

if (policies.length === 0) {
    result = [
        {
            id: null,
            name: '(no policy)',
            version: 0,
            description: '',
            decisionRuleCount: 0,
            attributeRuleCount: 0,
            state: 'No policy',
        },
    ];
} else {
    result = policies.map((p) => ({
        id: p.id,
        name: p.name,
        version: Number(p.version) || 0,
        description: p.properties?.description || '',
        decisionRuleCount: Array.isArray(p.properties?.decisionRules)
            ? p.properties.decisionRules.length
            : 0,
        attributeRuleCount: Array.isArray(p.properties?.attributeRules)
            ? p.properties.attributeRules.length
            : 0,
        state: 'Attached',
    }));
}
