Track [CodeRabbit](https://www.coderabbit.ai) seat usage, adoption, pull request review times, review quality and security findings in SquaredUp, via the [CodeRabbit API](https://docs.coderabbit.ai/api-reference).

> ⚠️ The CodeRabbit API is only available on the **Enterprise** plan.

## Setup

You will need a CodeRabbit **API key**, created by an organization admin.

1. Sign in to [CodeRabbit](https://app.coderabbit.ai) as an organization **admin**. Keys created by other roles cannot read seat and license data.
2. Go to **Organization Settings > [API Keys](https://app.coderabbit.ai/settings/api-keys)** and create a new key.
3. To see AI Deep Scan results on the **Security** dashboard, give the key the **security** read permission.
4. Copy the key and paste it into the **API key** field.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **API key** | Authenticates every request to the CodeRabbit API. | CodeRabbit > **Organization Settings > API Keys**. | Yes |

On save, the data source lists your CodeRabbit organizations to check the key, then checks that seat data can be read. An invalid key, or an organization that is not on the Enterprise plan, fails setup. A key created without admin rights still connects, but seat and license data is not available.

## What this data source contains

- **Seats and licenses**: seats purchased, seats assigned, seats available and which users hold a seat.
- **Adoption**: active users and repositories, pull requests per user and per repository, and seats held by users with no merged pull requests.
- **Review speed**: time from ready for review to first human review, to last commit and to merge, plus CodeRabbit's estimated review time and complexity.
- **Review quality**: every finding CodeRabbit raised, its severity and category, and whether the author accepted it.
- **Security**: AI Deep Scan findings by severity, CWE, repository and file.
- **MCP usage**: which MCP servers CodeRabbit called during reviews, with tool call and insight counts.
- **Admin activity**: the organization audit log.

The out-of-the-box dashboards are **Overview**, **Licenses**, **PRs & Reviews**, **Security** and a **User** perspective.

## Data streams

**Organization streams: no object selection needed**

- **Licenses**: seats purchased, seats assigned, seats available, seat utilization and the seat assignment mode.
- **Users**: every CodeRabbit user with their role and whether they hold a seat.
- **Organizations**: the CodeRabbit organizations the API key can access, with their Git provider.
- **Audit logs**: administrative actions in the organization, with the actor, resource and IP address. Supports filtering by user name, with partial or full name matching.

**Review streams: optionally filtered to one or more repositories or users**

- **Pull requests**: merged or closed pull requests reviewed by CodeRabbit, one row per pull request, with review timings and comment counts.
- **Review comments**: findings CodeRabbit raised on merged pull requests, one row per finding, with severity, category and whether it was accepted.
- **MCP usage**: one row per MCP server used on a pull request, with insight and tool call counts.
- **Security findings**: AI Deep Scan findings, filtered by state (open, fixed, dismissed or all).

**Repository streams: for one organization**

- **Repositories**: repositories CodeRabbit records for an organization, and whether CodeRabbit is installed on each.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Organization** | `GET /v1/organizations` | A CodeRabbit organization, linked to an organization in your Git provider. |
| **Repository** | `GET /v1/organizations/{id}/repositories` | A repository in an organization, with its installation status and parent organization. |
| **User** | `GET /v1/users` | A CodeRabbit user, with their role and seat assignment. |

## Notes

- **Review data is reported by day**: CodeRabbit filters pull requests and findings by date, not time. For **Last 24 hours**, merged pull requests are trimmed to the exact window; closed pull requests are reported for the whole day.
- **Review data covers up to the last quarter**: the review streams offer timeframes from **Last 24 hours** (**Last 7 days** for MCP usage) up to **Last quarter**.
- **Security findings need the security permission**: without it, the Security findings stream reports a permissions error.
- **MCP usage must be enabled**: if MCP usage metrics are not enabled for your CodeRabbit organization, the MCP usage stream says so rather than returning rows.
- **Read-only**: the data source never creates, modifies or deletes anything in CodeRabbit.
