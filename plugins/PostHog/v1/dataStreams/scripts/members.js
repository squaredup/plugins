// api/organizations/{id}/members/ returns { count, next, previous, results: [...] }.
// Each result nests the user under `user` and level under `level` — flatten,
// compose a display name, and map the numeric level to a role label.
// The endpoint doesn't return the parent org id, but this stream is always
// scoped to one organization — carry that org's id onto each row so the import
// step can link members to their organization.
const ROLE = { 1: "Member", 8: "Admin", 15: "Owner" };
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const orgId = unwrap(
    context.objects && context.objects[0] && context.objects[0].rawId,
);
result = (data.results || []).map((m) => {
    const u = m.user || {};
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    return {
        id: m.id,
        name: full || u.email,
        email: u.email,
        role: ROLE[m.level] || "Member",
        last_login: m.last_login,
        is_2fa_enabled: !!m.is_2fa_enabled,
        organization: orgId,
    };
});
