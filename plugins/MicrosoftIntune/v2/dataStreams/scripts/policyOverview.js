// One row per policy from the single deviceStatusOverview object, stamped with the scoped policy so tiles
// can drill down to it, plus a state derived from the counts.
// v1.0 has no conflictCount or notApplicablePlatformCount (beta only), so there is no warning state.
const policy = context.objects[0];

result = [
    {
        state: data.errorCount + data.failedCount > 0 ? "error" : "success",
        policyName: policy.name,
        policyId: policy.rawId,
        successCount: data.successCount,
        errorCount: data.errorCount,
        failedCount: data.failedCount,
        pendingCount: data.pendingCount,
        notApplicableCount: data.notApplicableCount,
        lastUpdateDateTime: data.lastUpdateDateTime,
        configurationVersion: data.configurationVersion
    }
];
