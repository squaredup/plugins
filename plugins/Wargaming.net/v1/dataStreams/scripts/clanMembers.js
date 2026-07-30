// wgn/clans/info returns `data` as an object keyed by clan_id; the single requested
// clan's `members` is an array of { account_id, account_name, role, joined_at }
const clan = Object.values(data.data || {})[0];
result = ((clan && clan.members) || []).map((m) => ({
    accountId: String(m.account_id),
    memberName: m.account_name,
    role: m.role,
    // joined_at is Unix epoch seconds; convert to ISO so the "date" shape parses it
    joined: m.joined_at ? new Date(m.joined_at * 1000).toISOString() : null
}));
