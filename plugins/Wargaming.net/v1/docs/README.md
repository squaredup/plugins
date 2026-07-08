# Wargaming.net

Monitor **World of Tanks**, **World of Warships**, and **World of Warplanes** players, clans, and encyclopedias in SquaredUp using the [Wargaming.net Public API](https://developers.wargaming.net/). A single Wargaming account is shared across all three games, so one tracked **Player** shows tank, ship, and aircraft statistics side by side.

## What this plugin monitors

- **Players** you choose to track (by account ID) — per-game statistics for World of Tanks, World of Warships, and World of Warplanes: battles, win rate, average damage, survival rate, global rating, last battle time, and more.
- **Clans** you choose to track (by clan ID) — member count, tag, motto, leader, creation date, and the full member roster.
- **Vehicles / Ships / Aircraft** — the complete encyclopedias for all three games (tanks, warships, and warplanes), each with tier/level, nation, and type. Imported automatically.

Out-of-the-box dashboards give you an Overview (encyclopedia breakdowns plus your tracked players and clans) and a drill-down perspective for each player (with a section per game), clan, vehicle, ship, and aircraft.

> The Wargaming public API returns **cumulative, all-time** statistics only — there are no historical/time-range endpoints, so figures are current snapshots rather than trends over a chosen timeframe.

## Prerequisites — getting an application ID

The plugin authenticates with a Wargaming **application ID** (a free API key). To create one:

1. Go to <https://developers.wargaming.net/> and sign in with your Wargaming account (the account for your region).
2. Open **Applications** (<https://developers.wargaming.net/applications/>).
3. Click **Add application**, give it a name, and choose application type **Server** (works for a service-to-service integration like SquaredUp).
4. Copy the **Application ID** shown for your new application.

The application ID is tied to a **region (realm)** — EU, North America, or Asia — and is valid across all three games on that realm. Use the realm your Wargaming account belongs to.

## Finding player and clan IDs

The plugin tracks the specific players and clans you list by their numeric IDs (the API cannot enumerate all players).

- **Account ID** — open a player's profile on the World of Tanks portal; the URL contains the ID, e.g. `worldoftanks.eu/en/community/accounts/`**`500123456`**`-PlayerName/`. The same account ID works for all three games. You can also use the built-in **Player Search** data stream (search by nickname) inside SquaredUp to look up an account ID.
- **Clan ID** — open a clan's page on the portal; the URL contains the clan ID, e.g. `worldoftanks.eu/en/clans/`**`500001234`**`-TAG/`.

Add each ID as a chip in the configuration fields below (type the ID and press Enter). Leave a field blank to skip importing that object type.

## Configuration fields

| Field | Required | What it is / where to find it |
| --- | --- | --- |
| **Application ID** | Yes | Your Wargaming application ID from <https://developers.wargaming.net/applications/>. |
| **Realm** | Yes | The region your Wargaming account is on: EU, North America (`com`), or Asia. Applies to all three games. |
| **Account IDs** | No | Player account IDs to track (add each as a chip). Leave blank to skip player import. |
| **Clan IDs** | No | Clan IDs to track (add each as a chip). Leave blank to skip clan import. |

## What gets indexed

- **Player** — each tracked player account (one cross-game Wargaming account, with World of Tanks / Warships / Warplanes statistics).
- **Clan** — each tracked clan.
- **WoT Vehicle** — every tank in the World of Tanks encyclopedia.
- **WoWs Ship** — every ship in the World of Warships encyclopedia.
- **WoWp Aircraft** — every aircraft in the World of Warplanes encyclopedia.

## Known limitations

- **Region-bound** — an application ID and its data are specific to one realm (EU/NA/Asia). To monitor accounts across regions you would add the plugin once per realm.
- **No history** — the public API exposes cumulative totals only; there are no time-series or timeframe-filtered endpoints, so dashboards show current values.
- **Players and clans must be listed explicitly** — the API has no "list all players/clans" capability, so you track the specific IDs you enter in configuration.
- **A player may not play every game** — per-game statistics are blank for games a tracked player has never played.
- **World of Warplanes is semi-deprecated** — Wargaming flags the Warplanes API as deprecated; it still works but has less data and may change.
- **Rate limits** — the Wargaming API enforces per-application rate limits (typically 10 requests/second, 20 with a mobile app type). Encyclopedia imports (especially World of Warships, fetched page by page) are the heaviest calls; large lists of tracked players/clans may approach these limits.
