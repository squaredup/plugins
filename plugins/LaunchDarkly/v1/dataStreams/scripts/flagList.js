// Flag keys are only unique within a project, so the object id combines both keys.
// Rows are kept lean because large projects hold thousands of flags.
const projectKey = context.objects[0].rawId;

const maintainerName = (flag) => {
    const member = flag._maintainer;
    if (member) {
        return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;
    }
    return flag._maintainerTeam?.name;
};

result = (data?.items || []).map((flag) => ({
    flagId: `${projectKey}/${flag.key}`,
    name: flag.name,
    flagKey: flag.key,
    projectKey,
    kind: flag.kind,
    temporary: flag.temporary === true,
    deprecated: flag.deprecated === true,
    tagList: (flag.tags || []).join(", "),
    maintainer: maintainerName(flag),
    createdAt: flag.creationDate ? new Date(flag.creationDate).toISOString() : null,
}));
