// Locations are one of the few TeamDynamix records that arrive with counts already rolled up
// (TicketsCount, AssetsCount, ConfigurationItemsCount, UsersCount), which makes this the
// cheapest way to get a per-site overview without querying each app in turn.
//
// The Rooms array is dropped: a large campus can carry hundreds of rooms per location, which
// is most of the payload and none of the value at this level.
result = (Array.isArray(data) ? data : []).map((location) => ({
    locationId: String(location.ID),
    name: location.Name,
    ticketsCount: location.TicketsCount ?? 0,
    assetsCount: location.AssetsCount ?? 0,
    configurationItemsCount: location.ConfigurationItemsCount ?? 0,
    usersCount: location.UsersCount ?? 0,
    roomsCount: location.RoomsCount ?? 0,
    city: location.City || "",
    state: location.State || "",
    country: location.Country || "",
    address: location.Address || "",
    latitude: typeof location.Latitude === "number" ? location.Latitude : null,
    longitude: typeof location.Longitude === "number" ? location.Longitude : null
}));
