// dataStreams/scripts/schedules.js
// The raw response nests rotation membership two levels deep
// (schedule.config.rotations[].users[]), which pathToData/valueExpression can't
// reach - flatten it into a readable, deduplicated list of member names.
result = (data.schedules || []).map((schedule) => {
    const rotations = (schedule.config && schedule.config.rotations) || [];
    const members = new Map();
    rotations.forEach((rotation) =>
        (rotation.users || []).forEach((user) => members.set(user.id, user.name)),
    );

    return {
        id: schedule.id,
        name: schedule.name,
        timezone: schedule.timezone,
        rotationCount: rotations.length,
        members: [...members.values()].join(", "),
        memberCount: members.size,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
        permalink: schedule.permalink,
    };
});
