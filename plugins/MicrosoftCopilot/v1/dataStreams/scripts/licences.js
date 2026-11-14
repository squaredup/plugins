// Keep only SKUs that grant Microsoft 365 Copilot itself, identified by its service plan IDs, so
// suites that merely bundle free Copilot features aren't counted as Copilot seats. The plan
// list shows every Copilot-related plan in the SKU for context.
const COPILOT_PLAN_IDS = [
    "a62f8878-de10-42f3-b68f-6149a25ceb97",
    "3f30311c-6b1e-48a4-ab79-725b469da960",
];
const skus = (data && data.value) || [];
result = skus
    .map((s) => {
        const servicePlans = s.servicePlans || [];
        const isCopilot = servicePlans.some((p) =>
            COPILOT_PLAN_IDS.includes(String(p.servicePlanId).toLowerCase()),
        );
        const plans = servicePlans.filter((p) =>
            String(p.servicePlanName || "").toUpperCase().includes("COPILOT"),
        );
        return { s, plans, isCopilot };
    })
    .filter((x) => x.isCopilot)
    .map(({ s, plans }) => {
        const purchased = (s.prepaidUnits && s.prepaidUnits.enabled) || 0;
        const assigned = s.consumedUnits || 0;
        return {
            skuPartNumber: s.skuPartNumber,
            skuId: s.skuId,
            purchased,
            assigned,
            available: purchased - assigned,
            utilisation: purchased > 0 ? (assigned / purchased) * 100 : null,
            suspended: (s.prepaidUnits && s.prepaidUnits.suspended) || 0,
            warning: (s.prepaidUnits && s.prepaidUnits.warning) || 0,
            capabilityStatus: s.capabilityStatus,
            copilotPlans: plans.map((p) => p.servicePlanName),
        };
    });
