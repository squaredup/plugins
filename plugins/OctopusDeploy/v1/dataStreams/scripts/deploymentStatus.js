// The dashboard returns deployments (Items) plus lookup arrays; join the names here.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const byId = (arr) => Object.fromEntries((arr || []).map((x) => [x.Id, x]));
const iso = (s) => (s ? new Date(s).toISOString() : null);
const seconds = (a, b) => {
    const s = Date.parse(a);
    const e = Date.parse(b);
    return Number.isFinite(s) && Number.isFinite(e) ? Math.round((e - s) / 1000) : null;
};

const projects = byId(data.Projects);
const projectGroups = byId(data.ProjectGroups);
const environments = byId(data.Environments);
const tenants = byId(data.Tenants);
// The dashboard lists environments in lifecycle sort order, so position is the sort order
const envOrder = Object.fromEntries((data.Environments || []).map((e, i) => [e.Id, i + 1]));
// Narrow to the scoped object; a Space scope keeps everything.
const scoped = context.objects[0].rawId;
const spaceId = scoped.startsWith('Spaces-') ? scoped : unwrap(context.objects[0].spaceId);
const keep = (d) =>
    (!scoped.startsWith('Projects-') || d.ProjectId === scoped) &&
    (!scoped.startsWith('Environments-') || d.EnvironmentId === scoped) &&
    (!scoped.startsWith('Tenants-') || d.TenantId === scoped);

const current = (data.Items || []).filter((d) => d.IsCurrent !== false && keep(d));
const groupName = (projectId) => (projectGroups[(projects[projectId] || {}).ProjectGroupId] || {}).Name || null;

result = current
    .map((d) => ({
        projectGroupName: groupName(d.ProjectId),
        projectName: (projects[d.ProjectId] || {}).Name || d.ProjectId,
        environmentName: (environments[d.EnvironmentId] || {}).Name || d.EnvironmentId,
        environmentSortOrder: envOrder[d.EnvironmentId] || null,
        tenantName: d.TenantId ? (tenants[d.TenantId] || {}).Name || d.TenantId : null,
        releaseVersion: d.ReleaseVersion,
        status: d.HasPendingInterruptions ? 'AwaitingIntervention' : d.State,
        state: d.State,
        queueTime: iso(d.QueueTime),
        startTime: iso(d.StartTime),
        completedTime: iso(d.CompletedTime),
        durationSeconds: seconds(d.StartTime, d.CompletedTime),
        hasWarningsOrErrors: !!d.HasWarningsOrErrors,
        hasPendingInterruptions: !!d.HasPendingInterruptions,
        errorMessage: d.ErrorMessage || null,
        projectId: d.ProjectId,
        environmentId: d.EnvironmentId,
        tenantId: d.TenantId || null,
        taskId: d.TaskId,
        deploymentId: d.DeploymentId || d.Id,
        spaceId
    }));
