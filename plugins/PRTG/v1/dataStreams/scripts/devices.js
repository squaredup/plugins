// PRTG's `status` text varies by version and language (a paused object reads
// "Paused (paused by user)" on some builds), so the state map in the stream's
// metadata could miss it. Rebuild it from `status_raw`, which is stable, and keep
// PRTG's own text only for a code this table does not know.
const STATUS_TEXT = {
    0: 'None', 1: 'Unknown', 2: 'Scanning', 3: 'Up', 4: 'Warning', 5: 'Down', 6: 'No Probe',
    7: 'Paused by User', 8: 'Paused by Dependency', 9: 'Paused by Schedule', 10: 'Unusual',
    11: 'Not Licensed', 12: 'Paused until', 13: 'Down (Acknowledged)', 14: 'Down (Partial)'
};
const withStatus = (row) => {
    const text = STATUS_TEXT[Number(row.status_raw)];
    return text && row.status_raw !== '' ? Object.assign({}, row, { status: text }) : row;
};

// table.json's `start` parameter clamps to the last page instead of returning an empty
// one once it runs past the end, so row-offset paging never terminates. Cursor on objid
// instead: PRTG's @above() filter genuinely returns nothing once none remain above it.
const rows = (data && data.devices) || [];
result = rows.map(withStatus);
pagingContext = rows.length ? '@above(' + Number(rows[rows.length - 1].objid_raw) + ')' : undefined;
