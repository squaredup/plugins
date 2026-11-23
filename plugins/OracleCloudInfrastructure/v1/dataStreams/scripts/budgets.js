// Without a script, the platform flattens each budget's `targets` list to the text
// "[object Array]". Returning the rows from a script keeps it a real list, which the
// column's array shape needs.
result = (Array.isArray(data) ? data : []).map((budget) => ({
    ...budget,
    targets: [].concat(budget.targets || [])
}));
