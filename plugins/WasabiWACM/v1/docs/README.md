Monitor your [Wasabi](https://wasabi.com) reseller and multi-tenant account hierarchy in SquaredUp — Control Accounts, Channel Accounts, Sub-Accounts, storage usage, bucket utilization, and billing — via the [WACM Connect API](https://docs.wasabi.com/apidocs/wacm-connect-api).

> ⚠️ This plugin covers the **WACM (Wasabi Account Control Manager)** account-management API only, used by Wasabi partners/resellers to manage downstream accounts. It does not cover Wasabi's S3-compatible storage API (buckets/objects data plane) — only account-level storage and billing metrics reported by WACM.

## Setup

You will need a WACM **API key**, paired with the corresponding account name or username as its "username".

1. Sign in to your [Wasabi Account Control Manager console](https://console.wacm.wasabisys.com).
2. To use an **Account API Key** (recommended for Control/Channel/Sub-Account-wide access): go to the **Account** tab and generate an API key as the Account Admin. Note the **account name** shown alongside it.
3. Alternatively, to use a **User API Key** (scoped to what that user can see): open your own profile and generate a **User API key**. Note your **WACM username**.
4. Copy the key — it is shown only once — and paste it, along with the matching account name or username, into the fields below.

> ⚠️ Regenerating an API key permanently invalidates the old one — update this plugin's configuration if you rotate keys.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ----------------- | -------- |
| **Username** | The WACM account name (for an Account API Key) or WACM username (for a User API Key). | WACM console → **Account** tab, or your user profile. | Yes |
| **API Key** | Authenticates every request via HTTP Basic Auth. | WACM console → **Account** tab (Account API Key) or your user profile (User API key). | Yes |

On save, the plugin validates the credentials by calling a lightweight reference endpoint; invalid credentials fail setup with an authentication error.

## What this plugin monitors

- **Account hierarchy** — Standalone Accounts, Control Accounts, Channel Accounts, Sub-Accounts, and Members, with each object's key properties (status, storage quota).
- **Storage usage** — daily active/deleted storage, object counts, and traffic (egress/ingress/API calls) history per Sub-Account and Control Account.
- **Bucket utilization** — daily per-bucket storage breakdowns per Sub-Account and Control Account.
- **Billing** — monthly invoice line items and costs per Sub-Account.

The out-of-the-box dashboards include an estate-wide **Overview** plus a perspective for each of **Control Account**, **Channel Account**, **Sub-Account**, and **Standalone Account**.

## Data streams

- **Sub-Account Summary** — current status and storage quota, one row per sub-account.
- **Sub-Account Usage History** — daily storage and traffic usage history for a sub-account.
- **Sub-Account Bucket Utilization** — daily per-bucket storage utilization for a sub-account.
- **Sub-Account Invoices** — monthly billed cost line items for a sub-account.
- **Control Account Summary** — current status and storage totals, one row per control account.
- **Control Account Usage History** — daily storage and traffic usage history for a control account.
- **Control Account Bucket Utilization** — daily per-bucket storage utilization for a control account.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Wasabi Standalone Account** | `GET /api/v1/accounts` | An independent Wasabi console account outside the reseller hierarchy. |
| **Wasabi Control Account** | `GET /api/v1/control-accounts` | The top-level billing-owning account in a reseller hierarchy. |
| **Wasabi Channel Account** | `GET /api/v1/channel-accounts` | An optional reseller/partner access layer under a Control Account. |
| **Wasabi Sub-Account** | `GET /api/v1/sub-accounts` | An actual Wasabi Console account — the entity that owns buckets and is billed. |
| **Wasabi Member** | `GET /api/v1/members` | A user with access to a Sub-Account. |

## Known limitations

- **Read-only** — this plugin never creates, modifies, or deletes anything in Wasabi WACM.
- **Permission tiers vary by API key.** The WACM API scopes each endpoint to the calling account's tier. A **Sub-Account**-tier key (the most common case) can see its own Sub-Accounts, Channel Accounts, and Members, but **Standalone Accounts and Control Accounts will show no indexed objects** — and their dashboards will stay empty — until a Control-Account-tier or Account-Admin key is used.
- **Usage and bucket utilization data is daily-granularity** — timeframes shorter than 7 days aren't offered.
- **Invoices are monthly billing-period records** — timeframes shorter than 30 days aren't offered, and a newly created sub-account may show no invoices until its first billing cycle completes.
- **Members aren't filtered to a specific Sub-Account** in dashboards — indexed Members can be browsed as their own object type, but no per-sub-account member table is shown on the Sub-Account perspective.
- **Channel Account and Standalone Account perspectives show only indexed properties** — the WACM API doesn't expose dedicated usage or billing endpoints for these tiers.
