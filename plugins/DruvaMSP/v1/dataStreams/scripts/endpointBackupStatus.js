// Druva's own status is returned unchanged; how to classify it is left to tile
// filters and monitoring in SquaredUp. The script only adds the backup's age.
const now = Date.now();

result = (data.data || []).map((r) => {
    const end = r.endTime ? new Date(r.endTime).getTime() : NaN;
    return { ...r, hoursSinceLastBackup: Number.isFinite(end) ? (now - end) / 3600000 : null };
});

// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor and trips the paging loop guard. Normalise to undefined to end paging.
pagingContext = data.nextPageToken || undefined;
