Monitor your OpenAI API organization using the [OpenAI Admin API](https://platform.openai.com/docs/api-reference/administration): daily spend, token usage by model, project and API key, prompt-cache efficiency, and how close each project is to its monthly spend limit.

> ⚠️ This covers usage of the OpenAI API platform only. ChatGPT plans (Free, Plus, Pro, Business and Enterprise) and Codex used through a ChatGPT sign-in are billed separately and aren't available from the Admin API.

## Prerequisites

- An OpenAI platform account that is an **Owner** of the organization you want to monitor, because only owners can create Admin keys

## Creating an Admin API key

1. Sign in to the [OpenAI platform](https://platform.openai.com/)

2. Navigate to **Settings** > **Organization** > [**Admin keys**](https://platform.openai.com/settings/organization/admin-keys)

3. Click **Create new admin key**

4. Give the key a name and set its permissions to **Read only**. The plugin never writes to OpenAI

5. Copy the key, which starts with `sk-admin-`, and save it somewhere secure as you won't be able to view it again

A standard project API key (`sk-proj-...`) doesn't work, because the usage, cost and organization endpoints only accept Admin keys.

## Configuring the plugin

Populate the following fields when configuring the plugin:

| Field | Description |
|---------|---------|
| Admin API key | The Admin key created in the OpenAI platform. It starts with `sk-admin-` |

On save, the plugin connects to your OpenAI organization with the key. A key that is a project API key rather than an Admin key, or that has been revoked, fails setup with an authentication error.

## Example configuration

| Setting | Example |
|---------|---------|
| Admin API key | `sk-admin-xxxxxxxxxxxxxxxxxxxx` |

## What this plugin monitors

- **Spend:** daily cost in USD by project, model and line item, such as input, output or cached input tokens.
- **Token usage:** requests, input, output and cached tokens per day for chat and text models, by model, project, API key, user or service account, and service tier.
- **Prompt-cache hit rate:** the share of input tokens served from the prompt cache.
- **Other usage:** embeddings, moderations, images, text-to-speech, transcription, vector store storage, code interpreter sessions, file search and web search calls.
- **Spend limits:** each project's monthly limit, how much of it is used, and whether OpenAI is enforcing it.
- **Inventory:** projects, API keys, with their owner and when each was last used, and organization users.

The out-of-the-box dashboards are:

- **Overview:** spend, budget used, requests, tokens and cache hit rate for the organization, with spend by category and project, and the API keys unused for 30 days or more.
- **Trends:** weekly spend by model and project, month-over-month change, model mix, cost per 1,000 tokens, cache hit rate, and tokens and requests.
- **Project:** a perspective on any single project, with its spend, spend limit, usage by model and API keys.
- **API Key:** a perspective on any single API key, with its owner, last used date and usage.

## Data streams

- **Cost:** daily spend per project and line item, with the model and cost type split out. Optionally filtered to projects.
- **Usage:** daily token and request counts for chat and text models, per model, project, API key, user or service account, batch and service tier. Optionally filtered to projects, API keys or users.
- **Other Usage:** daily usage for one non-chat usage type you pick, normalised to requests, quantity and unit. Optionally filtered to projects.
- **Spend Limits:** the monthly spend limit, interval and enforcement status for each selected project.
- **API Keys:** the API keys in the selected projects, with key hint, owner, created and last used dates.
- **Projects:** every project in the organization, including archived ones.
- **Users:** the organization's users and their roles.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Project** | `GET v1/organization/projects` | A project in the organization, including archived ones. |
| **API Key** | `GET v1/organization/projects/{project_id}/api_keys` | An API key in a project, with its owner and last used date. |
| **User** | `GET v1/organization/users` | A user in the organization, with their role. |

## Known limitations

- **API usage only:** ChatGPT plans and Codex used through a ChatGPT sign-in aren't available from the Admin API. Codex used with an API key appears as normal usage.
- **12 months of history:** OpenAI only returns usage and cost for the past year.
- **Daily granularity:** cost is only available per day, so the shortest timeframe is the last 7 days. Cost for today can take up to a day to appear.
- **Cost rate limit:** OpenAI allows 30 cost requests a minute for each organization. Long timeframes are fetched in several requests, so a dashboard with many cost tiles over a long timeframe can briefly hit the limit. Refresh a minute later and it clears.
- **Service accounts:** calls made with a service-account key report the service account rather than an organization user, so per-user views only cover keys owned by people.
- **Spend limits:** projects without a spend limit show an error on the Spend Limits stream, and the other projects still return. Spend limits and alerts need a paid API plan.
- **Not included:** spend alerts, rate limits and audit logs.
- **Read-only:** the plugin only reads from OpenAI. It never creates, modifies or deletes anything.

## Troubleshooting

### The Admin API key check fails

Verify that:

- The key starts with `sk-admin-`. A project API key (`sk-proj-...`) doesn't work
- The key is copied in full, with no spaces
- The key hasn't been revoked in **Settings** > **Organization** > **Admin keys**

### Tiles show a rate limit error

Verify that:

- You aren't loading many cost tiles over a long timeframe at once. Wait a minute and refresh, or choose a shorter timeframe

### The Spend Limits stream shows an error

Verify that:

- The selected project has a monthly spend limit set. Projects without one return an error, and the other projects still return
- Your OpenAI organization is on a paid API plan
