// /storage/accounts doesn't echo the company id back onto each row, so stamp it
// from the scoped request object to relate accounts back to their company.
const accounts = data?.results || [];
const companyId = context.objects[0].rawId;

result = accounts.map((account) => ({
    ...account,
    companyId,
}));
