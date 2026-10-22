Monitor your [LaunchDarkly](https://launchdarkly.com) feature flags in SquaredUp — flag state in each environment, flag lifecycle status, and evaluation volume over time — via the [LaunchDarkly REST API](https://apidocs.launchdarkly.com).

## Setup

You will need a LaunchDarkly **access token**. The plugin only reads data, so the built-in **Reader** role is enough.

1. Sign in to [LaunchDarkly](https://app.launchdarkly.com).
2. Go to **Organization settings → Authorization** ([direct link](https://app.launchdarkly.com/settings/authorization)) and, under **Access tokens**, click **Create token**.
3. Give the token a name (for example `SquaredUp`), choose the **Reader** role, and click **Save token**.
4. Copy the token straight away — LaunchDarkly only shows it once — and paste it into the **Access token** field.
5. Choose the **Instance** you sign in to. Most accounts use **Commercial**; choose **EU** if you sign in at `app.eu.launchdarkly.com`, or **Federal** if you sign in at `app.launchdarkly.us`.

See [Creating API access tokens](https://launchdarkly.com/docs/home/account/api-create) in the LaunchDarkly documentation for more detail.

## Configuration fields

| Field            | What it is                                                         | Where to find it                                                     | Required |
| ---------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- | -------- |
| **Instance**     | The LaunchDarkly instance your account is hosted on.               | The address you sign in at.                                          | Yes      |
| **Access token** | A personal or service access token used to authenticate requests. | LaunchDarkly → **Organization settings → Authorization** (see above). | Yes      |

On save, the plugin checks the token by looking up the identity it belongs to. If the token is invalid or was created on a different instance, setup fails with an authentication error.

## What this plugin monitors

- **Flag state per environment** — whether each flag is on or off, which variation it serves, and how many targeting rules, individual targets and prerequisites it has.
- **Flag lifecycle** — LaunchDarkly's flag status in each environment: **New**, **Active**, **Inactive** (not evaluated for 7 days, a cleanup candidate) or **Launched** (serving one variation for 7 days, ready to remove from code), with when the flag was last requested.
- **Flag evaluations** — how often a flag was evaluated over time, broken down by variation.
- **Flag inventory** — every project, environment and flag, with kind, temporary/permanent, tags, maintainer and creation date.
- **Changes** — who changed which flag and when, from the LaunchDarkly audit log, plus approval requests and scheduled changes.
- **Account usage** — monthly active users, contexts and SDK service connections over time.

The out-of-the-box dashboards include an account-wide **Overview** and **Usage** dashboard, plus perspectives for each **Project**, **Environment** and **Flag**.

## Data streams

- **Environments** — the environments in a project, with key, critical setting and tags. Scoped to one or more projects.
- **Flag List** — every flag in a project with kind, temporary/deprecated, tags, maintainer and creation date. Scoped to one or more projects.
- **Flags** — every flag in an environment with its on/off state, serving variation, targeting counts and flag details. Scoped to one or more environments.
- **Flag Statuses** — the lifecycle status (new, active, inactive, launched) and last requested time of every flag in an environment. Scoped to one or more environments.
- **Flag Environments** — the state of one flag in each environment of its project. Scoped to a flag.
- **Flag Evaluations** — evaluation counts over time for a flag, by variation, in the environment named by the **Environment key** parameter (default `production`). Scoped to a flag.
- **Audit Log** — changes made in LaunchDarkly, with who made them, optionally filtered to a project, flag or environment. Account-wide.
- **Approval Requests** — approval requests for flag changes and their review status, optionally only pending ones. Account-wide.
- **Scheduled Changes** — upcoming scheduled changes to a flag in the environment named by the **Environment key** parameter (default `production`). Scoped to a flag.
- **Account Usage** — monthly active users, contexts or service connections per day, optionally grouped by project, environment or SDK and filtered to a project. Account-wide.

## What gets indexed

| Object type     | API source                                        | Represents                                             |
| --------------- | ------------------------------------------------- | ------------------------------------------------------ |
| **Project**     | `GET /api/v2/projects`                            | A LaunchDarkly project.                                |
| **Environment** | `GET /api/v2/projects/{projectKey}/environments`  | An environment, such as Production, within a project.  |
| **Flag**        | `GET /api/v2/flags/{projectKey}`                  | A feature flag (archived flags are not imported).      |

**Relationships:** each Environment and Flag records the key of its parent Project. SDK keys and mobile keys are never imported.

## Known limitations

- **Flag evaluations use a beta API** — LaunchDarkly may change it without notice. Granularity is chosen by LaunchDarkly from the timeframe: per minute under 2 hours, hourly under 2 days, daily beyond that. Per-minute data is retained for 70 days.
- **Evaluations are per flag and per environment** — there is no account-wide evaluation total, and the **Environment key** parameter must match an environment key in the flag's project (not its display name). The out-of-the-box **Flag** dashboard charts the `production` and `test` environments that LaunchDarkly creates in every new project; copy a tile and change its **Environment key** to chart any other environment.
- **Audit log volume** — LaunchDarkly returns at most 20 audit log entries per request, so busy accounts need many requests for long timeframes. Filtering by project or environment only matches flag changes.
- **Approval requests and scheduled changes** — LaunchDarkly only returns member IDs for requesters, reviewers and creators, not names. Approvals need to be enabled for an environment (generally an Enterprise feature), and the approvals API allows only a few requests per 10 seconds, so avoid adding it to many tiles.
- **Account usage uses a beta API** — values are LaunchDarkly's month-to-date totals per day, which reset at the start of each month. The timeframe starts at 7 days, as the data is daily. Availability can depend on your LaunchDarkly plan.
- **Large accounts** — LaunchDarkly returns at most 100 flags per request, so very large accounts (roughly 20,000 or more flags across all projects) may exceed SquaredUp's import limits.
- **Rate limits** — LaunchDarkly rate-limits API calls per account and per route. Dashboards that query many environments or flags at once share that allowance with your other API integrations.
- **Archived flags** are not imported or shown.
- **Read-only** — the plugin never creates, modifies or deletes anything in LaunchDarkly.
