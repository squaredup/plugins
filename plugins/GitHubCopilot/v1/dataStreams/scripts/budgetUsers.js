// Per-user budget states only exist for enterprise universal (multi-user) budgets; any other account or budget scope
// calls a cheap endpoint instead and gets no rows
const budgetScope = [].concat(context.objects[0]?.budgetScope ?? [])[0];
const hasUserStates =
    context.dataSources[0].accountType === 'enterprise' &&
    ['multi_user_customer', 'multi_user_cost_center'].includes(budgetScope);

result = (hasUserStates ? data?.user_states || [] : []).map((s) => ({
    login: s.user,
    consumedAmount: typeof s.consumed_amount === 'number' ? s.consumed_amount : null,
    targetAmount: typeof s.target_amount === 'number' ? s.target_amount : null,
    hasOverride: !!s.override_budget_id
}));
