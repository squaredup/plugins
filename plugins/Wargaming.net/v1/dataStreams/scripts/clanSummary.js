// wgn/clans/info returns `data` as an object keyed by clan_id; invalid ids come back null
result = Object.values(data.data || {})
    .filter(Boolean)
    .map((clan) => ({
        name: clan.name,
        tag: clan.tag,
        membersCount: clan.members_count,
        leaderName: clan.leader_name,
        motto: clan.motto,
        // created_at is Unix epoch seconds; convert to ISO so the "date" shape parses it
        created: clan.created_at ? new Date(clan.created_at * 1000).toISOString() : null,
        description: clan.description
    }));
