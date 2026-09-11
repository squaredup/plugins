// GET /restores/status/accounts previously had no post-request script and read timestamp/status
// directly off each account entry, which returned account and service names but never a run date.
// /backups/status/accounts (see companyBackups.js) uses the same account-list shape but nests
// individual runs in a `statusHistory` array, so this assumes /restores/status/accounts does too
// and flattens it the same way. Where an account has no statusHistory (e.g. no restore activity —
// see README known limitations), it falls back to the account object's own fields so accounts
// still list even with nothing to show against them.
const accounts = data?.results || [];
const includeHistory = context.config.includeHistory === true;

result = accounts.flatMap((account) => {
    const history = account.statusHistory;

    if (!history) {
        return [
            {
                accountId: account.accountId,
                accountName: account.accountName,
                productId: account.productId,
                companyId: account.companyId,
                groupId: account.groupId,
                timestamp: account.timestamp ?? null,
                status: account.status ?? null,
            }
        ];
    }

    const entries = includeHistory ? history : _.take(_.orderBy(history, ["timestamp"], ["desc"]), 1);

    return entries.map((entry) => ({
        accountId: account.accountId,
        accountName: account.accountName,
        productId: account.productId,
        companyId: account.companyId,
        groupId: account.groupId,
        timestamp: entry.timestamp,
        status: entry.status,
    }));
});
