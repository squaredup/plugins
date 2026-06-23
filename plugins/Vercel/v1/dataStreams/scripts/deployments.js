// /v7/deployments returns { deployments: [...], pagination: {...} }.
// One row per deployment. Optional `project` objects-picker (stream ui name
// "project") arrives at context.config.project as an array (multi-select), each
const deployments = (data && data.deployments) || [];

// Token paging walks `until` from pagination.next back to the `since` floor, so
// the first page starts at "now". For a historical timeframe (e.g. lastMonth)
// that over-fetches rows newer than the window end — bound the top here.
// (We can't set an `until` getArg: it collides with the paging `out=until`.)
const tf = context.timeframe || {};
const untilMs = tf.unixEnd ? tf.unixEnd * 1000 : null;

const scoped = deployments.filter(
    (d) => untilMs === null || d.created <= untilMs,
);

result = scoped.map((d) => ({
    ...d,
    uid: d.uid,
    name: d.name,
    state: d.readyState || d.state,
    target: d.target || "preview",
    projectId: d.projectId,
    created: d.created,
    inspectorUrl: d.inspectorUrl,
    creator: (d.creator && (d.creator.username || d.creator.uid)) || null,
}));

