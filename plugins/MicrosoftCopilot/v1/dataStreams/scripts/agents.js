// One row per agent in the Microsoft Agent 365 registry. Owners arrive as directory IDs and are
// kept as a list: they link to imported Copilot Users (by Entra object ID) where the owner holds
// a Copilot licence. Optional `agents` object picker narrows the rows to the selected agents.
const DAY = 86400000;
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.agents) || [];
const wanted = new Set(selected.map((o) => String(unwrap(o.rawId) ?? "")).filter(Boolean));

result = ((data && data.value) || [])
    .filter((p) => !wanted.size || wanted.has(String(p.id)))
    .map((p) => {
        const ownerIds = [
            ...new Set([p.ownerId, ...(p.owners || []).map((o) => o && o.resourceId)].filter(Boolean)),
        ];
        const modified = p.lastModifiedDateTime ? Date.parse(p.lastModifiedDateTime) : NaN;
        return {
            id: p.id,
            displayName: p.displayName || p.id,
            ownershipStatus: ownerIds.length ? "OK" : "No owner",
            ownershipState: ownerIds.length ? "success" : "error",
            agentType: p.type || null,
            platform: p.platform || null,
            publisher: p.publisher || null,
            shortDescription: p.shortDescription || null,
            isBlocked: typeof p.isBlocked === "boolean" ? p.isBlocked : null,
            availableTo: p.availableTo || null,
            deployedTo: p.deployedTo || null,
            elementTypes: p.elementTypes || [],
            supportedHosts: p.supportedHosts || [],
            ownerIds,
            ownerCount: ownerIds.length,
            createdDateTime: p.createdDateTime || null,
            lastModifiedDateTime: p.lastModifiedDateTime || null,
            daysSinceModified: isNaN(modified) ? null : Math.floor((Date.now() - modified) / DAY),
            version: p.version || null,
            appId: p.appId || null,
        };
    });
