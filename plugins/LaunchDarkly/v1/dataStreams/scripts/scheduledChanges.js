// Instruction kinds are LaunchDarkly semantic-patch kinds; unknown kinds fall back to the raw kind.
// The environment key is a stream parameter, so read it back from the response's self link.
const envKey = (data?._links?.self?.href || "").match(/\/environments\/([^/]+)\/scheduled-changes/)?.[1];

const KINDS = {
    turnFlagOn: "Turn flag on",
    turnFlagOff: "Turn flag off",
    updateFallthroughVariationOrRollout: "Update fallthrough",
    updateOffVariation: "Update off variation",
    addRule: "Add rule",
    removeRule: "Remove rule",
    updateRuleVariationOrRollout: "Update rule serve",
    addTargets: "Add targets",
    removeTargets: "Remove targets",
    addPrerequisite: "Add prerequisite",
    removePrerequisite: "Remove prerequisite",
    addClauses: "Add rule clauses",
    removeClauses: "Remove rule clauses",
    updateClause: "Update rule clause"
};

const iso = (ms) => (ms ? new Date(ms).toISOString() : null);

const summarise = (instructions) =>
    (instructions || []).map((i) => KINDS[i?.kind] || i?.kind).filter(Boolean).join(", ");

result = (data?.items || []).map((item) => ({
    id: item._id,
    executionDate: iso(item.executionDate),
    change: summarise(item.instructions),
    environment: envKey,
    createdAt: iso(item._creationDate),
    creator: item._maintainerId,
    conflicts: Array.isArray(item.conflicts) ? item.conflicts.length : 0
}));
