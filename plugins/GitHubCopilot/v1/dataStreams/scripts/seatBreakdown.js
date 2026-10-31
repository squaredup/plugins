// The billing summary only exists for organizations; enterprise accounts call a cheap endpoint instead and get no rows
const isOrg = context.dataSources[0].accountType !== 'enterprise';
const seats = data?.seat_breakdown;

result =
    isOrg && seats
        ? [
              {
                  totalSeats: seats.total ?? null,
                  activeThisCycle: seats.active_this_cycle ?? null,
                  inactiveThisCycle: seats.inactive_this_cycle ?? null,
                  addedThisCycle: seats.added_this_cycle ?? null,
                  pendingInvitation: seats.pending_invitation ?? null,
                  pendingCancellation: seats.pending_cancellation ?? null,
                  planType: data.plan_type ?? null,
                  seatManagement: data.seat_management_setting ?? null,
                  ideChat: data.ide_chat ?? null,
                  platformChat: data.platform_chat ?? null,
                  cli: data.cli ?? null,
                  publicCodeSuggestions: data.public_code_suggestions ?? null
              }
          ]
        : [];
