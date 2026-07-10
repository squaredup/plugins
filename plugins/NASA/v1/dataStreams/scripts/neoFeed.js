const byDate = data.near_earth_objects || {};
const seen = new Set();
const rows = [];

for (const dateKey of Object.keys(byDate)) {
    for (const neo of byDate[dateKey] || []) {
        if (seen.has(neo.id)) continue;
        seen.add(neo.id);

        const approach = (neo.close_approach_data || [])[0] || {};
        const diameter = (neo.estimated_diameter || {}).kilometers || {};

        rows.push({
            id: neo.id,
            name: neo.name,
            absolute_magnitude_h: neo.absolute_magnitude_h,
            is_potentially_hazardous_asteroid: neo.is_potentially_hazardous_asteroid,
            is_sentry_object: neo.is_sentry_object,
            nasa_jpl_url: neo.nasa_jpl_url,
            estimated_diameter_min_km: diameter.estimated_diameter_min,
            estimated_diameter_max_km: diameter.estimated_diameter_max,
            close_approach_date: approach.close_approach_date,
            miss_distance_km: approach.miss_distance ? Number(approach.miss_distance.kilometers) : null,
            relative_velocity_kph: approach.relative_velocity
                ? Number(approach.relative_velocity.kilometers_per_hour)
                : null,
            orbiting_body: approach.orbiting_body,
        });
    }
}

result = rows;
