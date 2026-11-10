// GraphQL reports errors with HTTP 200 and an `errors` array, which errorHandling never sees, so raise them here.
const graphqlErrors = ((data && data.errors) || []).map((e) => e && e.message).filter(Boolean);
const usage = data && data.data && data.data.usage;
if (!usage) {
    throw new Error(graphqlErrors.join("; ") || "Spacelift returned no usage data");
}

const iso = (seconds) => (typeof seconds === "number" && seconds > 0 ? new Date(seconds * 1000).toISOString() : null);
const percent = (part, whole) => (typeof part === "number" && whole > 0 ? (part / whole) * 100 : null);

result = [
    {
        usedMinutes: usage.usedMinutes,
        allowedMinutes: usage.allowedMinutes,
        minutesUsedPercent: percent(usage.usedMinutes, usage.allowedMinutes),
        usedPublicMinutes: usage.usedPublicMinutes,
        usedPrivateMinutes: usage.usedPrivateMinutes,
        usedSeats: usage.usedSeats,
        allowedSeats: usage.allowedSeats,
        seatsUsedPercent: percent(usage.usedSeats, usage.allowedSeats),
        usedWorkers: usage.usedWorkers,
        billingPeriodStart: iso(usage.billingPeriodStart),
        billingPeriodEnd: iso(usage.billingPeriodEnd)
    }
];
