// dataStreams/scripts/userSchedules.js
// Cross-references the schedules list against the scoped user's id: for each
// schedule, filters current_shifts to the ones where the shift's on-call
// user matches, and emits one row per matching (schedule, shift) pair. This
// can't be expressed with pathToData/valueExpression alone because it joins
// a nested per-schedule array against the scope object's id.
const userId = context.objects[0].rawId;

result = (data.schedules || []).flatMap((schedule) =>
    (schedule.current_shifts || [])
        .filter((shift) => shift.user && shift.user.id === userId)
        .map((shift) => ({
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            schedulePermalink: schedule.permalink,
            start_at: shift.start_at,
            end_at: shift.end_at,
            rotation_id: shift.rotation_id || null,
            layer_id: shift.layer_id || null,
        })),
);
