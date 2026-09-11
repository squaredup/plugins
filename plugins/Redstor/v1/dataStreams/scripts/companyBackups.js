// GET /backups/status/accounts returns one entry per account, each carrying a
// `statusHistory` array covering a fixed rolling seven day window. Flattening every
// run produces roughly seven rows per account, which on a large company approaches
// the response size limit, so only the latest run per account is kept by default.
// The endpoint's `productId` field actually carries service ids (94 = Exchange,
// 91 = OneDrive, 92 = SharePoint, 107 = Teams), not the product ids used elsewhere.
const accounts = data?.results || [];
const includeHistory = context.config.includeHistory === true;

result = accounts.flatMap((account) => {
    const history = account.statusHistory || [];
    const entries = includeHistory ? history : _.take(_.orderBy(history, ["timestamp"], ["desc"]), 1);

    return entries.map((entry) => ({
        accountId: account.accountId,
        accountName: account.accountName,
        serviceId: account.productId,
        timestamp: entry.timestamp,
        status: entry.status,
        message: entry.message,
        errorCount: entry.errorCount,
    }));
});
