const rows = data.rows ?? [];

result = rows.map((row) => ({
    Date: row.keys?.[0],
    Clicks: row.clicks,
    Impressions: row.impressions,
    CTR: row.ctr,
    Position: row.position,
}));
