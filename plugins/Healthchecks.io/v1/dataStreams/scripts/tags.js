// The badges endpoint is keyed by tag name; `*` is a pseudo-tag covering the
// whole project, not a real tag.
result = Object.keys((data && data.badges) || {})
    .filter((tag) => tag !== "*")
    .sort()
    .map((tag) => ({ name: tag }));
