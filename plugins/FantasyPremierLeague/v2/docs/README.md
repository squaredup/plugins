Fantasy Premier League (FPL) is the official free-to-play game from the Premier League. This plugin connects to the public FPL API to bring a manager's profile, league standings and season stats into SquaredUp — no authentication is required.

## Before you start

You'll need your FPL Manager ID. Find it in the URL of your team page on the [Fantasy Premier League website](https://fantasy.premierleague.com/) — for example `https://fantasy.premierleague.com/entry/**1234567**/event/1` has a Manager ID of `1234567`.

## Setup

1. Sign in to the [Fantasy Premier League website](https://fantasy.premierleague.com/) and open **Points** or **My Team** to see your Manager ID in the URL.
2. In SquaredUp, add the Fantasy Premier League data source and enter your **FPL manager ID**.
3. Save the configuration — SquaredUp validates the ID by fetching your manager profile.

## What gets imported

The plugin imports the following objects so they can be used for drilldown and dashboard scoping:

- **Gameweeks** — deadline, average score and chip usage for each gameweek in the season
- **Classic Leagues** — the classic leagues your manager is a member of
- **H2H Leagues** — the head-to-head leagues your manager is a member of
