// api/users/@me/ returns the authenticated user object at the root of the
// response body. Wrap it in an array so it becomes a single row.
result = data ? [data] : [];
