result = {
    registration: data.events.find(e => e.eventAction === 'registration')?.eventDate,
    last_changed: data.events.find(e => e.eventAction === 'last changed')?.eventDate,
    expiration: data.events.find(e => e.eventAction === 'expiration')?.eventDate,
}
