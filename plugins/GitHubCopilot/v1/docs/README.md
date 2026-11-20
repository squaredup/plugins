Track [GitHub Copilot](https://github.com/features/copilot) across a GitHub organization or enterprise: who holds a licence and is using it, how adoption is trending, which models and clients consume tokens, and how much of the AI credit pool and budgets has been spent. Data comes from the GitHub REST API for [Copilot user management](https://docs.github.com/en/rest/copilot/copilot-user-management), [Copilot usage metrics](https://docs.github.com/en/rest/copilot/copilot-usage-metrics) and [billing](https://docs.github.com/en/rest/billing/usage).

> ⚠️ Requires **Copilot Business** or **Copilot Enterprise** on GitHub.com or GitHub Enterprise Cloud (including data residency). Personal Copilot plans and GitHub Enterprise Server have no Copilot admin API.

## Before you start

- **Organization:** you need to be an **organization owner**.
- **Enterprise:** you need to be an **enterprise owner** or **billing manager**. The **User Seat** stream needs an enterprise owner.
- Usage metrics also accept a custom role with **View Organization Copilot Metrics** or **View Enterprise Copilot Metrics**.
- The **Copilot usage metrics** policy must be enabled, or the usage, token and per-user streams return errors:
  - **Enterprise:** set it to **Enabled everywhere** in the enterprise's [Copilot policies](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-enterprise-policies#defining-policies-for-your-enterprise).
  - **Organization outside an enterprise:** enable it in the organization's Copilot policies. See [viewing usage and adoption](https://docs.github.com/en/copilot/how-tos/administer-copilot/view-usage-and-adoption).

## Setup

1. Sign in to GitHub as an organization owner, or an enterprise owner or billing manager.
2. Open [**Settings → Developer settings → Personal access tokens → Tokens (classic)**](https://github.com/settings/tokens) and click **Generate new token (classic)**.
   - Use a classic token: fine-grained tokens can't call the enterprise Copilot and billing endpoints.
   - If your enterprise enforces SAML single sign-on, authorize the token for the organization after creating it.
3. Select these scopes:
   - **manage_billing:copilot**: Copilot seats and usage metrics.
   - **read:org**: organization seats and usage metrics.
   - **read:enterprise**: enterprise seats and usage metrics. Only needed for an enterprise.
   - **manage_billing:enterprise**: enterprise AI credit usage, budgets and cost centers. Only needed for an enterprise.
   - **admin:org** (optional): only needed for **Model Policies** on an organization. It also grants write access to organization settings, so leave it out if you don't need that stream.
4. Set an expiry that suits your policy. The plugin warns on save when the token is within 7 days of expiring.
5. In SquaredUp, choose the **Account type**, enter the **Organization or enterprise slug**, and paste the token into **Personal access token (classic)**.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Account type** | Whether the plugin reads an **Organization** or an **Enterprise**. Some data is only available for one or the other (see Known limitations). | Your GitHub account structure. | Yes |
| **Organization or enterprise slug** | The account name used in API calls. | The account's GitHub address: `github.com/octo-org` or `github.com/enterprises/octo-org`. | Yes |
| **Personal access token (classic)** | Authenticates every request to the GitHub API. | [GitHub token settings](https://github.com/settings/tokens), with the scopes listed in Setup. | Yes |
| **API URL** | The GitHub API address. Leave it as `https://api.github.com` unless you use GitHub Enterprise Cloud with data residency, in which case use `https://api.SUBDOMAIN.ghe.com`. Other addresses are rejected, and the token is only ever sent to these GitHub hosts. | Your enterprise's GHE.com address. | No |

On save, the plugin authenticates with GitHub (this must succeed). It then checks separately that it can read Copilot seats, usage metrics and billing, and warns if the token is close to expiring. A failed check names the scope or setting to fix. The plugin still saves, but streams that depend on that access return errors until you fix it.

## What this plugin monitors

- **Licences:** who holds a Copilot seat, which plan they're on, which team assigned it, when they last used Copilot and in which editor, and which seats are inactive or have no recorded activity (GitHub clears a seat's last activity after 90 idle days).
- **Adoption and activity:** daily, weekly and monthly active users (including chat, agent, CLI, cloud agent and code review users), interactions, code suggestions and acceptances, lines of code, and pull requests created or reviewed by Copilot. Each can be broken down by feature, IDE, language and model.
- **Tokens and models:** model requests and prompt/output tokens by client (VS Code, JetBrains, Copilot CLI and others) and model, for the whole account and for each user.
- **Usage by person:** AI credits used, activity, features used, adoption phase and tokens by model for each user.
- **AI credit spend:** AI credits (or legacy premium requests) by model and SKU, split into the part covered by the included credit pool and the part billed as overage.
- **Budgets and pools:** Copilot budgets and how much of each is spent, per-user spend against universal budgets, and each cost center's AI credit pool cap (enterprise).
- **Policies:** which Copilot models are enabled, and the organization's Copilot feature settings.

The out-of-the-box dashboards are **Overview**, **Adoption**, **Models and Tokens** and **Billing**, plus perspectives for each **User**, **Budget** and **Cost Center**.

## Data streams

- **Seats:** one row per Copilot seat, with plan, assigning team, last activity, last editor and an Active/Inactive/No recorded activity status (account-wide). For an enterprise, a user granted Copilot through several organizations or teams gets one row for each grant but is billed for one seat. The **Overview** seat tiles count each user once.
- **User Seat:** the same seat details for each selected **User** object, one request per user. Enterprises need an enterprise owner's token for this stream.
- **Seat Breakdown:** seat totals for the billing cycle and Copilot policy settings (organizations only).
- **Usage Metrics:** daily account totals from the latest 28-day report, including active users, interactions, acceptances, lines of code, tokens and pull requests.
- **Usage Breakdown:** the same daily activity broken down by feature, IDE, language or model, chosen with the **Breakdown** parameter.
- **Token Usage:** daily model requests and prompt/output tokens by client, model and model selection mode (account-wide).
- **User Usage:** per-user activity, AI credits used, tokens, features used and adoption phase from the latest 28-day report. The **User** parameter filters it to one or more users.
- **User Token Usage:** model requests and tokens per user, client and model, with the same **User** filter.
- **AI Credit Usage:** billed usage by model and SKU, split into included and billed quantities and amounts. **Meter** switches to legacy premium requests. It can be filtered by **User**, **Model** and, for enterprises, **Cost center** and **Organization**.
- **Budgets:** Copilot and AI credit budgets with their limit, scope and alerting settings.
- **Budget Consumption:** amount spent and percentage used for each selected budget.
- **Budget Users:** per-user spend against a universal per-user budget (enterprises only; other budgets return no rows).
- **Cost Centers:** cost centers with their members and AI credit pool cap, optionally filtered to selected **Cost center** objects (enterprises only).
- **Model Policies:** whether each Copilot model is enabled, disabled or follows the default (organizations only).

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **User** | `GET /orgs/{org}/copilot/billing/seats` or `GET /enterprises/{enterprise}/copilot/billing/seats` | A person with an assigned Copilot seat. |
| **Budget** | `GET /organizations/{org}/settings/billing/budgets` or `GET /enterprises/{enterprise}/settings/billing/budgets` | A budget that caps Copilot or AI credit spend (budgets for other products are skipped). |
| **Cost Center** | `GET /enterprises/{enterprise}/settings/billing/cost-centers` | An enterprise cost center (enterprise accounts only). |

## Known limitations

- **Usage data covers the latest 28-day report only.** Usage, token and per-user streams read GitHub's latest 28-day reports, which are usually two to three days behind. Longer history isn't available in this version.
- **Per-user reports can lag.** If nobody has used Copilot recently, GitHub's "latest" per-user report can be weeks old; check the **Day** column.
- **AI credit usage periods:** **Last 7 days** returns daily rows. **This month** and **Last month** return monthly totals. **This year** and **Last year** return one row per month. GitHub's billing API returns one period per request, and longer daily ranges take too many requests to finish in time.
- **Large reports may time out.** Each query has to finish in about 12 seconds. A very large enterprise whose usage report is split into many files, or a slow billing API, can hit this, and the tile then shows partial data with a warning.
- **Remaining pool credit isn't available.** GitHub doesn't expose how many included AI credits remain in an organization's or enterprise's pool. Use the included vs billed split in **AI Credit Usage**, budget consumption, and cost center pool caps instead.
- **Account-specific data:** **Seat Breakdown** and **Model Policies** only return data for organizations. **Cost Centers** and **Budget Users** only return data for enterprises.
- **Role-restricted data:** for enterprises, **User Seat** only works with an enterprise owner's token. **Model Policies** needs the **admin:org** scope. **Budget Consumption** shows **Unavailable** when GitHub doesn't report spend for a budget.
- **Not supported:** GitHub Enterprise Server, personal Copilot plans, the detailed per-token usage CSV (only available from the GitHub UI), and team-level metrics.
- **Seat imports:** up to roughly 20,000 seats are imported as **User** objects (100 per page). An enterprise user with several grants becomes one **User** object that shows the organization and assigning team of only one of them.
- **Read-only:** the plugin never assigns or removes seats, changes policies or edits budgets.
