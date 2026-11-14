// TeamCity returns the next page as `nextHref`, a path relative to the server root. Resolve it
// against this request's URL so `nextUrl` paging can follow it; no `nextHref` ends paging.
pagingContext = data && data.nextHref ? new URL(data.nextHref, response.url).href : undefined;

// The queue locator's `project` dimension matches only a project's own build configurations, and
// its `buildType` dimension resolves to a single configuration, so the optional object filters are
// applied here instead. The queue is paged, not capped, so no queued build is missed.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const ids = (v) => new Set((Array.isArray(v) ? v : []).map((o) => unwrap(o.rawId)).filter(Boolean));
const projects = ids(context.config && context.config.project);
const configurations = ids(context.config && context.config.buildConfiguration);

result = ((data && data.build) || [])
    .filter((b) => {
        if (configurations.size && !configurations.has(b.buildTypeId)) {
            return false;
        }
        if (projects.size) {
            const project = (b.buildType && b.buildType.project) || {};
            const ancestors = ((project.ancestorProjects && project.ancestorProjects.project) || []).map((p) => p.id);
            return [project.id, ...ancestors].some((id) => projects.has(id));
        }
        return true;
    })
    .map(({ buildType, ...build }) => ({
        ...build,
        buildType: { name: buildType && buildType.name, projectName: buildType && buildType.projectName },
    }));
