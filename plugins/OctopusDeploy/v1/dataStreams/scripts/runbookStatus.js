// One row per environment the runbook can run in (lifecycle order), showing the latest run there.
// The request only targets the selected runbook's own space.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');
const when = (s) => {
    const t = new Date(s);
    return Number.isFinite(t.getTime()) ? `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())} UTC` : '';
};
const iso = (s) => {
    const t = new Date(s);
    return s && Number.isFinite(t.getTime()) ? t.toISOString() : null;
};

const envs = (data && data.Environments) || [];
const runs = (data && data.RunbookRuns) || {};
const scoped = (context.objects && context.objects[0]) || {};
const anyRun = Object.values(runs).reduce((a, l) => a.concat(l), [])[0];

result = envs.map((e, envIndex) => {
    // An environment can hold several runs (tenants, reruns); use the latest.
    const list = (runs[e.Id] || []).slice().sort((a, b) => Date.parse(b.Created) - Date.parse(a.Created));
    const r = list[0];
    const finished = r ? r.CompletedTime || r.StartTime || r.QueueTime || r.Created : null;
    const seconds = r && r.StartTime && r.CompletedTime ? Math.max(0, Math.round((Date.parse(r.CompletedTime) - Date.parse(r.StartTime)) / 1000)) : null;
    return {
        environmentName: e.Name,
        environmentSortOrder: envIndex + 1,
        state: r ? (r.HasPendingInterruptions ? 'AwaitingIntervention' : r.State) : 'NeverRun',
        detail: r ? when(finished) : 'Never run',
        lastRunTime: r ? iso(finished) : null,
        durationSeconds: seconds,
        runBy: r ? r.RunBy || null : null,
        snapshotName: r ? r.RunbookSnapshotName || null : null,
        errorMessage: r ? r.ErrorMessage || null : null,
        runbookId: r ? r.RunbookId : scoped.rawId || null,
        projectId: r ? r.ProjectId : anyRun ? anyRun.ProjectId : null,
        environmentId: e.Id,
        taskId: r ? r.TaskId : null
    };
});
