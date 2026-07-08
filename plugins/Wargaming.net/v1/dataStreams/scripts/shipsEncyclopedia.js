// wows/encyclopedia/ships returns `data` as an object keyed by ship_id — flatten to rows
result = Object.values(data.data || {}).filter(Boolean);
