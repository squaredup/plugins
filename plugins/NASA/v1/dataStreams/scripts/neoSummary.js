const diameter = ((data || {}).estimated_diameter || {}).kilometers || {};

result = [
    {
        id: data.id,
        name: data.name,
        absolute_magnitude_h: data.absolute_magnitude_h,
        is_potentially_hazardous_asteroid: data.is_potentially_hazardous_asteroid,
        is_sentry_object: data.is_sentry_object,
        nasa_jpl_url: data.nasa_jpl_url,
        estimated_diameter_min_km: diameter.estimated_diameter_min,
        estimated_diameter_max_km: diameter.estimated_diameter_max,
        close_approach_count: (data.close_approach_data || []).length,
    },
];
