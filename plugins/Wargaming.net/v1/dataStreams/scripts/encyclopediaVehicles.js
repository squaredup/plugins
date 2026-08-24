// encyclopedia/vehicles returns `data` as an object keyed by tank_id — turn it into one row per vehicle
result = Object.values(data.data || {}).filter(Boolean);
