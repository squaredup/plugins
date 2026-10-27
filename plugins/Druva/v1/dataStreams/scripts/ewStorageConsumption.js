// Druva returns `nextPageToken` as an empty string on the last page; normalise
// it to undefined so the platform's paging loop guard isn't tripped.
result = data.data || [];

pagingContext = data.nextPageToken || undefined;
