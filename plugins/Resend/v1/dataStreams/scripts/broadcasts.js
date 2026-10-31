// Resend can't filter broadcasts by segment, so an optional segment selection is applied here.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const segmentIds = new Set(((context.config && context.config.segment) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const rows = (data && data.data) || [];

result = segmentIds.size ? rows.filter((row) => segmentIds.has(row.segment_id)) : rows;
