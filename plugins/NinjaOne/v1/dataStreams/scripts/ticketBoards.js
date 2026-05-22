// If the user has marked the NinjaOne Ticketing module as disabled in plugin
// config, the ticketBoards request is routed to /v2/organizations as a safe
// fallback (NinjaOne returns a fatal error for ticketing endpoints when the
// module isn't licensed). Discard the fallback response so no Ticket Board
// objects are indexed.
const configuredPath = '{{ticketingApiPath}}';
const TICKETING_PATH = '/v2/ticketing/trigger/boards';

if (configuredPath !== TICKETING_PATH) {
    result = [];
} else {
    result = Array.isArray(data) ? data : [];
}
