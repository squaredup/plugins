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

// filter_objid now carries the paging cursor (see paging.out below), so the root group's
// exclusion — previously a static filter_objid=@neq(0) getArg — happens here instead.
// Cursor is derived from the raw, unfiltered page: filtering out objid 0 before computing
// it would leave the next request's @above() one row short whenever 0 is not the last row.
const rawRows = (data && data.groups) || [];
result = rawRows.filter(function (row) { return Number(row.objid_raw) !== 0; }).map(withStatus);
pagingContext = rawRows.length ? '@above(' + Number(rawRows[rawRows.length - 1].objid_raw) + ')' : undefined;
