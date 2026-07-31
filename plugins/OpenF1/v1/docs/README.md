# OpenF1

Formula 1 timing data from the free, open [OpenF1 API](https://openf1.org/). This plugin imports F1 race weekends (meetings), their sessions, and the current driver grid, and provides dashboards for session results, lap times, pit stops, tyre stints, weather, race control messages, overtakes, and championship standings.

> OpenF1 is an unofficial, community-run project and is not associated with Formula 1, the FIA, or any related company.

## What this plugin monitors

- **Meetings** — each Grand Prix or testing weekend (e.g. "Singapore Grand Prix 2023"), with circuit, country, and dates.
- **Sessions** — each session within a meeting (Practice 1/2/3, Qualifying, Sprint, Race).
- **Drivers** — the current driver grid, with team, nationality, and headshot.

Per session, the dashboards show the final classification, lap-by-lap times, pit stops, tyre stints, weather, race control flags/incidents, overtakes, and the driver lineup. A summary dashboard shows the current drivers' and constructors' championship standings, and each driver has a detail dashboard with their photo and team.

## Prerequisites

**None.** OpenF1's historical data (2023 onwards) is completely free and requires **no account, API key, or credentials**. Just add the plugin and it works.

> Only OpenF1's *real-time* (live) data requires a paid subscription. This plugin uses the free historical endpoints, so no subscription is needed.

## Configuration

This plugin has **no configuration fields** — there is nothing to fill in. On setup, the plugin runs a quick connectivity check against the OpenF1 API to confirm it is reachable, then you are done.

| Field | Description | Required |
| ----- | ----------- | -------- |
| _(none)_ | No credentials or settings are required. | — |

## What gets indexed

| Object type | Represents |
| ----------- | ---------- |
| **F1 Meeting** | A Grand Prix or testing weekend. Around 100 objects (2023–present). |
| **F1 Session** | A single session (Practice, Qualifying, Sprint, or Race) within a meeting. Around 490 objects. |
| **F1 Driver** | A driver on the current grid, keyed by car number. Around 20 objects. |

Each session stores its parent meeting's key, so you can navigate from a session to its meeting. On the Session dashboard, the Session Result and Session Drivers tables link each driver through to their F1 Driver object.

## Known limitations

- **Rate limit:** OpenF1 allows a maximum of **3 requests per second**. Dashboards that open many tiles at once may occasionally see a tile retry.
- **Historical data only:** This plugin covers free historical data from **2023 onwards**. Live/real-time timing (intervals, positions during a race) is a paid OpenF1 feature and is not included.
- **High-frequency telemetry omitted:** Car telemetry (`/car_data`) and GPS location (`/location`), sampled at ~3.7 Hz, are intentionally not included — the data volume would exceed dashboard query limits.
- **Team radio omitted:** Radio clip data is sparse and its coverage decreased significantly from 2026 onwards.
- **Driver names reflect the current grid:** The API identifies drivers only by car number within each session, and the only shared key between the timing data and driver details is that number. This plugin indexes the **current grid** (the drivers in the latest session) as F1 Driver objects keyed by car number, and uses it to label the number with a driver name across the results, laps, pit stops, stints, race control, and championship tiles. Because the mapping reflects the latest session, a historical row shows the number's *current* driver — or no name if that number isn't on the current grid. For the exact driver behind each number in a given session, use that session's **Session Drivers** tile, which reads number → name, team, and colour directly from the session.
- **Driver team is the current team:** F1 Driver objects (and the Drivers' Championship tile) show each driver's *current* team. The team a driver raced for at the time of a historical session is available in that session's **Session Drivers** tile.
- **Starting grid unavailable:** The OpenF1 `/starting_grid` endpoint currently returns no data for any session, so it is not included. Final race positions are available from session results.
- **Unofficial data:** Data is sourced by the OpenF1 project and may contain gaps or inaccuracies, particularly for older or interrupted sessions.
