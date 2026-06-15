# Before you start

This plugin connects to the community data source at https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json — an unofficial data source. It is not an official FIFA API. Data coverage and availability depends on the third party keeping the service running.

No account, API key, or credentials are required.

## What this plugin monitors

Indexes all 48 FIFA World Cup 2026 teams into SquaredUp, making them available for search, scoping, and dashboard variables. Data streams cover:

- Live and completed match results
- Group stage standings
- Knockout bracket fixtures
- Per-team statistics (next match, last match, group points)

## What gets indexed

| Object type | Description |
|---|---|
| World Cup Team | All 48 participating national teams, including FIFA code, group, and flag |

## Configuration

No configuration fields are required. Add the plugin and it connects immediately.

## Known limitations

- Data is sourced from an unofficial community API (`worldcup26.ir`) and may be delayed, incomplete, or unavailable during high-traffic periods
- Knockout stage fixtures show placeholder labels (e.g. "Winner Group A") until the group stage is complete and teams are determined
- Match times are in local event time — no timezone conversion is applied
