const policies = data?.values || data?.value || [];

result = policies.map((p) => ({
    id: p.id,
    name: p.name,
    version: Number(p.version) || 0,
    collection: p.properties?.collection?.referenceName || '',
    description: p.properties?.description || '',
    decisionRuleCount: Array.isArray(p.properties?.decisionRules) ? p.properties.decisionRules.length : 0,
    attributeRuleCount: Array.isArray(p.properties?.attributeRules) ? p.properties.attributeRules.length : 0,
}));
