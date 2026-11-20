// TeamCity returns the next page as `nextHref`, a path relative to the server root. Resolve it
// against this request's URL so `nextUrl` paging can follow it; no `nextHref` ends paging.
pagingContext = data && data.nextHref ? new URL(data.nextHref, response.url).href : undefined;

// A list response holds its items in a single array property (`project`, `buildType`, `agent`, `build`).
result = (data && Object.values(data).find(Array.isArray)) || [];
