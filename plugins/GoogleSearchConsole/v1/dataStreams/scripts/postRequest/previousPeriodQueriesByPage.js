const rows = data.rows ?? [];

result = rows.map(row => ({
  Query: row.keys?.[0],
  Clicks: row.clicks,
  Impressions: row.impressions,
  CTR: Number((row.ctr * 100).toFixed(2)),
  Position: Number(row.position.toFixed(1))
}));