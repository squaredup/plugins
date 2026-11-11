// dataStreams/scripts/escalationPaths.js
// Counts levels from the nested path[] nodes, joins current_responders into a
// readable string, and applies the optional Team filter (team_ids is not
// filterable in the API). Stateless per-row filter, safe per page.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.team) || [];
const teamIds = new Set(
    (Array.isArray(selected) ? selected : [selected])
        .map((o) => unwrap(o && o.rawId))
        .filter(Boolean),
);

const countLevels = (nodes) =>
    (nodes || []).reduce(
        (total, node) =>
            total +
            (node.level ? 1 : 0) +
            (node.if_else
                ? countLevels(node.if_else.then_path) +
                  countLevels(node.if_else.else_path)
                : 0) +
            (node.repeat ? countLevels(node.repeat.repeat_path) : 0),
        0,
    );

result = (data.escalation_paths || [])
    .filter(
        (path) =>
            !teamIds.size || (path.team_ids || []).some((id) => teamIds.has(id)),
    )
    .map((path) => {
        const responders = path.current_responders || [];
        return {
            id: path.id,
            name: path.name,
            kind: path.kind,
            levelCount: countLevels(path.path),
            currentResponders: responders.map((u) => u.name).join(", "),
            responderCount: responders.length,
            teamIds: (path.team_ids || []).join(", "),
            workingHours: (path.working_hours || [])
                .map((w) => (w.name || w.id) + (w.timezone ? " (" + w.timezone + ")" : ""))
                .filter(Boolean)
                .join(", "),
        };
    });
