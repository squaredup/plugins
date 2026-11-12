// The report is XML, so every field arrives as a single-element array; unwrap and drop empty strings.
const v = (x) => {
    const s = Array.isArray(x) ? x[0] : x;
    return s === '' || s === undefined ? null : s;
};
// Report timestamps are UTC but carry no offset.
const utc = (x) => (v(x) ? v(x) + 'Z' : null);

// The report filters projects and environments itself; tenants are filtered here. A Space scope keeps everything.
const scoped = context.objects[0].rawId;
const spaceId = scoped.startsWith('Spaces-') ? scoped : [].concat(context.objects[0].spaceId)[0];

const rows = [].concat((data && data.Deployments && data.Deployments.Deployment) || []);

result = rows
    .map((d) => ({
        projectName: v(d.ProjectName),
        environmentName: v(d.EnvironmentName),
        tenantName: v(d.TenantName),
        channelName: v(d.ChannelName),
        releaseVersion: v(d.ReleaseVersion),
        state: v(d.TaskState),
        deployedBy: v(d.DeployedBy),
        queueTime: utc(d.QueueTime),
        startTime: utc(d.StartTime),
        completedTime: utc(d.CompletedTime),
        durationSeconds: v(d.DurationSeconds) === null ? null : Number(v(d.DurationSeconds)),
        projectId: v(d.ProjectId),
        environmentId: v(d.EnvironmentId),
        tenantId: v(d.TenantId),
        releaseId: v(d.ReleaseId),
        deploymentId: v(d.DeploymentId),
        taskId: v(d.TaskId),
        spaceId
    }))
    .filter((r) => r.deploymentId)
    .filter((r) => !scoped.startsWith('Tenants-') || r.tenantId === scoped);
