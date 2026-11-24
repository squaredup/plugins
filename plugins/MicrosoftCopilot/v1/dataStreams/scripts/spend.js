// Cost Management returns { columns: [{name}], rows: [[...]] }. One output row per day x group.
const props = (data && data.properties) || {};
const names = (props.columns || []).map((c) => c.name);
const idx = (n) => names.indexOf(n);
const groupBy = "{{groupBy || 'ServiceName'}}";
const iDate = idx("UsageDate");
const iCost = names.findIndex((n) => n === "Cost" || n === "PreTaxCost");
const iQty = idx("UsageQuantity");
const iCur = idx("Currency");
const iGroup = idx(groupBy);
const iSub = idx("SubscriptionName");
// Quantities are in each meter's own unit, so they only add up within one meter.
const keepQuantity = groupBy === "Meter";
// Above a single subscription (management group, billing account), the same resource group and
// resource name can exist in several subscriptions, so the label leads with the subscription.
const multiSubscription = !"{{dataSource.costScope}}".toLowerCase().startsWith("/subscriptions/");

// A resource's name is only unique within its resource group, so the label keeps the group
// (rg-prod/openai) and same-named resources in different groups stay separate series.
const resourceLabel = (id, sub) => {
    const parts = id.split("/").filter(Boolean);
    const rg = parts.findIndex((p) => p.toLowerCase() === "resourcegroups");
    const name = parts[parts.length - 1] || id;
    const label = rg >= 0 && parts[rg + 1] && rg + 1 < parts.length - 1 ? `${parts[rg + 1]}/${name}` : name;
    return multiSubscription && sub ? `${sub} / ${label}` : label;
};

const toDate = (v) => {
    const s = String(v);
    return /^[0-9]{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z` : s;
};

result = (props.rows || []).map((r) => {
    const g = iGroup >= 0 && r[iGroup] != null && r[iGroup] !== "" ? String(r[iGroup]) : "(none)";
    const isResource = groupBy === "ResourceId";
    return {
        usageDate: toDate(r[iDate]),
        group: isResource && g !== "(none)" ? resourceLabel(g, iSub >= 0 ? r[iSub] : null) : g,
        resourceId: isResource ? g : null,
        cost: r[iCost],
        quantity: keepQuantity && iQty >= 0 ? r[iQty] : null,
        currency: r[iCur],
    };
});
