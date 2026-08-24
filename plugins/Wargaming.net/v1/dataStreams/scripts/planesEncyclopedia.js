// wowp/encyclopedia/planes returns `data` as an object keyed by plane_id — flatten to rows
result = Object.values(data.data || {}).filter(Boolean);
