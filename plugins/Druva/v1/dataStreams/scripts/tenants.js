// Tenants have no name of their own, so the label combines product and edition;
// the customer name is resolved separately from the indexed Customer object.
const products = { 1: 'Enterprise Workloads', 2: 'SaaS Apps and Endpoints' };
const statuses = {
    0: 'Creation pending',
    1: 'Ready',
    2: 'Suspended',
    3: 'Deletion initiated',
    4: 'Being migrated',
    5: 'Updating'
};

// Optional `customer` object picker; empty means all customers.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.customer) || [];
const customerIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

result = (data.tenants || [])
    .filter((t) => !customerIds.size || customerIds.has(t.customerID))
    .map((t) => {
        const productName = products[t.productID] || `Product ${t.productID}`;
        const edition = t.edition ? _.capitalize(t.edition) : '';
        return {
            id: t.id,
            tenantName: edition ? `${productName} (${edition})` : productName,
            customerId: t.customerID,
            productName,
            edition,
            statusName: statuses[t.status] || 'Unknown',
            tenantType: t.tenantType,
            licenseExpiryDate: t.licenseExpiryDate || null,
            quota: t.quota,
            quotaStartDate: t.quotaStartDate || null,
            quotaEndDate: t.quotaEndDate || null,
            servicePlanId: t.servicePlanID,
            storageRegions: (t.storageRegions || []).map((r) => r.name),
            createdOn: t.createdOn || null,
            deleteDate: t.deleteDate || null
        };
    });
