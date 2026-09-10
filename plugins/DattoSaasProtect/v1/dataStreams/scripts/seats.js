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
const saasCustomerId = context.objects?.[0]?.rawId;

result = (data || []).map((seat) => ({
    ...seat,
    saasCustomerId,
    seatKey: `${saasCustomerId}-${seat.seatType}-${seat.remoteId}`,
    billable: seat.billable === '1'
}));
