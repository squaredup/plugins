const row = data.rows?.[0] ?? {};

result = [
    {
        Impressions: row.impressions ?? 0,
        Clicks: row.clicks ?? 0,
        CTR: row.ctr ?? 0,
        Position: row.position ?? 0,
    },
];
