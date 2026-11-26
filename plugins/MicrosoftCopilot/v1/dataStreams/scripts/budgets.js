// One row per Cost Management budget at the configured scope. A budget can be narrowed to
// resource groups, resources, meters or tags, so its filter is summarised alongside it: the
// budget that guards Copilot spend is usually the one filtered to the Copilot Studio billing
// policy's Power Platform account resource.
const amountOf = (v) => (v && typeof v.amount === "number" ? v.amount : null);
const pct = (part, whole) => (part !== null && whole > 0 ? (part / whole) * 100 : null);

// Azure only returns forecastSpend for some budgets. Without it, the forecast is a straight
// line from the spend so far in the current period (Monthly, Quarterly or Annually, counted
// from the budget's start date). Billing-period grains can't be placed, and budgets that haven't
// started have no current period, so they get none.
const MONTHS = { Monthly: 1, Quarterly: 3, Annually: 12 };
const currentPeriod = (start, grain) => {
    const step = MONTHS[grain];
    const from = start ? new Date(start) : null;
    if (!step || !from || isNaN(from)) {
        return null;
    }
    const now = new Date();
    if (now < from) {
        return null;
    }
    const elapsed =
        (now.getUTCFullYear() - from.getUTCFullYear()) * 12 + (now.getUTCMonth() - from.getUTCMonth());
    const at = (n) => new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + n, from.getUTCDate()));
    let n = Math.floor(elapsed / step) * step;
    if (at(n) > now) {
        n -= step;
    }
    return { start: at(n), end: at(n + step) };
};

const describe = (f) => {
    if (!f) {
        return [];
    }
    const parts = [];
    for (const clause of [].concat(f.and || [], f.dimensions || f.tags ? [f] : [])) {
        if (clause.dimensions) {
            parts.push(`${clause.dimensions.name}: ${(clause.dimensions.values || []).join(", ")}`);
        }
        if (clause.tags) {
            parts.push(`Tag ${clause.tags.name}: ${(clause.tags.values || []).join(", ")}`);
        }
    }
    return parts;
};

result = (data.value || []).map((b) => {
    const p = b.properties || {};
    const amount = typeof p.amount === "number" ? p.amount : null;
    const spent = amountOf(p.currentSpend);
    const period = currentPeriod(p.timePeriod && p.timePeriod.startDate, p.timeGrain);
    const share = period ? (Date.now() - period.start) / (period.end - period.start) : null;
    const forecast =
        amountOf(p.forecastSpend) ??
        (spent !== null && share !== null && share > 0.02 ? spent / share : null);
    const used = pct(spent, amount);
    const forecastUsed = pct(forecast, amount);
    // Over budget = error; 80% used, or on course to exceed it, = warning.
    const state =
        used === null
            ? "unknown"
            : used >= 100
              ? "error"
              : used >= 80 || (forecastUsed !== null && forecastUsed > 100)
                ? "warning"
                : "success";
    const filters = describe(p.filter);
    return {
        id: b.id,
        name: b.name,
        category: p.category || null,
        timeGrain: p.timeGrain || null,
        amount,
        currentSpend: spent,
        forecastSpend: forecast,
        currency: (p.currentSpend && p.currentSpend.unit) || (p.forecastSpend && p.forecastSpend.unit) || null,
        percentUsed: used,
        percentForecast: forecastUsed,
        budgetState: state,
        filters,
        periodStart: period ? period.start.toISOString() : null,
        periodEnd: period ? period.end.toISOString() : null,
        endDate: (p.timePeriod && p.timePeriod.endDate) || null,
    };
});
