// The audit log API returns title and description as markdown. Strip links, emphasis and
// escapes so the columns read as plain text, keeping the last link as the LaunchDarkly URL.
const plain = (text) =>
    (text || "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^\s*\*\s+/gm, "")
        .replace(/\*\*|~~|`/g, "")
        .replace(/\\(.)/g, "$1")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("; ");

const lastLink = (title) => {
    const links = [...(title || "").matchAll(/\]\((https?:[^)]+)\)/g)];
    return links.length ? links[links.length - 1][1] : null;
};

const memberName = (item) => {
    const member = item.member;
    if (member) {
        return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;
    }
    return item.token?.name || null;
};

// Resources look like proj/<project>:env/<env>:flag/<flag>; flag keys are only unique per project.
const parseResource = (resource) => {
    const parts = {};
    for (const segment of (resource || "").split(":")) {
        const slash = segment.indexOf("/");
        if (slash > 0) {
            // Resource specifiers can carry tags after the key, e.g. "flag/my-flag;tag1,tag2".
            parts[segment.slice(0, slash)] = segment.slice(slash + 1).split(";")[0];
        }
    }
    return parts;
};

// A change can touch several environments at once (e.g. creating a flag), so list them all.
const environments = (item) =>
    [...new Set((item.target?.resources || []).map((r) => parseResource(r).env).filter(Boolean))].join(", ") ||
    undefined;

const iso = (ms) => (ms ? new Date(ms).toISOString() : null);

// Paging walks back from now by passing the oldest entry's date as the next "before", so the
// first page has no upper bound; drop entries newer than the end of the selected timeframe.
const end = context.timeframe?.unixEnd ? context.timeframe.unixEnd * 1000 : Infinity;

result = (data?.items || []).filter((item) => item.date <= end).map((item) => {
    const resource = parseResource(item.target?.resources?.[0]);
    const flagKey = resource.flag;
    const project = resource.proj;
    return {
        id: item._id,
        date: iso(item.date),
        title: plain(item.title),
        description: plain(item.shortDescription || item.description),
        kind: item.kind,
        action: item.titleVerb,
        member: memberName(item),
        project,
        environment: environments(item),
        flagId: flagKey && project ? `${project}/${flagKey}` : null,
        flagKey,
        link: lastLink(item.title),
    };
});
