// Flattens evidence into per-alert lists and maps serviceSource to a friendly name
const sourceNames = {
    dataLossPrevention: 'Data loss prevention',
    microsoftInsiderRiskManagement: 'Insider risk management',
    microsoftSecurityForAI: 'Security for AI'
};

const distinct = (values) => [...new Set(values.filter((v) => typeof v === 'string' && v !== ''))];

// Optional Users filter (consolidated stream: selection is on context.config.users, rawIds and UPN properties arrive as arrays)
const unwrap = (p) => (Array.isArray(p) ? p[0] : p);
const selected = Array.isArray(context.config && context.config.users) ? context.config.users : [];
const selectedIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean).map((v) => String(v).toLowerCase()));
const selectedUpns = new Set(
    selected.map((o) => unwrap(o.userPrincipalName)).filter(Boolean).map((v) => String(v).toLowerCase())
);

result = (data && Array.isArray(data.value) ? data.value : []).map((alert) => {
    const evidence = Array.isArray(alert.evidence) ? alert.evidence : [];
    const ofType = (type) => evidence.filter((e) => e && e['@odata.type'] === type);

    // Users appear as userEvidence, and as mailboxEvidence on email alerts; both carry a userAccount
    const accounts = ofType('#microsoft.graph.security.userEvidence')
        .concat(ofType('#microsoft.graph.security.mailboxEvidence'))
        .map((e) => e.userAccount || {});
    const users = distinct(
        accounts.map((account) => {
            const name = account.userPrincipalName || account.accountName;
            return typeof name === 'string' ? name.toLowerCase() : null;
        })
    );
    const userIds = distinct(
        accounts.map((account) => (typeof account.azureAdUserId === 'string' ? account.azureAdUserId.toLowerCase() : null))
    );
    const files = distinct(
        ofType('#microsoft.graph.security.fileEvidence').map((e) => (e.fileDetails || {}).fileName || null)
    );

    const { evidence: _evidence, ...rest } = alert;
    return {
        ...rest,
        serviceSource: sourceNames[alert.serviceSource] || alert.serviceSource || null,
        users,
        userIds,
        files,
        evidenceCount: evidence.length
    };
}).filter(
    (row) =>
        (selectedIds.size === 0 && selectedUpns.size === 0) ||
        row.userIds.some((id) => selectedIds.has(id)) ||
        row.users.some((u) => selectedUpns.has(u))
);
