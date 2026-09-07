// The seats endpoint returns no customer identifier, and mainId alone is not unique:
// a re-created mailbox appears twice (Active + Archived) under the same address,
// separated only by the Microsoft/Google remoteId. Hence the composite seatKey.
const saasCustomerId = context.objects?.[0]?.rawId;

result = (data || []).map((seat) => ({
    ...seat,
    saasCustomerId,
    seatKey: `${saasCustomerId}-${seat.seatType}-${seat.remoteId}`,
    billable: seat.billable === '1'
}));
