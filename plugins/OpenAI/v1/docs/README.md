Monitor your OpenAI API organization in SquaredUp: daily spend, token usage by model, project and API key, prompt-cache efficiency, and how close each project is to its spend limit. Data comes from the OpenAI Admin API, so it covers usage of the OpenAI API platform. It does not include ChatGPT seats, or Codex used through a ChatGPT sign-in.

## Setup

1. Sign in to the [OpenAI platform](https://platform.openai.com) as an organization owner.
2. Go to **Settings → Organization → Admin keys** and select **Create new admin key**.
3. Give the key **read-only** permissions. The plugin never writes to OpenAI.
4. Copy the key (it starts with `sk-admin-`). You can't view it again later.
5. In SquaredUp, add the **OpenAI** data source and paste the key into **Admin API key**.

A standard project API key (`sk-proj-...`) doesn't work; the usage, cost and organization endpoints only accept admin keys.

## Configuration fields

| Field | Description |
| --- | --- |
| Admin API key | An organization Admin API key, starting with `sk-admin-`. Read-only permissions are enough. |

## What this plugin monitors

- **Spend**: daily cost in USD by project, model and line item (for example input, output or cached input tokens).
- **Token usage**: requests, input, output and cached tokens per day for chat and text models, by model, project, API key and service tier, plus the prompt-cache hit rate.
- **Other usage**: embeddings, moderations, images, text-to-speech, transcription, vector store storage, code interpreter sessions, file search and web search calls.
- **Spend limits**: each project's monthly hard limit and whether OpenAI is currently enforcing it.
- **Inventory**: projects, API keys (with owner and when each was last used) and organization users.

## Data streams

| Data stream | What it returns |
| --- | --- |
| Cost | Daily spend per project and line item, with the model and cost type split out. Optionally filtered to projects. |
| Usage | Daily token and request counts for chat and text models, per model, project, API key, user or service account, batch and service tier. Optionally filtered to projects, API keys or users. |
| Other Usage | Daily usage for one non-chat usage type you pick, normalised to requests, quantity and unit. Optionally filtered to projects. |
| Spend Limits | The monthly spend limit, interval and enforcement status for each selected project. |
| API Keys | API keys in the selected projects, with key hint, owner, created and last used dates. |
| Projects | All projects, including archived ones. |
| Users | Organization users and their roles. |

## What gets indexed

| Object type | Source | Properties |
| --- | --- | --- |
| Project | Every project in the organization, including archived | Status, created, archived, data residency |
| API Key | Every API key in each project | Project, key hint, created, last used, owner type, owner |
| User | Every organization user | Email, role, date added |

## Known limitations

- **API usage only.** ChatGPT (Free, Plus, Pro, Business or Enterprise) and Codex used through a ChatGPT sign-in are billed separately and aren't available from the Admin API. Codex used with an API key appears as normal usage.
- **12 months of history.** OpenAI only returns usage and cost for the past year.
- **Daily granularity.** Cost is only available per day, so the shortest timeframe is the last 7 days. Cost for today can take up to a day to appear.
- **Cost rate limit.** OpenAI allows 30 cost requests a minute per organization. Long timeframes are fetched in several requests, so a dashboard with many cost tiles over a long timeframe can briefly hit the limit; refreshing a minute later resolves it.
- **Users and service accounts.** Calls made with a service-account key report the service account in the user column, not an organization user, so per-user views only cover keys owned by people.
- **Spend limits.** Projects without a spend limit show an error on the Spend Limits stream; other projects still return. Spend limits and alerts need a paid API plan.
- **Spend alerts, rate limits and audit logs** aren't included in this version.
