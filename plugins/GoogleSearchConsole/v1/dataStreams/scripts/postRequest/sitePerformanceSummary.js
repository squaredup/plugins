const row = data.rows?.[0] ?? {};

result = [{
    Impressions: row.impressions ?? 0,
    Clicks: row.clicks ?? 0,
    CTR: Number(((row.ctr ?? 0) * 100).toFixed(2)),
    Position: Number((row.position ?? 0).toFixed(2))
}];