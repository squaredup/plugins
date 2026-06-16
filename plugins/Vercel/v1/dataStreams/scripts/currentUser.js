// /v2/user returns a single { user: {...} } object — wrap it as one row.
result = data && data.user ? [data.user] : [];
