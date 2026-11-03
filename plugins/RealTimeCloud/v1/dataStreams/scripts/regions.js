const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    const src = text.replace(/^﻿/, "");
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (quoted) {
            if (c === '"' && src[i + 1] === '"') {
                field += '"';
                i++;
            } else if (c === '"') quoted = false;
            else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ",") {
            row.push(field);
            field = "";
        } else if (c === "\n" || c === "\r") {
            if (c === "\r" && src[i + 1] === "\n") i++;
            row.push(field);
            field = "";
            if (row.length > 1 || row[0] !== "") rows.push(row);
            row = [];
        } else field += c;
    }
    if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
    }
    if (quoted) throw new Error("Invalid CSV: unterminated quoted field");
    if (!rows.length) throw new Error("Invalid CSV: empty response");
    const header = rows.shift().map((h) => h.trim());
    const missing = ["cloud-provider", "cloud-region", "year"].filter(
        (name) => !header.includes(name),
    );
    if (missing.length)
        throw new Error(`Invalid CSV: missing columns ${missing.join(", ")}`);
    return rows.map((r) =>
        Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])),
    );
};
const num = (v) =>
    v == null || v === "" || v.toUpperCase() === "NA"
        ? null
        : Number.isFinite(Number(v))
          ? Number(v)
          : null;
const str = (v) =>
    v == null || v === "" || v.toUpperCase() === "NA" ? null : v;
const geo = (v) => {
    const [lat, lon] = (v || "").split(",").map((s) => num(s.trim()));
    return { latitude: lat ?? null, longitude: lon ?? null };
};

const seen = new Set();
result = parseCsv(typeof data === "string" ? data : response.body)
    .filter((r) => r["cloud-provider"] && r["cloud-region"])
    .sort((a, b) => Number(b.year) - Number(a.year))
    .flatMap((r) => {
        const provider = r["cloud-provider"];
        const region = r["cloud-region"];
        const regionId = `${provider}/${region}`;
        if (seen.has(regionId)) return [];
        seen.add(regionId);
        return [
            {
                regionId,
                name: `${region} (${provider})`,
                provider,
                region,
                location: str(r.location),
                cfeRegion: str(r["cfe-region"]),
                emZoneId: str(r["em-zone-id"]),
                wtRegionId: str(r["wt-region-id"]),
                ...geo(r.geolocation),
            },
        ];
    });
