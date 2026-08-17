const rows = data.escalation_policies || [];

result = rows.map((p) => ({
    id: p.id,
    name: p.name,
    num_loops: p.num_loops,
    teamIds: (p.teams || []).map((t) => t.id).join(","),
    teamNames: (p.teams || []).map((t) => t.summary).join(", "),
}));
