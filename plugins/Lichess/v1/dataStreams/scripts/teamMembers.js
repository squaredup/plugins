// dataStreams/scripts/teamMembers.js
// Response is NDJSON (one member object per line), not JSON, so `data` is
// undefined - parse `response.body` ourselves.
result = response.body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
