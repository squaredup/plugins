Monitor your [Resend](https://resend.com) team in SquaredUp — email delivery and engagement, sending domain health, broadcasts, automations, webhook delivery, suppressions and API activity — via the [Resend API](https://resend.com/docs/api-reference/introduction).

> ⚠️ This plugin is read-only — it never sends email or changes anything in Resend.

## Setup

You will need a Resend **API key** with **Full access**.

1. Sign in to the [Resend dashboard](https://resend.com/login).
2. Go to [**API Keys**](https://resend.com/api-keys) and click **Create API Key**.
3. Give the key a name and set **Permission** to **Full access**. A **Sending access** key can only send email, so it can't read domains, metrics, broadcasts or anything else this plugin shows.
4. Copy the key (it starts with `re_`) and paste it into the **API key** field.

## Configuration fields

| Field       | What it is                                                         | Where to find it                                           | Required |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------------------------- | -------- |
| **API key** | Authenticates every request via the `Authorization: Bearer` header. | Resend dashboard → [**API Keys**](https://resend.com/api-keys). | Yes      |

On save, the plugin validates the key by listing your team's API keys; an invalid, revoked or **Sending access** key fails setup with an authentication error.

## What this plugin monitors

- **Email delivery and engagement** — sent, delivered, bounced, complained, opened and clicked counts and rates over time, for the whole team or per domain or broadcast.
- **Sending domain health** — verification status of each domain and of every DNS record it needs (SPF, DKIM, MX, tracking).
- **Recent activity** — the latest sent and received emails with their delivery status, and API requests with their response status.
- **Broadcasts** — campaign status, recipients by event (delivered, opened, bounced…) and the links people clicked.
- **Automations and webhooks** — automation run outcomes and durations, and whether each webhook event was delivered to your endpoint.
- **Audience and deliverability** — contacts (optionally by segment), suppressed addresses and contact import jobs.
- **Account hygiene** — API keys and how long since each was last used.

The out-of-the-box dashboards include an account-wide **Overview** plus a perspective for each **Domain**, **Broadcast**, **Segment**, **Webhook** and **Automation**.

## Data streams

- **Email Metrics** — sending, delivery and engagement counts and rates, by hourly/daily/weekly/monthly period or as totals, optionally filtered to or broken down by domain or broadcast; account-wide.
- **Sent Emails** — emails sent by the team with their latest delivery status, optionally filtered by domain; account-wide.
- **Received Emails** — inbound emails received on receiving-enabled domains, optionally filtered by domain; account-wide.
- **API Logs** — API requests made with the team's keys, with response status and outcome; account-wide.
- **Domains** — sending domains with verification status, region and tracking settings; account-wide.
- **Domain Records** — the DNS records a domain needs, with the verification status of each; per domain.
- **Broadcasts** — broadcasts with status, target segment and send times, optionally limited to segments; account-wide.
- **Broadcast Recipients** — recipients of a broadcast who triggered the chosen event (delivered, opened, clicked, bounced…); per broadcast.
- **Broadcast Clicked Links** — links clicked in a broadcast, with total and unique clicks; per broadcast.
- **Segments** — contact segments; account-wide.
- **Contacts** — contacts with subscription status, optionally limited to one segment; account-wide.
- **Suppressions** — addresses suppressed after a bounce, complaint or manual addition, optionally filtered by origin; account-wide.
- **Contact Imports** — bulk contact import jobs with status and created/updated/skipped/failed counts; account-wide.
- **Automations** — automations with their enabled status; account-wide.
- **Automation Runs** — runs of an automation with status and duration, optionally filtered by status; per automation.
- **Webhooks** — webhook endpoints with status and subscribed event types; account-wide.
- **Webhook Events** — events sent to a webhook, with delivery status; per webhook.
- **Templates** — email templates with publish status; account-wide.
- **Topics** — subscription topics; account-wide.
- **Inboxes** — inboxes with unread thread count and when mail was last received; account-wide.
- **API Keys** — API keys with when each was created and last used; account-wide.

## What gets indexed

| Object type    | API source            | Represents                                     |
| -------------- | --------------------- | ---------------------------------------------- |
| **Domain**     | `GET /domains`        | A sending or receiving domain.                 |
| **Segment**    | `GET /segments`       | A contact segment.                             |
| **Broadcast**  | `GET /broadcasts`     | A marketing campaign.                          |
| **Webhook**    | `GET /webhooks`       | A webhook endpoint.                            |
| **Automation** | `GET /automations`    | An event-triggered email automation.           |
| **Template**   | `GET /templates`      | An email template.                             |
| **Topic**      | `GET /topics`         | A subscription topic contacts opt in to or out of. |
| **Inbox**      | `GET /inboxes`        | A Resend inbox.                                |

**Relationships:** Broadcasts show the name of the Segment they target. Email Metrics rows drill down to their Domain or Broadcast.

Contacts are deliberately **not** indexed — a marketing list can hold far more contacts than an import can carry, and they're personal data. Use the **Contacts** data stream instead.

## Known limitations

- **Metrics follow your plan's data retention** — Email Metrics only goes back as far as your Resend plan retains data. A range that starts earlier is shortened to the oldest retained day, and a range that ends before it (such as **Last month** on a short-retention plan) fails with a "data retention window" error. Metrics filtered to a broadcast are the exception — Resend keeps those beyond the retention window.
- **Recent-activity streams cover up to 7 days** — Sent Emails, Received Emails, API Logs and Webhook Events have no date filter in the API, so the plugin reads newest-first until it reaches the start of the timeframe. On very busy teams it stops after about 20 seconds of paging and returns the newest rows it has. Use **Email Metrics** for longer trends and totals.
- **Contacts filter by one segment** — the API accepts a single segment, so if several are selected only the first is used. Very large contact lists may exceed the platform's response size limit.
- **Automation Runs ignore the timeframe** — Resend doesn't document the order runs are returned in, so all runs are returned and sorted newest first.
- **Open and click metrics need tracking** — opens and clicks are only recorded for domains with open and click tracking turned on in Resend.
- **Cached responses** — Resend caches metrics and broadcast recipient and clicked-link responses for up to 15 minutes.
- **Rate limit** — Resend allows 10 requests per second per team, shared by every API key, so busy dashboards can compete with your own application's API calls.
- **Segment contact counts** — Resend's segment metrics API is in private beta and isn't used; count contacts per segment with the **Contacts** data stream instead.
- **Read-only** — the plugin never sends email or creates, changes or deletes anything in Resend.
