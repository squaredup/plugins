Put your [Sleeper](https://sleeper.com) fantasy football league on a SquaredUp dashboard — standings, weekly scores, points missed by lineup choices, and how lucky each team has been — using the public [Sleeper API](https://docs.sleeper.com).

## Setup

You only need your league's ID. There's no API key or sign-in.

1. Open your league on [sleeper.com](https://sleeper.com), or in the Sleeper app.
2. Copy the number at the end of the league URL, for example `1387890402954067968` from `sleeper.com/leagues/1387890402954067968`. In the app, it's under **League settings**, then **General**.
3. Paste it into the **League ID** field.

When you save, the plugin looks up the league. If it fails, the League ID is wrong or the league doesn't exist.

## What this plugin monitors

- **Standings**: each team's record, points for and against, and rank.
- **Weekly scores**: every team's score, opponent and result for each completed week, plus its rank among all teams that week.
- **Points missed**: how many more points a team would have scored with its best possible lineup, and its lineup efficiency.
- **Luck**: how a team's actual win rate compares with its all-play win rate, which is how often it would have won if it had played every other team each week.
- **Weekly awards**: the top and bottom scorer of each week.

The out-of-the-box dashboards include a **League overview**, a **Team** perspective and a **Trends** dashboard for week-by-week scoring, rank, margin and luck.

## Data streams

- **League**: name, season, status and settings of the configured league.
- **Standings**: season-to-date record, points, missed points, lineup efficiency and luck, one row per team. Optionally filter to selected teams.
- **Weekly Scores**: one row per team per completed week, with points, opponent, result, bench points, weekly rank and award. Optionally filter to selected teams.

## What gets indexed

| Object type      | API source                  | Represents                                     |
| ---------------- | --------------------------- | ---------------------------------------------- |
| **Sleeper Team** | `league/{id}/rosters`, `users` | One team in the league, named by its team name. |

## Known limitations

- **One league per data source.** To track another league, add the plugin again.
- **Current season only.** Previous seasons have their own league ID in Sleeper.
- **Team-level only.** Player names and player stats aren't included.
- **Luck uses regular-season weeks only.** Playoff weeks are left out of the all-play record.
- **Bench points and missed points differ.** **Bench points** on the **Weekly Scores** stream is the total scored by every player outside the starting lineup. **Points missed** on the **Standings** stream is the gap to Sleeper's best-possible lineup, so it is much smaller.
- **Ties share a weekly rank.** Teams on the same score get the same rank and award.
- **Read-only.** The plugin never changes anything in Sleeper.
