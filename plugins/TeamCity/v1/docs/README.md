Monitor build health, success rates, durations, the build queue and build agents across your [TeamCity](https://www.jetbrains.com/teamcity/) projects in SquaredUp, using the [TeamCity REST API](https://www.jetbrains.com/help/teamcity/rest/teamcity-rest-api-documentation.html). Works with TeamCity Cloud and self-hosted TeamCity servers.

> ⚠️ SquaredUp's cloud can only reach a TeamCity server with a public address. If your server is on a private network, add this data source through a [relay agent](https://docs.squaredup.com/features/connect-and-explore/relay-agents) installed somewhere that can reach it.

## Setup

You need the address of your TeamCity server and an **access token** for a user who can view the projects you want to monitor.

1. Sign in to TeamCity with the user the data source should connect as. The data source only reads, so a user with the **Project viewer** role on the projects you want to monitor is enough.
2. Click your avatar in the top-right corner, choose **Profile**, then open **Access Tokens**.
3. Click **Create access token**, give it a name such as `SquaredUp`, choose an expiration date, and leave the permission scope as **Same as current user**. See [Manage access tokens](https://www.jetbrains.com/help/teamcity/managing-your-user-account.html#Managing+Access+Tokens).
4. Copy the token. TeamCity only shows it once.
5. In SquaredUp, paste the token into the **Access token** field and enter the address you use to open TeamCity in a browser in the **Server URL** field.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Server URL** | The address of your TeamCity server, for example `https://example.teamcity.com` for TeamCity Cloud or `https://ci.example.com/teamcity` for a self-hosted server. Include any context path, but not `/app/rest`. | The address bar of your browser when TeamCity is open. | Yes |
| **Access token** | Authenticates every request as the user that created it. | TeamCity → **Profile** → **Access Tokens**. | Yes |

When you save, SquaredUp checks it can reach the server and read its version with the access token. If this fails, check the server URL is reachable from SquaredUp (or from your relay agent) and that the token is valid and has not expired.

## What this plugin monitors

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

<!-- finalized in Phase 9 -->
