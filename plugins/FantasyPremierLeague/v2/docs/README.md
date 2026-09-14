Fantasy Premier League (FPL) is the official free-to-play game from the Premier League. This plugin connects to the public [FPL API](https://fantasy.premierleague.com/api/bootstrap-static/) to bring a manager's profile, league standings and season stats into SquaredUp — no authentication is required.

## Setup

You'll need your FPL Manager ID.

1. Sign in to the [Fantasy Premier League website](https://fantasy.premierleague.com/) and open **Points** or **My Team** to see your team page.
2. Copy the Manager ID from the URL — for example `https://fantasy.premierleague.com/entry/**1234567**/event/1` has a Manager ID of `1234567`.
3. In SquaredUp, add the Fantasy Premier League data source and paste the ID into the **FPL manager ID** field.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **FPL manager ID** | Identifies which manager's team, leagues and history the plugin queries. | The URL of your team page on the [Fantasy Premier League website](https://fantasy.premierleague.com/). | Yes |

On save, the plugin validates the ID by fetching the manager's profile; an ID that doesn't match an existing manager fails setup with an error.

## What this plugin monitors

- **Manager profile and history** — team name, country, and points/rank for every previous season played.
- **This season's performance** — weekly points, overall rank, transfer activity and squad value.
- **Leagues** — standings for the manager's classic and head-to-head leagues.
- **Gameweeks** — deadlines, average scores and chip usage across the season.

The out-of-the-box dashboard is a single **Summary** covering the manager's profile, history and current season.

## Data streams

- **Manager Information** — the configured manager's profile and current season summary, one row.
- **Manager History** — points and rank for each of the manager's previous seasons.
- **Manager Summary** — weekly points, rank and transfers for the configured manager this season.
- **Gameweek Data** — deadline, average score and chip usage for each gameweek in the season (account-wide).
- **League Summary** — standings for a selected classic league.
- **H2H League Summary** — standings for a selected head-to-head league.
- **Classic Leagues** — the classic leagues the configured manager is a member of (used for import and league selection).
- **H2H Leagues** — the head-to-head leagues the configured manager is a member of (used for import and league selection).

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Gameweek** | `GET /bootstrap-static` | One gameweek in the current season. |
| **Classic League** | `GET /entry/{managerId}` | A classic league the configured manager is a member of. |
| **H2H League** | `GET /entry/{managerId}` | A head-to-head league the configured manager is a member of. |

## Known limitations

- **Manager ID changes each season** — the FPL API assigns entries per season, so an ID used for testing or dashboards may need updating when a new season starts.
- **League standings depend on the season being live** — before the season's first gameweek deadline, league and current-season data streams return no rows.
- **Read-only** — the plugin never creates, modifies, or deletes anything in Fantasy Premier League.
- **Summary dashboard image tile** — the OOB Summary dashboard embeds an image hosted at `resources.premierleague.com`. It only displays if that domain is in your organization's list of allowed embed URLs; otherwise the tile shows blank.
