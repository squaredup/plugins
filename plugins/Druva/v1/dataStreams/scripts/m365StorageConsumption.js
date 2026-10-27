// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor and trips the paging loop guard. Normalise to undefined to end paging.
result = data.data || [];

pagingContext = data.nextPageToken || undefined;
