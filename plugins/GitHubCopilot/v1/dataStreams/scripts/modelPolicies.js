// Model policies only exist for organizations; enterprise accounts call a cheap endpoint instead and get no rows
const isOrg = context.dataSources[0].accountType !== 'enterprise';
const labels = { enabled: 'Enabled', disabled: 'Disabled', delegate_to_default: 'Default', unconfigured: 'Not configured' };
const defaultState = data?.default_availability?.policy_state;

result = (isOrg ? data?.models || [] : []).map((m) => ({
    model: m.model_name,
    displayName: m.display_name || m.model_name,
    policyState: labels[m.policy_state] || m.policy_state || null,
    defaultPolicy: defaultState ? labels[defaultState] || defaultState : null
}));
