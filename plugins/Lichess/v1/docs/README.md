Track [Lichess](https://lichess.org) players and teams in SquaredUp — ratings, rating history, recent games, and team membership — via the [Lichess API](https://lichess.org/api).

## Setup

You will need a Lichess **personal API access token**.

1. Sign in to [lichess.org](https://lichess.org).
2. Go to [**Preferences → API access tokens**](https://lichess.org/account/oauth/token) and click **New personal access token**.
3. Give it a description; no scopes need to be selected, since this plugin only reads public data.
4. Click **Create** and copy the token — Lichess only shows it once.
5. Paste it into the **API token** field, along with the usernames you want to track.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ----------------- | -------- |
| **API token** | Authenticates every request via the `Authorization: Bearer` header. | Lichess → [**Preferences → API access tokens**](https://lichess.org/account/oauth/token). | Yes |
| **Usernames** | Lichess usernames to track as **Lichess Player** objects, added one at a time as chips. Any team a tracked player belongs to is imported as a **Lichess Team** object automatically — the plugin only discovers teams this way, so a team with no tracked members can't be tracked directly. | The username as it appears in the player's profile URL, e.g. `lichess.org/@/DrNykterstein` → `DrNykterstein`. | Yes |

On save, the plugin validates the token by fetching your Lichess account profile; an invalid or expired token fails setup with an authentication error.

## What this plugin monitors

- **Player profiles and ratings** — title, account age, last-seen time, game counts, and current Bullet/Blitz/Rapid/Classical ratings.
- **Rating history** — how each rating has moved over time, per variant.
- **Recent activity and games** — daily win/loss/draw activity (including puzzles) and a log of recent games with opponents, result, and opening.
- **Team membership** — teams a tracked player belongs to, and each team's current member list.

The out-of-the-box dashboards include an estate-wide **Overview** plus a perspective for each **Player** and **Team**.

## Data streams

- **Current User** — the authenticated account's own profile, used only to validate the API token on setup.
- **Players** — the configured usernames to track, one row per username.
- **Player Profile** — current profile and ratings for a player, one row per player.
- **Teams** — teams a player belongs to, one row per team; used only to discover which teams to track.
- **Player Rating History** — rating over time per chess variant for a player.
- **Recent Player Activity** — daily game and puzzle win/loss/draw counts for a player.
- **Player Recent Games** — recent games for a player, with opponent, result, and opening.
- **Team Members** — current member list for a team.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Lichess Player** | Configured usernames, enriched via `GET /api/user/{username}` | A tracked chess player. |
| **Lichess Team** | `GET /api/team/of/{username}` for each tracked player | A team a tracked player belongs to. |

## Known limitations

- **Teams are discovered through tracked players, not by ID** — Lichess has no API to fetch an arbitrary team by ID in bulk, so only teams that a tracked player actually belongs to are imported; there's no way to track a team with no tracked members.
- **Large teams' member lists can time out** — the platform allows a data stream up to 25 seconds to complete, and `GET /api/team/{id}/users` for a very large team's full member list can exceed that on the **Members** tile.
- **Rating history has no server-side time filtering** — the underlying endpoint always returns a player's complete history; the dashboard timeframe picker narrows it down after the fact, so very short windows (e.g. last hour) will typically show no data even for active players.
- **Recent games are capped at 200 per request** to stay within response size limits — very active players' full game history isn't available in one tile.
- **Activity history is a fixed rolling window** — the Recent Player Activity stream reflects roughly the last 20 days with recorded activity and has no timeframe picker.
- **Read-only** — the plugin never creates, modifies, or deletes anything in Lichess.
