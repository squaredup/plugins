// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor, re-requests with `pageToken=`, and trips the paging loop guard.
// Normalise the empty string to undefined here to end paging.
result = data.customers || [];

pagingContext = data.nextPageToken || undefined;
