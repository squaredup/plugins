// Parse NDJSON response from Sanity history/transactions endpoint.
// The endpoint returns one JSON object per line (not a JSON array).
// data will be null/undefined; raw text is in response.body.

const body = response.body;

// Defensive: if the handler somehow parsed it already, handle that case
if (Array.isArray(body)) {
    result = body.map(function(tx) {
        return {
            timestamp: tx.timestamp,
            transactionId: tx.id,
            author: tx.author,
            documentCount: Array.isArray(tx.documentIDs) ? tx.documentIDs.length : 0
        };
    });
} else if (typeof body === 'string') {
    result = body
        .split('\n')
        .map(function(line) { return line.trim(); })
        .filter(function(line) { return line.length > 0; })
        .map(function(line) { return JSON.parse(line); })
        .map(function(tx) {
            return {
                timestamp: tx.timestamp,
                transactionId: tx.id,
                author: tx.author,
                documentCount: Array.isArray(tx.documentIDs) ? tx.documentIDs.length : 0
            };
        });
} else {
    result = [];
}
