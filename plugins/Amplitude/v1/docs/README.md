# Amplitude

Monitor your [Amplitude](https://amplitude.com) product analytics project in SquaredUp. This plugin imports your project's event types and behavioral cohorts into the SquaredUp graph, and provides data streams for active user trends, event volume trends, cohort-filtered event activity, and individual user activity lookups.

## What this plugin monitors

- **Event Types** and **Cohorts** are imported as objects you can scope dashboards to, search for, and drill into.
- An **Overview** dashboard shows account-wide **active/new user trends**, **real-time active users**, a table of tracked **event types**, and a table of **cohorts**, plus a **user lookup** tile.
- An **Event Type** perspective shows the **event count trend** for that specific event.
- A **Cohort** perspective shows the cohort's **current size and status**, plus an **event trend filtered to that cohort's members**.
- A two-step **user lookup** workflow: search for a user by User ID, Device ID, or email prefix in the **User Search** tile, copy the **Amplitude ID** it returns, then paste it into the **User Activity** tile to see that user's recent event activity. These are two separate tiles because SquaredUp's dashboard framework has no way to automatically pass a search result into another tile's parameter — this is a manual copy/paste step by design, not a bug.

## Prerequisites — getting your API key and secret key

Amplitude API credentials are scoped to a single project, so each SquaredUp plugin instance monitors one Amplitude project.

1. Sign in to Amplitude and open the project you want to monitor.
2. Go to **Settings → Projects**, select the project, then open its **General** settings tab.
3. Copy the **API Key** and **Secret Key** shown there.
4. Note whether your organization uses Amplitude's **US** or **EU** data center — this is usually visible in the URL you sign in at (`analytics.amplitude.com` for US, `analytics.eu.amplitude.com` for EU) or in your organization's data residency settings.

No additional scopes need to be granted — the API key/secret key pair has access to all the read-only analytics endpoints this plugin uses.

## Configuration fields

| Field          | What it is                                                  | Where to find it                                  | Required |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------- | -------- |
| **Region**     | The data residency region your Amplitude project uses (US or EU). | The domain you sign in at, or your org's data residency settings. | Yes      |
| **API Key**    | Your Amplitude project's API key, used as the Basic Auth username. | Settings → Projects → [project] → General.         | Yes      |
| **Secret Key** | Your Amplitude project's secret key, used as the Basic Auth password. | Settings → Projects → [project] → General.         | Yes      |

## What gets indexed

| Object type             | Represents                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| **Amplitude Event Type** | An event defined in the project's taxonomy schema.                       |
| **Amplitude Cohort**     | A behavioral cohort (user segment) defined in the project.               |

## Known limitations

- **One project per plugin instance.** Amplitude API keys are project-scoped, so monitoring multiple projects means adding this plugin multiple times, once per project.
- **Rate limits.** Amplitude enforces a concurrency limit of 5 requests across the Dashboard REST/Cohort APIs and a cost-based hourly limit. Very frequent refreshes of many tiles at once may be throttled (HTTP 429).
- **Funnel and retention analysis are not included.** These require multi-step chart configuration that doesn't map cleanly to a generic tile — this version covers active users, event trends, cohorts, and user lookups only.
- **User lookup is a manual two-step process.** There is no "browse all users" endpoint in Amplitude, and Amplitude's user-activity endpoint only accepts a numeric Amplitude ID (not an email or User ID directly) — so you search first in the User Search tile, then copy the Amplitude ID it returns into the User Activity tile yourself. SquaredUp's dashboard framework has no mechanism to bind a search result automatically into another tile's parameter.
- **Hidden taxonomy items are excluded.** Events or properties marked as hidden/visibility-restricted in Amplitude's taxonomy don't appear in the imported Event Types.
