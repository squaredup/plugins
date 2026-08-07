# NASA

Monitor NASA's open data feeds: near-Earth asteroid close approaches, space weather notifications, tracked satellites, and the Astronomy Picture of the Day.

## What gets indexed

| Object type | Source | Description |
|---|---|---|
| `Near-Earth Object` | NeoWs | An asteroid with a close approach to Earth in the current rolling 7-day window |
| `Space Weather Notification` | DONKI | A space weather alert (solar flare, coronal mass ejection, geomagnetic storm, and other event types) from the last 30 days |
| `Satellite` | Satellite Situation Center (SSC) | A satellite/spacecraft currently tracked by NASA, with a data stream for its recent position (GSE X/Y/Z coordinates) over time |

The plugin also surfaces the Astronomy Picture of the Day (APOD) as a dashboard tile — it isn't indexed as an object since it's a single daily record with nothing to drill into.

**Not included: EONET natural events.** NASA's EONET service (`eonet.gsfc.nasa.gov`) has a server-side bug — it serves valid JSON but mislabels the response as `Content-Type: application/rss+xml` on the large majority of requests, which crashes SquaredUp's response parser. This was confirmed against multiple EONET API versions/paths and isn't something a plugin config can work around, so natural-event tracking (wildfires, storms, volcanoes) has been left out of this plugin until NASA fixes it upstream.

## Prerequisites

1. Go to [api.nasa.gov](https://api.nasa.gov/) and fill in the "Generate API Key" form with your name and email.
2. NASA emails you an API key immediately — no approval wait.
3. Use that key when configuring this plugin.
4. In SquaredUp, under Settings -> Organisation, add "https://apod.nasa.gov/" to the list of allowed domains for embedding (this ensures the NASA Image of the Day can display correctly).
You can use the public `DEMO_KEY` to try the plugin out, but it's rate-limited to 30 requests/hour and 50/day shared across *all* users of that key — a real key raises this to 1,000 requests/hour tied to you personally. Get a real key before relying on this plugin for anything ongoing.

## Configuration fields

| Field | Description | Required |
|---|---|---|
| API Key | Your `api.nasa.gov` API key (or `DEMO_KEY` for testing) | Yes |

## Known limitations

- **Rate limits** — the free API key is capped at 1,000 requests/hour. Large tenants with frequent imports/refreshes across many objects may need to watch usage.
- **Near-Earth Objects** only include asteroids with a close approach in the *current* 7-day window (a NASA API restriction on the feed endpoint) — the full ~34,000-asteroid catalog isn't imported.
- **Space Weather Notifications** use DONKI's unified notification feed rather than separate structured objects per event type, so detailed numeric fields (e.g. CME speed, solar flare class, Kp-index) aren't broken out as separate properties.
- **EONET natural events are not included.** NASA's EONET service intermittently mislabels its JSON responses with an XML content type, which breaks this plugin's HTTP handling. This will be revisited if NASA fixes the issue upstream.
- **Satellites** only include the ~84 currently active spacecraft SSC tracks (`EndTime` in the future) — its full historical catalog of 300+ satellites/observatories isn't imported.
- **No default dashboard yet for the Satellite perspective.** The `Satellite` object type and its `satelliteLocation` data stream are fully functional, but out-of-the-box dashboard content for it hasn't been built yet — add tiles manually for now (e.g. the built-in Properties stream, or a line graph off `satelliteLocation`).
