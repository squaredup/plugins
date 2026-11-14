Monitor your Microsoft Copilot estate in SquaredUp: [Microsoft 365 Copilot](https://learn.microsoft.com/en-us/copilot/microsoft-365/) adoption and licence use, [Copilot Studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/) credit capacity, and Copilot spend from [Azure Cost Management](https://learn.microsoft.com/en-us/azure/cost-management-billing/). Data comes from [Microsoft Graph](https://learn.microsoft.com/en-us/graph/overview), the [Power Platform API](https://learn.microsoft.com/en-us/power-platform/admin/programmability-overview) and the [Cost Management API](https://learn.microsoft.com/en-us/rest/api/cost-management/), all through one Microsoft Entra app registration.

> ⚠️ Copilot Studio credit consumption **per agent or per environment** isn't available to an app registration, only to a signed-in administrator, so this plugin reports Copilot Studio credits for the whole tenant. Per-agent breakdowns remain in the [Power Platform admin center](https://admin.powerplatform.microsoft.com).

## Setup

You need a Microsoft Entra **app registration** with a client secret, read access to Microsoft Graph reports and licences, registration as a Power Platform management app, and optionally Cost Management access.

### 1. Register the app

1. In the [Microsoft Entra admin center](https://entra.microsoft.com), go to **Identity → Applications → App registrations** and click **New registration**. Give it a name such as `SquaredUp Copilot` and click **Register**.
2. From the **Overview** page, copy the **Directory (tenant) ID** and **Application (client) ID** into the matching fields.
3. Go to **Certificates & secrets → Client secrets → New client secret**. Copy the secret **Value** into the **Client secret** field.

### 2. Grant Microsoft Graph permissions

1. In the app registration, go to **API permissions → Add a permission → Microsoft Graph → Application permissions**.
2. Add **Reports.Read.All**, **User.Read.All** and **LicenseAssignment.Read.All**.
3. Click **Grant admin consent** for your organization.

### 3. Show user names in usage reports (optional)

Microsoft 365 hides user names in usage reports by default. The plugin works with names hidden, but the **Copilot User Activity** data stream then shows anonymous IDs instead of names, and its rows can't be matched to imported Copilot Users, so the per-user filter and the **Copilot User** dashboard show no activity.

This is a tenant-wide setting: showing names applies to **all** Microsoft 365 usage reports, not only Copilot's. Check your organization's privacy policy before you change it. To show names:

1. In the [Microsoft 365 admin center](https://admin.microsoft.com), go to **Settings → Org settings → Services → Reports**.
2. Clear **Display concealed user, group, and site names in all reports** and click **Save**.

### 4. Register the app with Power Platform

Copilot Studio credit and environment data comes from Power Platform, which only accepts apps a Power Platform administrator has registered ([Microsoft guide](https://learn.microsoft.com/en-us/power-platform/admin/powerplatform-api-create-service-principal)). Signed in as a **Power Platform administrator** or **Global administrator**, run one of these once, replacing `TENANT_ID` with the **Directory (tenant) ID** and `CLIENT_ID` with the **Application (client) ID**.

With the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) on any operating system:

```bash
az login --tenant "TENANT_ID" --allow-no-subscriptions
az rest --method put --resource https://service.powerapps.com/ --url "https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/adminApplications/CLIENT_ID?api-version=2020-10-01"
```

Or with Windows PowerShell:

```powershell
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell
Add-PowerAppsAccount
New-PowerAppManagementApp -ApplicationId CLIENT_ID
```

### 5. Give the app access to Cost Management (optional)

To see Copilot spend, choose the scope your Copilot Studio billing policy and Azure AI resources are billed to, and assign the app the **Cost Management Reader** role there: open the scope in the [Azure portal](https://portal.azure.com), go to **Access control (IAM) → Add role assignment**, and pick the app. Then enter the scope in the **Cost Management scope** field.

Copilot Studio pay-as-you-go charges land on the subscription that holds the billing policy's **Power Platform account** resource (`Microsoft.PowerPlatform/accounts`). Azure OpenAI and Azure AI Foundry charges land on the subscriptions that hold those resources. To cover several subscriptions at once, use a billing account or billing profile scope.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Directory (tenant) ID** | The Microsoft Entra tenant the app is registered in. | App registration → **Overview**. | Yes |
| **Application (client) ID** | Identifies the app registration. | App registration → **Overview**. | Yes |
| **Client secret** | Authenticates the app. | App registration → **Certificates & secrets**. | Yes |
| **Cost Management scope** | The Azure scope to read Copilot spend from, such as `/subscriptions/<subscription ID>` or `/providers/Microsoft.Billing/billingAccounts/<billing account ID>`. Leave blank to skip spend data. | Azure portal → the subscription or billing account → **Properties**. | No |

On save, the plugin checks that it can read licences, Microsoft 365 Copilot usage reports and Copilot Studio credit capacity. A failed licence check means the credentials or Graph permissions are wrong and blocks setup. The other two checks only warn, and name the step to revisit.

## What this plugin monitors

- **Licence use**: Copilot seats purchased, assigned and available, so unused seats stand out.
- **Adoption**: enabled and active users per Microsoft 365 app (Teams, Outlook, Word, Excel, PowerPoint, Copilot Chat and more), daily trends, and prompts submitted.
- **Per-user activity**: when each licensed user last used Copilot and in which apps, with users who haven't used it for over 7 or 28 days flagged.
- **Copilot Studio credits**: prepaid capacity, consumption and pay-as-you-go usage this month, and whether the tenant is within capacity or in overage.
- **Spend**: daily Azure costs for Copilot Studio, Copilot Chat pay-as-you-go and Azure AI services, by service, meter or resource.

The out-of-the-box dashboards include an estate-wide **Overview** plus a perspective for each **Copilot User** and **Environment**.

## Data streams

- **Copilot Licences**: purchased, assigned and available seats for each licence that includes Microsoft 365 Copilot (account-wide).
- **Copilot Adoption**: enabled users, active users and active rate per app over a 7, 28, 90 or 180-day period, with prompt totals (account-wide).
- **Copilot Adoption Trend**: daily enabled and active users per app over the chosen period (account-wide).
- **Copilot User Activity**: last activity per app, days since last use, prompts and active days for each licensed user (account-wide, or filtered to selected users).
- **Copilot Credit Capacity**: prepaid and pay-as-you-go Copilot Credit usage this month, with capacity status (account-wide).
- **Environment Credit Allocations**: capacity allocated to an environment, by currency (per environment).
- **Copilot Spend**: daily cost and usage quantity from Azure Cost Management, grouped by service, meter category, meter, resource group, resource or resource type, for Copilot and AI services or all services (account-wide).

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Copilot User** | Microsoft Graph `GET /v1.0/users`, filtered to users with an enabled Microsoft 365 Copilot service plan | A user licensed for Microsoft 365 Copilot. |
| **Environment** | Power Platform admin API `GET /providers/Microsoft.BusinessAppPlatform/scopes/admin/environments` | A Power Platform environment, where Copilot Studio agents are built and credits are allocated. |

## Known limitations

- **Usage reports lag by about two days**, and use Microsoft's fixed 7, 28, 90 and 180-day periods, chosen with each data stream's **Period** setting rather than the dashboard timeframe.
- **Users who recently lost their licence still appear** in Copilot User Activity: Microsoft's report covers anyone licensed in the last 180 days.
- **Copilot Chat use by unlicensed users isn't reported**: Microsoft Graph only covers users with a Microsoft 365 Copilot licence.
- **Copilot Studio credits are tenant-wide and month to date**: consumption by agent, environment or user, per-agent limits, and session analytics (resolution, escalation, satisfaction) are only in the Power Platform admin center and Copilot Studio.
- **Some environments have no credit allocations**: developer and legacy environments return a "no Copilot credit allocations" message instead of data.
- **Cost Management throttles requests across the whole tenant**, and its data refreshes about every four hours. Several spend tiles refreshing at once may briefly show "Too many requests".
- **Cost Management doesn't support every scope**: management groups return no data for Microsoft Customer Agreement subscriptions, and Azure Sponsorship subscriptions report no costs. Use a subscription, billing account or billing profile scope.
- **Large spend queries can exceed the response size limit**: grouping all services by resource over a whole quarter may fail. Narrow the timeframe or keep the default Copilot and AI services filter.
- **Read-only**: the plugin never changes anything in Microsoft 365, Power Platform or Azure.
