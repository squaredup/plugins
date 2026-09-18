// dataStreams/scripts/teamMembers.js
// Response is NDJSON (one member object per line), not JSON, so `data` is
// undefined - parse `response.body` ourselves. Edge case: if the team has
// exactly one member, that single line IS valid JSON, and the platform
// auto-parses it into an object instead of leaving it as text - so
// response.body can be a string, an already-parsed single member object, or
// (defensively) an array of them.
const body = response.body;

result =
    typeof body === "string"
        ? body
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .map((line) => JSON.parse(line))
        : Array.isArray(body)
          ? body
          : body
            ? [body]
            : [];
