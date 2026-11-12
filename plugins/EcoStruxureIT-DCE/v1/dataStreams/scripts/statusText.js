// Shared by the devices, deviceGroups and deviceGroupDevices streams. Adds statusText, Data
// Center Expert's own status wording for badges and legends. The severityText column maps to a
// SquaredUp health state, so anything derived from it in metadata sees "success" or "unknown"
// rather than "Warning" or "Information"; it has to be read here, before that mapping.
// DCE reports a healthy device or group as "None" (or "Ok"), shown here as "OK".
const statusTextOf = (severityText) =>
    /^(none|ok|normal)$/i.test(String(severityText || "")) ? "OK" : severityText || "Unknown";

result = (Array.isArray(data) ? data : []).map((row) => ({ ...row, statusText: statusTextOf(row.severityText) }));
