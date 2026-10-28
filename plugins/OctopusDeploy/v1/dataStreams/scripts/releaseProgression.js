// One row per release and environment (lifecycle order), so a status grid can draw the
// release-by-environment view. The request only targets the selected project's own space;
// other spaces return no Releases.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');
const when = (s) => {
    const t = new Date(s);
    return Number.isFinite(t.getTime()) ? `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())} UTC` : '';
};

const limit = Number(context.config && context.config.releaseCount) || 10;
const envs = (data && data.Environments) || [];
const rows = [];

((data && data.Releases) || []).slice(0, limit).forEach((r, releaseIndex) => {
    envs.forEach((e, envIndex) => {
        // An environment can hold several deployments of a release (redeployments, tenants); use the latest.
        const deps = ((r.Deployments || {})[e.Id] || []).slice().sort((a, b) => Date.parse(b.Created) - Date.parse(a.Created));
        const d = deps[0];
        const ready = !d && (r.NextDeployments || []).includes(e.Id);
        rows.push({
            releaseVersion: r.Release.Version,
            releaseSortOrder: releaseIndex + 1,
            channelName: r.Channel ? r.Channel.Name : null,
            releaseCreated: r.Release.Assembled || null,
            environmentName: e.Name,
            environmentSortOrder: envIndex + 1,
            // Newest release first, then environments in lifecycle order
            gridOrder: releaseIndex * 1000 + envIndex,
            state: d ? (d.HasPendingInterruptions ? 'AwaitingIntervention' : d.State) : ready ? 'ReadyToDeploy' : 'NotDeployed',
            detail: d ? when(d.CompletedTime || d.StartTime || d.QueueTime) : ready ? 'Ready to deploy' : 'Not deployed',
            deployedTime: d ? new Date(d.CompletedTime || d.StartTime || d.QueueTime).toISOString() : null,
            releaseId: r.Release.Id,
            projectId: r.Release.ProjectId,
            environmentId: e.Id
        });
    });
});

result = rows;
