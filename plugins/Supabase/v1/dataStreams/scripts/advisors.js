const project = context.objects[0];
const perfUrl = `https://api.supabase.com/v1/projects/${project.rawId}/advisors/performance`;
const clean = (s) => (typeof s === 'string' ? s.replace(/\\`/g, '`') : s);
const cap = (s) => (typeof s === 'string' && s ? s.charAt(0) + s.slice(1).toLowerCase() : null);

// The security advisors come first; the performance advisors are fetched as a second page
const onSecurityPage = !context.pagingContext;
pagingContext = onSecurityPage ? perfUrl : undefined;

const lints = data && Array.isArray(data.lints) ? data.lints : [];
result = lints.map((lint) => {
    const meta = lint.metadata || {};
    const categories = Array.isArray(lint.categories) ? lint.categories.map(cap).filter(Boolean) : [];
    return {
        title: lint.title,
        level: lint.level,
        categories: categories.length ? categories : [onSecurityPage ? 'Security' : 'Performance'],
        advisor: onSecurityPage ? 'Security' : 'Performance',
        lintName: lint.name,
        entity: meta.entity || (meta.schema && meta.name ? `${meta.schema}.${meta.name}` : meta.name || null),
        entityType: meta.type || null,
        detail: clean(lint.detail),
        description: clean(lint.description),
        remediation: lint.remediation,
        cacheKey: lint.cache_key,
        observedAt: lint.observed_at || null,
        projectRef: project.rawId,
        projectName: project.name
    };
});
