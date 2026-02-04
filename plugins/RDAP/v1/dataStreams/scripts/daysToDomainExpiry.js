const expiryAsString = data.events.find(e => e.eventAction === 'expiration')?.eventDate;

if(expiryAsString) {
    const nowDate = new Date();
    const expiryDate = new Date(Date.parse(expiryAsString));
    expiryDate.setUTCHours(0,0,0,0);
    const msPerDay = 1000 * 60 * 60 * 24;
    result = Math.floor((expiryDate - nowDate) / msPerDay);
}
