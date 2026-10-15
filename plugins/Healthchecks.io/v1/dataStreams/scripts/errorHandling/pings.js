// Healthchecks.io returns API errors as {"error": "..."}, but a URL that matches
// no route returns an HTML 404 page instead.
const apiMsg = data && typeof data === "object" && data.error;
const readOnlyMsg =
    "The ping log needs a Healthchecks.io read-write API key (read-only keys cannot read pings)";

// Only read-write keys expose a check's UUID, and the ping log route only
// accepts UUIDs, so read-only requests 404 rather than returning 401.
const object = context && context.objects && context.objects[0];
const uuid = object && (Array.isArray(object.uuid) ? object.uuid[0] : object.uuid);

if (!uuid || response.status === 401 || response.status === 403) {
    result = readOnlyMsg + (apiMsg ? ": " + apiMsg : "");
} else if (response.status === 404) {
    result = "Check not found in Healthchecks.io (it may have been deleted)";
} else {
    result = apiMsg || "Request failed with HTTP " + response.status;
}
