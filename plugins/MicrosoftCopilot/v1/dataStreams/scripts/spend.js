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

const toDate = (v) => {
    const s = String(v);
    return /^[0-9]{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z` : s;
};

result = (props.rows || []).map((r) => {
    const g = iGroup >= 0 && r[iGroup] != null && r[iGroup] !== "" ? String(r[iGroup]) : "(none)";
    const isResource = groupBy === "ResourceId";
    return {
        usageDate: toDate(r[iDate]),
        group: isResource ? g.split("/").filter(Boolean).pop() || g : g,
        resourceId: isResource ? g : null,
        cost: r[iCost],
        quantity: r[iQty],
        currency: r[iCur],
    };
});
