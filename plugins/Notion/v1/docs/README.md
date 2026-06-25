# Notion

Bring your Notion workspace into SquaredUp. This plugin indexes your workspace **users**, **data sources** (the tables/databases shared with the integration) and **pages**, and lets you explore page properties, page content, comments and database schemas — with dashboards that summarise your workspace, surface recently-edited content, and let you drill into any data source or page.

## What this plugin monitors

- **Users** — the people and bots that are members of your Notion workspace.
- **Data sources** — the individual tables of data that live under your Notion databases, for every database shared with the integration.
- **Pages** — the pages shared with the integration, including pages that are rows inside a data source. Each page records its title, URL, parent, and created / last-edited times.

Out-of-the-box dashboards give you a workspace **Overview** plus a **perspective** for each user, data source and page.

## Before you start — create a Notion integration

This plugin connects using **OAuth 2.0**, so you need a Notion **public integration** to obtain a Client ID and Client Secret.

1. Go to [Notion → My integrations](https://www.notion.so/my-integrations) and click **New connection**.
2. Give it a name (e.g. *SquaredUp*) and associate it with the workspace you want to monitor.
3. Select OAuth as the Authentication method
4. If required, select a specific workspace.
5. Under **Redirect URIs**, add the SquaredUp redirect URI for your region — copy the one that matches your tenant:
   - **US:** `https://app.squaredup.com/settings/pluginsoauth2`
   - **EU:** `https://eu.app.squaredup.com/settings/pluginsoauth2`
6. Click Create connection
7. Under **Capabilities**, uncheck 'Update content' and 'Insert content' - only read permissions are required. If you want to use the **Page Comments** data stream, also enable the **Read comments** capability.
8. Click Save connection
6. Under 'OAuth connection', copy the **Client ID** and **Client secret** — you'll paste these into SquaredUp.

When you add the plugin in SquaredUp, paste the Client ID and Client Secret, then click **Sign in with Notion** and approve access to the pages/databases you selected.

### Share content with the integration
Notion only returns content that has been explicitly shared with the integration. In each page or database you want monitored, open the **•••** menu → **Connections** → **Connect to** → select your integration. Sharing a parent page shares its children too.

## Configuration fields

| Field | Description | Required |
| --- | --- | --- |
| **Client ID** | The *OAuth client ID* from your Notion integration's Configuration tab. | Yes |
| **Client Secret** | The *OAuth client secret* from your Notion integration's Configuration tab. Stored securely. | Yes |
| **Sign in with Notion** | Launches the Notion OAuth consent screen. After approving, the connection is authenticated. | Yes |

## What gets indexed

| Object type | Description |
| --- | --- |
| **Notion User** | A member of the workspace — a person (with email where available) or a bot. |
| **Notion Data Source** | A table of data under a Notion database that has been shared with the integration. |
| **Notion Page** | A page shared with the integration, including database rows. Linked in the graph to its parent data source. |

## Known limitations

- **Only shared content is visible.** The Notion API only returns pages, databases and data sources that have been explicitly shared with the integration. Anything not shared will not appear in SquaredUp. Listing workspace **users** additionally requires an OAuth/integration token (personal access tokens cannot list users).
- **No historical data.** The Notion API does not expose a queryable time range, so all data is current-state. Tiles can still highlight stale or recently-edited content using each object's last-edited timestamp, but there are no trend/time-series charts.
- **Rate limits.** Notion limits requests to roughly **3 requests per second** per integration. Large workspaces import more slowly; bursts may be throttled (HTTP 429).
- **Page volume.** Every row in a database is itself a page, so workspaces with large databases can import a very large number of `Notion Page` objects.
- **Comments require an extra capability.** The Page Comments data stream needs the integration's **Read comments** capability (see setup step 5). Without it, the stream returns no data.
- **Page content is top-level only.** The Page Content data stream returns a page's top-level blocks; nested/child blocks (content inside toggles, columns, etc.) are not expanded.
