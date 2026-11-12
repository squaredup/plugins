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

- **Build configuration health**: the status of the latest finished build of every build configuration on its default branch, and whether the configuration is paused.
- **Build history**: every finished build in a timeframe, with status, branch, duration, queue time, who or what triggered it and the agent it ran on. Use it for success rates, build volume and duration trends.
- **Work in progress**: builds running now, with progress and elapsed time, and builds waiting in the queue with the reason they are waiting.
- **Tests**: the tests run by the latest finished build of a build configuration, including new failures, muted and ignored tests.
- **Build agents**: whether each agent is connected, enabled, authorized and up to date, what it is building, its pool and its operating system.

The out-of-the-box dashboards include an **Overview** of the whole server, plus a perspective for each **Project**, **Build Configuration** and **Agent**.

## Data streams

- **Build Configuration Status**: one row per build configuration, with the status of its latest finished build. Server-wide, or filtered to selected projects or build configurations.
- **Builds**: one row per finished build in the timeframe, excluding cancelled builds. Server-wide, or filtered to selected projects, build configurations or agents.
- **Running Builds**: builds running now, with percentage complete and elapsed time. Server-wide, or filtered to selected projects, build configurations or agents.
- **Build Queue**: queued builds, how long they have waited and why. Server-wide, or filtered to selected projects or build configurations.
- **Agents**: the current status of authorized build agents, optionally including unauthorized agents. Server-wide, or filtered to selected agents.
- **Test Results**: the tests from the latest finished build of a build configuration, optionally failed tests only. Per build configuration.
- **Server**: the TeamCity version, build number and start time.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Project** | `/app/rest/projects` | A TeamCity project or subproject. Named with its full project path, e.g. `Backend / Services / API`. |
| **Build Configuration** | `/app/rest/buildTypes` | A build configuration. Named with its full project path, e.g. `Backend / Services / Build`. |
| **Agent** | `/app/rest/agents` | An authorized build agent, connected or not. |

Objects are imported every 12 hours. Build results, the queue and agent status are always read live, so they are not affected by the import schedule.

## Known limitations

- **Ephemeral cloud agents are not imported.** TeamCity removes JetBrains-hosted and cloud-profile agents from its agent list once they stop, so only persistent agents, such as self-hosted agents, appear as **Agent** objects. Builds still show the name of the agent they ran on.
- **Deleted objects fail until the next import.** If a tile is filtered to a build configuration or agent that has since been deleted from TeamCity, TeamCity rejects the request and the tile shows an error until the next import removes the object.
- **Renaming an ID creates a new object.** Projects and build configurations are identified by their TeamCity ID. Changing the ID in TeamCity creates a new object on the next import, and dashboards using the old one need updating.
- **Large timeframes on busy servers.** The **Builds** stream returns one row per build. On a server that runs many thousands of builds a day, a long timeframe can exceed SquaredUp's response size limit; filter to a project or shorten the timeframe.
- **Default branch only for health.** **Build Configuration Status** and **Test Results** use the latest finished build on the default branch, excluding personal and cancelled builds. **Builds** includes all branches.
- **Pipelines** appear as a set of auto-generated build configurations plus a composite "Pipeline Head" build configuration. The out-of-the-box success rate and duration tiles on the **Overview** and **Project** dashboards leave out composite builds so a pipeline failure is not counted twice.
