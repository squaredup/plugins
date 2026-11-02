// resourceId looks like proj/<project>:env/<environment>:flag/<flag>. Only IDs are returned
// for the requestor (no name), so the member ID is surfaced as-is.
const iso = (ms) => (ms ? new Date(Number(ms)).toISOString() : null);

const parseResource = (resourceId) => {
    const parts = {};
    for (const segment of String(resourceId || "").split(":")) {
        const slash = segment.indexOf("/");
        if (slash > 0) {
            // Resource specifiers can carry tags after the key, e.g. "flag/my-flag;tag1,tag2".
            parts[segment.slice(0, slash)] = segment.slice(slash + 1).split(";")[0];
        }
    }
    return parts;
};

const summariseInstructions = (instructions) => {
    const kinds = (Array.isArray(instructions) ? instructions : []).map((i) => i?.kind).filter(Boolean);
    return [...new Set(kinds)].join(", ");
};

const reviewStatusLabel = { approved: "Approved", declined: "Declined", pending: "Pending" };

result = (data?.items || []).map((req) => {
    const resource = parseResource(req.resourceId);
    const isFlag = resource.flag !== undefined;
    const reviews = req.allReviews || [];
    const instructions = summariseInstructions(req.instructions);
    return {
        approvalId: req._id,
        // The description is optional, so fall back to what the request changes to keep a label.
        description: req.description || instructions || resource.flag || null,
        createdAt: iso(req.creationDate),
        reviewState: reviewStatusLabel[req.reviewStatus] || req.reviewStatus,
        reviewStatus: req.reviewStatus,
        status: req.status,
        requestorId: req.requestorId || null,
        projectKey: resource.proj || null,
        environmentKey: resource.env || null,
        resourceKind: isFlag ? "flag" : resource.segment !== undefined ? "segment" : null,
        flagId: isFlag && resource.proj ? `${resource.proj}/${resource.flag}` : null,
        flagKey: isFlag ? resource.flag : null,
        instructions,
        executionDate: iso(req.executionDate),
        appliedDate: iso(req.appliedDate),
        reviewers: (req.notifyMemberIds || []).length,
        approvals: reviews.filter((r) => r.kind === "approve").length,
        declines: reviews.filter((r) => r.kind === "decline").length,
    };
});
