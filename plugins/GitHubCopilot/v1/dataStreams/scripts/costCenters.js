// Cost centers only exist for enterprises; organization accounts call a cheap endpoint instead and get no rows
const isEnterprise = context.dataSources[0].accountType === 'enterprise';

// Optional cost center filter: picker values are objects whose rawId may be a one-element array
const selectedIds = new Set(
    [].concat(context.config?.costCenter || [])
        .map((c) => String([].concat(c?.rawId ?? [])[0] ?? ''))
        .filter(Boolean)
);

const countOf = (resources, type) => resources.filter((r) => String(r.type).toLowerCase() === type).length;

result = (isEnterprise ? data?.costCenters || [] : [])
    .filter((c) => !selectedIds.size || selectedIds.has(String(c.id)))
    .map((c) => {
    const resources = c.resources || [];
    const target = c.ai_credit_pool_state?.target_amount ?? null;
    const current = c.ai_credit_pool_state?.current_amount ?? null;

    return {
        costCenterId: String(c.id),
        name: c.name,
        costCenterState: c.state || null,
        userCount: countOf(resources, 'user'),
        teamCount: countOf(resources, 'team'),
        organizationCount: countOf(resources, 'org') + countOf(resources, 'organization'),
        repositoryCount: countOf(resources, 'repo') + countOf(resources, 'repository'),
        members: resources.map((r) => `${r.type}: ${r.name}`),
        azureSubscription: c.azure_subscription || null,
        poolEnabled: typeof c.ai_credit_pool_enabled === 'boolean' ? c.ai_credit_pool_enabled : null,
        poolTargetAmount: target,
        poolCurrentAmount: current,
        poolPercent: target ? (current / target) * 100 : null
    };
});
