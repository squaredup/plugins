// Parse NDJSON response from Sanity history/transactions endpoint.
// The endpoint returns one JSON object per line (not a JSON array).
// data will be null/undefined; raw text is in response.body.

result = response.body
    .split("\n")
    .map(function (line) {
        return line.trim();
    })
    .filter(function (line) {
        return line.length > 0;
    })
    .map(function (line) {
        return JSON.parse(line);
    })
    .map(function (tx) {
        return {
            ...tx,
            timestamp: tx.timestamp,
            transactionId: tx.id,
            author: tx.author,
            documentCount: Array.isArray(tx.documentIDs)
                ? tx.documentIDs.length
                : 0,
        };
    });

