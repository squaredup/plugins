// GET /backups/status/accounts returns one entry per account, each carrying
// a `statusHistory` array of recent runs — flatten to one row per run.
const accounts = data?.results || [];

result = accounts.flatMap((account) =>
    (account.statusHistory || []).map((entry) => ({
        accountId: account.accountId,
        accountName: account.accountName,
        productId: account.productId,
        timestamp: entry.timestamp,
        status: entry.status,
        message: entry.message,
        errorCount: entry.errorCount,
    })),
);
