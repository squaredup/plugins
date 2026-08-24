# Figma

Bring your Figma team into SquaredUp. This plugin indexes the projects, components and styles in a Figma team, and lets you dashboard file summaries, version history and comments.

## What gets indexed

| Object type | Represents |
| --- | --- |
| `Figma Project` | A project within the configured Figma team |
| `Figma Component` | A published component in the team's library |
| `Figma Style` | A published style (fill, text, effect or grid) in the team's library |

Figma files are **not** an indexed object type — Figma's API has no team-wide "list all files" endpoint, only a per-project one, which isn't compatible with how this plugin imports objects. File data (summary, thumbnail, last edited, version history, comments) is still available: as a table on each Project's dashboard, and via a manual project/file picker on the "File Explorer" dashboard and its underlying data streams.

## Prerequisites

### 1. Create a personal access token

1. Sign in to Figma and open **Settings** (click your profile photo, top-left).
2. Go to the **Security** tab.
3. Under **Personal access tokens**, click **Generate new token**.
4. Give the token a name and select the following scopes:
   - `projects:read`
   - `file_metadata:read`
   - `file_versions:read`
   - `file_comments:read`
   - `team_library_content:read`
5. Copy the generated token — Figma only shows it once.

### 2. Find your Team ID

Open the team in Figma and copy the numeric ID from the URL:

```
https://www.figma.com/files/team/1234567890123456789/My-Team
                                  ^^^^^^^^^^^^^^^^^^^
                                  This is your Team ID
```

> Figma's API has no way to list the teams you belong to — the Team ID must be entered manually. To monitor more than one team, add this plugin again with a different Team ID.

## Configuration fields

| Field | Description | Required |
| --- | --- | --- |
| Personal Access Token | The token generated above. Used to authenticate every request to the Figma API. | Yes |
| Team ID | The numeric ID of the Figma team to monitor. | Yes |

## Known limitations

- **No team discovery.** Figma's REST API does not expose an endpoint to list a user's teams, so the Team ID must be found and entered manually (see above).
- **Rate limits.** Figma enforces per-token rate limits that vary by plan and endpoint (10–150 requests/minute). This plugin only calls lightweight, scoped endpoints, but very large teams with many files may see slower or throttled imports.
- **Personal access tokens are tied to a Figma user account.** The plugin can only see teams, projects and files that the token's owner has access to. If that person loses access or leaves the team, the plugin will start failing.
- **Full design content isn't imported.** This plugin surfaces file metadata (name, thumbnail, last modified, versions, comments) and library assets (components, styles) — it does not pull the full design document tree.
- **Activity logs and Variables are not supported.** Both require an Enterprise plan and org-admin OAuth scopes that aren't available to a personal access token.
