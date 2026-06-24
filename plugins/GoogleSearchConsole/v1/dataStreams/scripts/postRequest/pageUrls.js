result = (data.rows || []).map(row => ({
  label: row.keys?.[0] || "",
  value: row.keys?.[0] || ""
}));