Monitor your Microsoft Copilot estate in SquaredUp: [Microsoft 365 Copilot](https://learn.microsoft.com/en-us/copilot/microsoft-365/) adoption and licence use, [Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/) credit capacity, Copilot spend and budgets from [Azure Cost Management](https://learn.microsoft.com/en-us/azure/cost-management-billing/), the agents in the [Microsoft Agent 365](https://learn.microsoft.com/en-us/microsoft-agent-365/overview) registry, the AI apps people sign in to with their work account and what they're allowed to do, and the carbon emissions of Copilot use. Data comes from [Microsoft Graph](https://learn.microsoft.com/en-us/graph/overview), the [Power Platform API](https://learn.microsoft.com/en-us/power-platform/admin/programmability-overview) and the [Cost Management API](https://learn.microsoft.com/en-us/rest/api/cost-management/), all through one Microsoft Entra app registration.

> ⚠️ Copilot Studio credit consumption **per agent or per environment** isn't available to an app registration, only to a signed-in administrator, so this plugin reports Copilot Studio credits for the whole tenant. Per-agent breakdowns remain in the [Power Platform admin center](https://admin.powerplatform.microsoft.com).

## Setup

You need a Microsoft Entra **app registration** with a client secret, Microsoft Graph application permissions, registration as a Power Platform management app, and optionally Cost Management access. The plugin only ever reads data, and every Graph permission and Azure role below is read-only, but the Power Platform registration is not: see step 4.

### 1. Register the app

1. In the [Microsoft Entra admin center](https://entra.microsoft.com), go to **Identity → Applications → App registrations** and click **New registration**. Give it a name such as `SquaredUp Copilot` and click **Register**.
2. From the **Overview** page, copy the **Directory (tenant) ID** and **Application (client) ID** into the matching fields.
3. Go to **Certificates & secrets → Client secrets → New client secret**. Copy the secret **Value** into the **Client secret** field.

### 2. Grant Microsoft Graph permissions

In the app registration, go to **API permissions → Add a permission → Microsoft Graph → Application permissions**, add the permissions below, then click **Grant admin consent** for your organization. The first three are required; add the others for the data streams that need them.

| Permission | Required | What it's used for |
| ---------- | -------- | ------------------ |
| **Reports.Read.All** | Yes | Copilot usage reports (Copilot Adoption, Copilot Adoption Trend, Copilot User Activity, Copilot Daily User Activity), Copilot Emissions, and the application sign-in summary behind AI App Sign-ins and AI App Permissions. |
| **User.Read.All** | Yes | Importing Copilot Users (with department, job title and account state, which Copilot User Activity reads from them), and naming users who granted AI apps access. |
| **LicenseAssignment.Read.All** | Yes | Copilot Licences, and the licence check on save. |
| **AuditLog.Read.All** | No | Copilot User Sign-ins, each user's last sign-in, read live, which the Possible Leavers tile uses. |
| **Directory.Read.All** | No | Add with AuditLog.Read.All for Copilot User Sign-ins: Microsoft uses it to check the tenant's Entra ID licence, and without it sign-in queries can fail intermittently ([Microsoft guide](https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/users-groups-entra-apis/b2c-or-tenant-premium-license-sign-in-activities)). |
| **Application.Read.All** | No | AI App Permissions: each AI app's publisher and the application permissions it holds. |
| **DelegatedPermissionGrant.Read.All** | No | AI App Permissions: the delegated permissions granted to each AI app, for all users or by individual users. |
| **CopilotPackages.Read.All** | No | Agents and Agent Usage, from the Microsoft Agent 365 registry, and importing Agents. |

Some data also depends on tenant licences rather than permissions:

- **Last sign-in, AI App Sign-ins and AI App Permissions** need a Microsoft Entra ID P1 or P2 licence in the tenant.
- **Agents and Agent Usage** need [Microsoft Agent 365](https://learn.microsoft.com/en-us/microsoft-agent-365/overview), licensed for at least one user, which turns on the agent registry for the tenant. Without it, Agents shows no data and a warning, and nothing else is affected.

### 3. Show user names in usage reports (optional)

Microsoft 365 hides user names in usage reports by default. The plugin works with names hidden, but the **Copilot User Activity** data stream then shows anonymous IDs instead of names, and its rows can't be matched to imported Copilot Users, so the per-user filter and the **Copilot User** dashboard show no activity, department and sign-in details can't be shown, and the seat tiles on **Adoption & Seats** (Seats to Reclaim, Seats by Status, Seats to Review and Adoption by Department) show no seats, because they only count users matched to a current licence.

This is a tenant-wide setting: showing names applies to **all** Microsoft 365 usage reports, not only Copilot's. Check your organization's privacy policy before you change it. To show names:

1. In the [Microsoft 365 admin center](https://admin.microsoft.com), go to **Settings → Org settings → Services → Reports**.
2. Clear **Display concealed user, group, and site names in all reports** and click **Save**.

### 4. Register the app with Power Platform

Copilot Studio credit and environment data comes from Power Platform, which only accepts apps a Power Platform administrator has registered ([Microsoft guide](https://learn.microsoft.com/en-us/power-platform/admin/powerplatform-api-create-service-principal)). Signed in as a **Power Platform administrator** or **Global administrator**, run one of these once, replacing `TENANT_ID` with the **Directory (tenant) ID** and `CLIENT_ID` with the **Application (client) ID**.

> ⚠️ A registered management app is treated by Power Platform like a user with the **Power Platform Administrator** role, and Microsoft doesn't allow its access to be narrowed. The plugin only calls read-only Power Platform APIs, but anyone holding the app's client secret has administrator-level access to Power Platform, so protect the secret accordingly. Skip this step if you don't need Copilot Studio credits or environments; the rest of the plugin works without it.

With the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) on any operating system:

```bash
az login --tenant "TENANT_ID" --allow-no-subscriptions
az rest --method put --resource https://service.powerapps.com/ --url "https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/adminApplications/CLIENT_ID?api-version=2020-10-01"
```

Or with Windows PowerShell. If you've never signed in to the [Power Platform admin center](https://admin.powerplatform.microsoft.com), sign in once first, or the cmdlets fail with an authorization error ([Microsoft guide](https://learn.microsoft.com/en-us/power-platform/admin/powershell-getting-started)):

```powershell
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell
Add-PowerAppsAccount
New-PowerAppManagementApp -ApplicationId CLIENT_ID
```

### 5. Give the app access to Cost Management (optional)

To see Copilot spend and budgets, choose the scope your Copilot Studio billing policy and Azure AI resources are billed to, give the app read access there, and enter the scope in the **Cost Management scope** field. The role depends on the kind of scope ([Microsoft guide](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/assign-access-acm-data)):

- **Subscription or resource group**: assign the **Cost Management Reader** role. Open the scope in the [Azure portal](https://portal.azure.com), go to **Access control (IAM) → Add role assignment**, and pick the app.
- **Microsoft Customer Agreement billing account**: assign the **Billing account reader** role, in **Cost Management + Billing → Billing scopes →** the billing account **→ Access control (IAM)**.
- **Microsoft Customer Agreement billing profile**: assign the **Billing profile reader** role, in the billing profile's **Access control (IAM)**.
- **Enterprise Agreement billing account**: assign the app the **EnrollmentReader** role ([Microsoft guide](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/assign-roles-azure-service-principals)).

Copilot Studio pay-as-you-go charges land on the subscription that holds the billing policy's **Power Platform account** resource (`Microsoft.PowerPlatform/accounts`). Azure OpenAI and Azure AI Foundry charges land on the subscriptions that hold those resources. To cover several subscriptions at once, use a billing account or billing profile scope.

The **Cost Budgets** data stream lists the [budgets](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets) set at the same scope. To track Copilot Studio pay-as-you-go spend against a limit, create a monthly budget filtered to the Power Platform account resource rather than its resource group, so charges for other resources in the group aren't counted. If the billing policy also covers other Power Platform products, add a meter filter for the Copilot Studio meters too.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Directory (tenant) ID** | The Microsoft Entra tenant the app is registered in. | App registration → **Overview**. | Yes |
| **Application (client) ID** | Identifies the app registration. | App registration → **Overview**. | Yes |
| **Client secret** | Authenticates the app. | App registration → **Certificates & secrets**. | Yes |
| **Cost Management scope** | The Azure scope to read Copilot spend and budgets from, such as `/subscriptions/<subscription ID>` or `/providers/Microsoft.Billing/billingAccounts/<billing account ID>`. Leave blank to skip spend and budget data. | Azure portal → the subscription or billing account → **Properties**. | No |

On save, the plugin checks that it can read licences, Microsoft 365 Copilot usage reports and Copilot Studio credit capacity. A failed licence check is reported as an error, because it usually means the credentials or Graph permissions are wrong. The data source can still be added, but fix the error first. The other two checks only warn, and name the step to revisit.

## What this plugin monitors

- **Licence use**: Copilot seats purchased, assigned and available, so unused seats stand out.
- **Adoption**: enabled and active users per Microsoft 365 app (Teams, Outlook, Word, Excel, PowerPoint, Copilot Chat and more), daily trends, and prompts submitted.
- **Per-user activity**: when each licensed user last used Copilot and in which apps, with users who haven't used it for over 7 or 28 days flagged.
- **Seats to reclaim**: each licensed user's department and account state, with a seat status (Active, Low use, Idle, Never used, Account disabled, or Unknown for users who can't be matched to an imported Copilot User), adoption by department, and users who haven't signed in for 30 days.
- **Copilot Studio credits**: prepaid capacity, consumption and pay-as-you-go usage this month, and whether the tenant is within capacity or in overage.
- **Spend**: daily Azure costs for Copilot Studio, Copilot Chat pay-as-you-go and Azure AI services, by service, meter or resource, and spend against Cost Management budgets with a forecast for the period.
- **AI app sign-ins**: which AI apps people sign in to with their work account, such as Copilot, ChatGPT Enterprise or Claude's Microsoft 365 connectors.
- **AI app permissions**: what those AI apps have been allowed to access, granted for everyone or by individual users, such as an MCP connector consented to read mail and files.
- **Agents**: the Microsoft Agent 365 registry: agents by platform, type and publisher, new agents each week, agents that are blocked or have no active owner, and per-agent active users and sessions.
- **Daily activity**: each user's Copilot use and prompts per day over the last week.
- **Emissions**: monthly carbon emissions from Copilot use, by datacenter region and emissions scope.

## Dashboards

The plugin adds four dashboards, each for a different audience, so a dashboard only depends on the setup steps its own data needs:

| Dashboard | Shows | Needs |
| --------- | ----- | ----- |
| **Adoption & Seats** | Seats in use, active users and prompts, adoption by app and department, seat status, seats to reclaim and possible leavers. | The required Graph permissions. **Possible Leavers** also needs AuditLog.Read.All and Directory.Read.All. |
| **Cost & Capacity** | Copilot Studio credit capacity and environment allocations, Copilot and AI spend, budgets and Copilot emissions. | Power Platform registration (step 4) for credits, and a Cost Management scope (step 5) for spend and budgets. |
| **AI Governance** | Which AI apps people sign in to, and what those apps have been allowed to access. | Application.Read.All and DelegatedPermissionGrant.Read.All for permissions, and Microsoft Entra ID P1 or P2. |
| **Agents** | The Microsoft Agent 365 registry: agents by platform, new agents, and agents that are blocked or have no owner. | CopilotPackages.Read.All and Microsoft Agent 365. |

Each **Copilot User**, **Environment** and **Agent** also has its own perspective dashboard.

## Data streams

- **Copilot Licences**: purchased, assigned and available seats for each licence that includes Microsoft 365 Copilot (account-wide).
- **Copilot Adoption**: enabled users, active users and active rate per app over a 7, 28, 90 or 180-day period, with prompt totals (account-wide).
- **Copilot Adoption Trend**: daily enabled and active users per app over the chosen period (account-wide).
- **Copilot User Activity**: last activity per app, days since last use, prompts and active days for each licensed user, with department, job title, account state and seat status (account-wide, or filtered to selected users).
- **Copilot User Sign-ins**: each Copilot-licensed user's account state and last successful Microsoft Entra sign-in, read live (account-wide). Failed sign-in attempts don't count, so a leaver's account can't look active because someone tried to sign in to it.
- **Copilot Daily User Activity**: whether each licensed user was active, their prompts and the apps they used, per day over the last 7 days of reporting (account-wide, or filtered to selected users).
- **Copilot Credit Capacity**: prepaid and pay-as-you-go Copilot Credit usage this month, with capacity status (account-wide).
- **Environment Credit Allocations**: capacity allocated to each environment, by currency (per environment).
- **Copilot Spend**: daily cost from Azure Cost Management, grouped by service, meter category, meter, resource group, resource or resource type, for Copilot and AI services or all services (account-wide). Usage quantity is only given when grouped by meter, because other groupings mix units. Grouped by resource above a single subscription, each resource is labelled with its subscription name.
- **Cost Budgets**: each Cost Management budget at the configured scope, with its amount, spend so far this period, forecast at period end and filters (account-wide).
- **AI App Sign-ins**: successful and failed Microsoft Entra sign-ins per application over 7 or 30 days, with each AI app's vendor, for AI apps only or all apps (account-wide).
- **AI App Permissions**: one row per permission grant held by an AI app used in the last 30 days: delegated grants for all users or one user (named), and application permissions, with the API they're granted on and whether they go beyond basic sign-in (account-wide).
- **Agents**: each agent in the Microsoft Agent 365 registry with its type, platform, publisher, availability, whether it's blocked, created and updated dates, and its owners (Microsoft Entra object IDs, linked to Copilot Users where the owner has a Copilot licence), with agents that have no owner flagged (account-wide, or filtered to selected agents).
- **Agent Usage**: active users, sessions, run time and exceptions over the last 30 days, last use, and sharing for an agent (per agent).
- **Copilot Emissions**: monthly scope 1, scope 2 and scope 3 emissions from Microsoft 365 Copilot use, by datacenter region (account-wide).

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Copilot User** | Microsoft Graph `GET /v1.0/users`, filtered to users with a Microsoft 365 Copilot service plan that is enabled or in its grace period | A user licensed for Microsoft 365 Copilot, identified by user principal name, with their Microsoft Entra object ID, mail, department, job title and account state. |
| **Environment** | Power Platform admin API `GET /providers/Microsoft.BusinessAppPlatform/scopes/admin/environments` | A Power Platform environment, where Copilot Studio agents are built and credits are allocated. |
| **Agent** | Microsoft Graph `GET /v1.0/copilot/admin/catalog/packages` (needs Microsoft Agent 365) | An agent in the Agent 365 registry, such as a Copilot Studio or Agent Builder agent, or one from Microsoft or a publisher. |

Each **Agent** is related to the **Copilot Users** who own it (*is owned by*), matched on Microsoft Entra object ID. Owners without a Copilot licence aren't imported, so they have no relationship.

## Known limitations

- **Usage reports lag by about two days**, and use Microsoft's fixed 7, 28, 90 and 180-day periods, chosen with each data stream's **Period** setting rather than the dashboard timeframe.
- **Users who recently lost their licence still appear** in Copilot User Activity: Microsoft's report covers anyone licensed in the last 180 days. They're no longer imported as Copilot Users, so their department, job title and account state show **Object not found** and their seat status is **Unknown**; the out-of-the-box seat tiles leave them out.
- **Last sign-in needs AuditLog.Read.All and Microsoft Entra ID P1 or P2**: without them, Copilot User Sign-ins and the Possible Leavers tile show an error, and nothing else is affected.
- **Department, job title and account state are as recent as the last import**: Copilot User Activity reads them from the imported Copilot Users, so its seat status flags a disabled account once the next import has run.
- **Copilot Chat use by unlicensed users isn't reported**: Microsoft Graph only covers users with a Microsoft 365 Copilot licence.
- **Copilot Studio credits are tenant-wide and month to date**: consumption by agent, environment or user, per-agent limits, and session analytics (resolution, escalation, satisfaction) are only in the Power Platform admin center and Copilot Studio.
- **Some environments have no credit allocations**: developer and legacy environments can't hold allocations, so they don't appear in Environment Credit Allocations.
- **Cost Management throttles requests across the whole tenant**, and its data refreshes about every four hours. Several spend tiles refreshing at once may briefly show "Too many requests".
- **Cost Management doesn't support every scope**: management groups return no data for Microsoft Customer Agreement subscriptions, and Azure Sponsorship subscriptions report no costs. Use a subscription, billing account or billing profile scope.
- **Large spend queries can exceed the response size limit**: grouping all services by resource over a whole quarter may fail. Narrow the timeframe or keep the default Copilot and AI services filter.
- **The Copilot and AI services filter includes everything billed to a Power Platform account**: if a billing policy also covers Power Apps or other Power Platform pay-as-you-go products, their charges appear in Copilot Spend too. Group by **Meter** to tell them apart.
- **AI App Sign-ins only sees apps that sign in with Microsoft Entra**: AI tools used with personal accounts never appear. AI apps are recognised by name, so one with an unrelated name is missed; set **Apps** to **All apps** to check the full list.
- **Daily user activity only goes back about a week**: Microsoft keeps per-user daily detail for roughly 7 days, so the stream always covers the last 7 days of reporting rather than the dashboard timeframe.
- **AI App Permissions only covers AI apps used in the last 30 days**: it starts from the apps people signed in to, so an AI app that's been granted access but not used recently isn't listed. "Access beyond sign-in" means any permission other than basic sign-in (`openid`, `profile`, `email`, `offline_access`, `User.Read`), on Microsoft Graph or whichever API the grant is on.
- **Agents are untested against a live Agent 365 registry**: the data streams follow Microsoft's documented API, but haven't yet been run in a tenant with Agent 365. Microsoft doesn't say whether the registry lists every agent or only those owned by licensed users. The registry lists agents only, not plugins, MCP servers or Power Platform connectors, and doesn't report credit consumption.
- **Budget forecasts are estimates**: Azure returns a forecast for some budgets only. Otherwise the forecast is a straight line from the spend so far in the current period, and budgets that reset on a billing period have no forecast.
- **Copilot Emissions uses an undocumented Microsoft Graph beta report**: it may change without notice. Microsoft's Emissions Impact Dashboard reports the same scopes in metric tons of CO2e.
