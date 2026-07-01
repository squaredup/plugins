const rows = [];
(data.available || []).forEach((b) => rows.push({ type: "available", currency: b.currency, amount: b.amount }));
(data.pending || []).forEach((b) => rows.push({ type: "pending", currency: b.currency, amount: b.amount }));
result = rows;
