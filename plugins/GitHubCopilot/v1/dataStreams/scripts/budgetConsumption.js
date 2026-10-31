const amount = typeof data?.budget_amount === 'number' ? data.budget_amount : null;
const consumed = typeof data?.consumed_amount === 'number' ? data.consumed_amount : null;
const percentUsed = amount && consumed !== null ? (consumed / amount) * 100 : null;
const budget = context.objects[0];

const statusOf = () => {
    if (amount === null) {
        return 'No limit';
    }
    if (consumed === null) {
        return 'Unavailable';
    }
    // A $0 budget allows no paid usage, so it is only exhausted once something has been spent
    if (amount === 0) {
        return consumed > 0 ? 'Exhausted' : 'Under budget';
    }
    return percentUsed >= 100 ? 'Exhausted' : percentUsed >= 80 ? 'Over 80%' : 'Under budget';
};

result = data
    ? [
          {
              budgetId: String(data.id ?? budget.rawId),
              budgetName: budget.name,
              budgetAmount: amount,
              consumedAmount: consumed,
              remainingAmount: amount !== null && consumed !== null ? Math.max(amount - consumed, 0) : null,
              percentUsed,
              status: statusOf(),
              preventFurtherUsage: typeof data.prevent_further_usage === 'boolean' ? data.prevent_further_usage : null
          }
      ]
    : [];
