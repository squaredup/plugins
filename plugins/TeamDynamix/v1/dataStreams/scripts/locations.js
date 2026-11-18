// Locations are one of the few TeamDynamix records that arrive with counts already rolled up
// (TicketsCount, AssetsCount, ConfigurationItemsCount, UsersCount), which makes this the
// cheapest way to get a per-site overview without querying each app in turn.
//
// Only locations/search with ReturnItemCounts fills the counts in. GET api/locations returns
// -1 for every one, meaning "not loaded", so a summed total came out as minus the number of
// locations. Any -1 that still arrives is nulled rather than counted as a real number.
//
// The Rooms array is dropped (and not requested): a large campus can carry hundreds of rooms
// per location, which is most of the payload and none of the value at this level.
const count = (value) => (typeof value === "number" && value >= 0 ? value : null);

result = (Array.isArray(data) ? data : []).map((location) => ({
    locationId: String(location.ID),
    name: location.Name,
    ticketsCount: count(location.TicketsCount),
    assetsCount: count(location.AssetsCount),
    configurationItemsCount: count(location.ConfigurationItemsCount),
    usersCount: count(location.UsersCount),
    roomsCount: count(location.RoomsCount),
    city: location.City || "",
    state: location.State || "",
    country: location.Country || "",
    address: location.Address || "",
    latitude: typeof location.Latitude === "number" ? location.Latitude : null,
    longitude: typeof location.Longitude === "number" ? location.Longitude : null
}));
