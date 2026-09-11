// The seats endpoint returns no customer identifier, and mainId alone is not unique:
// a re-created mailbox appears twice (Active + Archived) under the same address,
// separated only by the Microsoft/Google remoteId. Hence the composite seatKey.
//
// GOTCHA: the seatType filter (dataStreams/seats.json getArgs) must send a single
// comma-joined value, e.g. "seatType=User,Site". Sending it as a repeated query key
// ("seatType=User&seatType=Site" - the usual array-param convention, and what the
// multi-select seatType ui field would produce if left to .join() per entry instead of
// once) does NOT union the filter - the API silently keeps only the last value and drops
// the rest. Verified against the live API; do not "fix" the comma-join back to repeated
// keys.
// This endpoint cannot be paged. The response is a bare array with no pagination
// envelope and no total-count header, and perPage, page, limit, pageSize, per_page,
// offset, skip/take, start/count, maxResults, size and _limit/_start were all tested
// against a 439-seat customer: every one returned the full 439 rows with the same first
// record. So each import step fetches a whole customer in one request, and the largest
// customers can exceed the 28s import sandbox limit (the step is marked optional in
// indexDefinitions so a timeout warns rather than failing the whole import).
//
// Sharding the import by seatType was tried and deliberately rejected. It works - the
// platform supports it via a step's dataStream.config (see the MicrosoftDefender plugin,
// which shards Device across four steps) and it cut the worst-case response from 439 rows
// to 164 - but a sharded import only ever fetches the seat types listed in the steps. Any
// type Datto adds later would silently never be indexed, with every step still reporting
// success. A visible, self-correcting timeout beats seats that quietly go missing, so the
// single unfiltered step stays. Do not reintroduce per-seatType steps without solving the
// unknown-type case first.
const saasCustomerId = context.objects?.[0]?.rawId;

result = (data || []).map((seat) => ({
    ...seat,
    saasCustomerId,
    seatKey: `${saasCustomerId}-${seat.seatType}-${seat.remoteId}`,
    billable: seat.billable === '1'
}));
