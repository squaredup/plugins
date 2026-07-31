// account/info returns `data` as an object keyed by account_id; invalid ids come back null
result = Object.values(data.data || {}).filter(Boolean);
