// dataStreams/scripts/slos.js
// "status" is null until an SLO's first measurement pass completes - every
// derived figure below must stay null in that case too, not default to 0
// (per OpenObserve's own docs: "not yet measured" and "measured as 0" are
// different). "tags"/"group_by" are arrays, which can't be read via
// valueExpression even just to join them (see project memory), so that
// happens here. "config" is a free-form object shaped by sli_type - kept as
// a JSON blob rather than modelled field-by-field.
// computed_at/watermark_end/measuring_since are Unix seconds.
const secsToIso = (secs) => (secs != null ? new Date(secs * 1000).toISOString() : null);

result = (data.list || []).map((slo) => {
    const status = slo.status;
    return {
        id: slo.id,
        name: slo.name,
        description: slo.description || "",
        enabled: slo.enabled,
        target: slo.target,
        owner: slo.owner || "",
        folderId: slo.folder_id,
        tags: slo.tags || [],
        sliType: slo.sli_type,
        config: slo.config != null ? JSON.stringify(slo.config) : null,
        windowSecs: slo.window_secs,
        sliceIntervalSecs: slo.slice_interval_secs,
        groupBy: slo.group_by || [],
        noData: status ? status.no_data : null,
        sli: status ? status.sli : null,
        coverage: status ? status.coverage : null,
        good: status ? status.good : null,
        total: status ? status.total : null,
        coveredSlices: status ? status.covered_slices : null,
        burnRate: status ? status.burn_rate : null,
        errorBudgetRemaining: status ? status.error_budget_remaining : null,
        timeToExhaustSecs: status ? status.time_to_exhaust_secs : null,
        computedAt: status ? secsToIso(status.computed_at) : null,
        watermarkEnd: status ? secsToIso(status.watermark_end) : null,
        measuringSince: status ? secsToIso(status.measuring_since) : null,
        staleWatermark: status ? status.stale_watermark : null,
    };
});
