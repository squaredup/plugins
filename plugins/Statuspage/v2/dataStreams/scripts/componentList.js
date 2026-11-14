if (!data || !data.page || !Array.isArray(data.components)) {
    api.report.error('The status page did not return a component list.');
}

const pageName = data.page.name;

// Group entries are containers whose status only rolls up their children; the children carry a group_id.
const groups = new Map(data.components.filter((c) => c.group).map((c) => [c.id, c.name]));
const components = data.components.filter((c) => !c.group);

// Statuspage allows the same component name in different groups (e.g. "API" under each region), so qualify
// a repeated name with its group. The page name prefix keeps objects distinct across several data sources.
const nameCounts = new Map();
for (const c of components) {
    nameCounts.set(c.name, (nameCounts.get(c.name) || 0) + 1);
}

// Some pages already lead each component name with the page name (Docker's "Docker Hub Registry"); prefixing those
// again would read "Docker / Docker Hub Registry", so they keep their own name.
const pagePrefix = `${pageName} `.toLowerCase();

result = components.map((c) => {
    const group = c.group_id ? groups.get(c.group_id) : undefined;
    const label = nameCounts.get(c.name) > 1 && group ? `${group} / ${c.name}` : c.name;

    return {
        id: c.id,
        name: label.toLowerCase().startsWith(pagePrefix) ? label : `${pageName} / ${label}`,
        componentName: c.name,
        group: group || 'Ungrouped',
        pageId: data.page.id,
        pageName,
        description: c.description || undefined
    };
});
