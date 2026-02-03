result = data.stopPoints
    .filter((row) =>
        row.stopType === 'NaptanMetroStation'
    )
    .map((row) => ({
        id: row.id,
        name: row.commonName,
        icsCode: row.icsCode,
        lat: row.lat,
        lon: row.lon,
        lines: row.lines.map((l) => l.name).join(', '),
        lineIds: row.lines.map((l) => l.id).join(', ')
    }))
    .sort((a,b) =>
        a.name.localeCompare(b.name)
    );