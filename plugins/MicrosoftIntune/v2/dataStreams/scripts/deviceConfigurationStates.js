// One row per profile status record for the scoped managed device. The Intune report returns
// { Schema: [{ Column }], Values: [[...]] }, so each Values row is zipped with the column names. If the body
// arrives as a string (non-JSON content type), parse it, dropping any BOM. Runs once per page, so it only maps rows.
const report = (typeof data === "string" ? JSON.parse(data.replace(/^﻿/, "") || "{}") : data) || {};
const columns = (report.Schema || []).map((s) => s.Column);
const device = (context.objects && context.objects[0]) || {};

result = (report.Values || [])
    .map((values) => _.zipObject(columns, values))
    .map((r) => ({
        state: r.ReportStatus || null,
        policyName: r.PolicyName || null,
        // Lower-cased to match the rawId of imported Configuration Profile objects.
        policyId: r.PolicyId ? String(r.PolicyId).toLowerCase() : null,
        // The report labels administrative templates (ADMX) profiles "Endpoint Security", so name them here.
        policyType:
            r.UnifiedPolicyType === "GroupPolicyConfiguration"
                ? "Administrative templates"
                : r.UnifiedPolicyType_loc || r.UnifiedPolicyType || null,
        platform: r.UnifiedPolicyPlatformType_loc || r.UnifiedPolicyPlatformType || null,
        // Device-context records have an empty user principal name.
        userPrincipalName: r.UPN || null,
        lastReportedDateTime: r.PspdpuLastModifiedTimeUtc || null,
        statusCode: typeof r.PolicyStatus === "number" ? r.PolicyStatus : null,
        deviceName: device.name || null,
        deviceId: device.rawId || null
    }));
