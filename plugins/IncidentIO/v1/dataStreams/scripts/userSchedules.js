// dataStreams/scripts/userSchedules.js
// Cross-references the schedules list against the scoped user's id: for each
// schedule, filters current_shifts to the ones where the shift's on-call
// user matches, and emits one row per matching (schedule, shift) pair. This
// can't be expressed with pathToData/valueExpression alone because it joins
// a nested per-schedule array against the scope object's id.
const userId = context.objects[0].rawId;

// This script only ever sees ONE page of `schedules` per invocation (`data` is that
// page's raw response body) — but the platform re-invokes it once per page as the
// `paging` config advances the `after` cursor, and concatenates every invocation's
// `result` into the stream's final output. Filtering per page and letting the
// platform concatenate is equivalent to concatenating all pages before filtering,
// since this is a stateless per-row filter with no cross-page aggregation — so every
// schedule, on every page, is checked. Confirmed empirically against this endpoint by
// forcing page_size=1 (2 pages for 2 real schedules) and seeing both schedules'
// shifts in the final result, each tagged with its own page's cursor.
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
