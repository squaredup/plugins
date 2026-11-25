// The grouped dimension's value lives in a field named after it (or in tags
// when grouping by tag); copy it into one "group" column.
const groupParam = context.config.groupBy;
const groupBy = [].concat(groupParam ?? []).map((g) => (g && g.value) || g)[0] || "service";

const groupOf = (item) => {
    if (groupBy === "tagNamespace") {
        const tag = (item.tags || [])[0];
        return tag ? `${tag.key}: ${tag.value}` : "Untagged";
    }
    if (groupBy === "compartmentName") {
        return item.compartmentPath || item.compartmentName || "Unknown";
    }
    return item[groupBy] || "Unknown";
};

result = (data?.items || []).map((item) => ({
    date: item.timeUsageStarted,
    group: groupOf(item),
    amount: item.computedAmount ?? null,
    currency: item.currency || null,
    quantity: item.computedQuantity ?? null,
    unit: item.unit || null,
}));
