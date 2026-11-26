Monitor [Microsoft Purview](https://learn.microsoft.com/en-us/purview/purview) data security in SquaredUp: data loss prevention, insider risk and AI security alerts, the sensitivity labels defined in your tenant, and the sensitive data that Microsoft 365 Copilot and other AI apps reach. Data comes from [Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/resources/security-api-overview).

> ⚠️ This plugin covers Purview data security. For the Purview Data Map and Unified Catalog, use the **Microsoft Purview Data Governance** plugin.

## Setup

You need an app registration in Microsoft Entra ID with a client secret, and a Global Administrator or Privileged Role Administrator to grant admin consent.

1. In the [Microsoft Entra admin center](https://entra.microsoft.com), go to **Identity** > **Applications** > **App registrations** and select **New registration**. Give it a name, leave the defaults, and select **Register**.
2. On the app's **Overview** page, copy the **Directory (tenant) ID** and **Application (client) ID**.
3. Go to **API permissions** > **Add a permission** > **Microsoft Graph** > **Application permissions**, and add:

    | Permission | Needed for |
    | --- | --- |
    | `InformationProtectionPolicy.Read.All` | Sensitivity labels |
    | `SecurityAlert.Read.All` | Data loss prevention, insider risk and AI security alerts |
    | `ThreatHunting.Read.All` | AI interactions (advanced hunting) |

4. Select **Grant admin consent for** your organization. See [Grant tenant-wide admin consent](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent).
5. Go to **Certificates & secrets** > **Client secrets** > **New client secret**, and copy the secret's **Value**. It's shown only once.
6. Enter the three values in SquaredUp.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Directory (tenant) ID** | Your Microsoft Entra tenant. | App registration > **Overview**. | Yes |
| **Application (client) ID** | The app registration the plugin signs in as. | App registration > **Overview**. | Yes |
| **Client secret** | The app's secret. | App registration > **Certificates & secrets**. | Yes |

On save, the plugin reads your sensitivity labels to check the credentials, then checks that it can read alerts and find AI interactions. A failed check is a warning, not a blocker: it tells you which tiles will be empty.

## What this plugin monitors

- **Purview alerts**: alerts from [data loss prevention](https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp), [insider risk management](https://learn.microsoft.com/en-us/purview/insider-risk-management) and Security for AI policies, with severity, status, assignee, and the users and files involved.
- **Sensitivity labels**: the labels defined in your tenant, with their priority, colour, encryption and where they apply.
- **AI interactions**: how people use Microsoft 365 Copilot and other AI apps, and the labelled data those interactions reach, including resources that matched a DLP policy, cross-prompt injection (XPIA) detections and jailbreak attempts.
- **Label activity**: labels applied, changed, upgraded, downgraded or removed, labelled files opened, and labels detected in email, by user, label, app and site.
- **File and sharing activity**: SharePoint and OneDrive file access, changes, downloads, sharing and anonymous link use, by user and site.

The out-of-the-box dashboards are an **Overview** of alerts, labels and sharing, an **AI Risk** dashboard, and perspectives for each **Sensitivity Label**, **User**, **AI App** and **Site**.

## Data streams

- **Alerts**: Purview alerts, filtered by source, severity, status and user, with a choice of which date the timeframe applies to. Account-wide.
- **Sensitivity Labels**: the label catalogue. Account-wide.
- **AI Interactions**: Copilot and AI app interactions summarised by time, user, AI app, the app it was used in, and sensitivity label, with counts of resources read, labelled resources, DLP policy matches, XPIA detections and jailbreak attempts. Account-wide, or filtered to chosen sensitivity labels, users or AI apps.
- **Label Activity**: sensitivity label events summarised by time, user, label, previous label, action, app and site, with event and item counts. Account-wide, or filtered to chosen sensitivity labels, users or sites.
- **File Activity**: SharePoint and OneDrive activity summarised by time, user, site, activity and category (access, modify, create or upload, download or sync, delete, share, anonymous link), with event and file counts. Account-wide, or filtered to chosen sites or users.
- **Cloud App Events Query**: your own KQL, continuing from the advanced hunting `CloudAppEvents` table already filtered to the tile's timeframe. Start the query with a pipe, for example `| where ActionType == 'FileDownloaded' | summarize Downloads = count() by Application`.

**AI Interactions**, **Label Activity** and **File Activity** have a **Group by** option that sets which dimensions each row represents, such as time, user, label, site or action. They return one row per group, already counted, so keep it to the dimensions a tile needs. **Top** keeps only the largest groups, and **Label Activity** and **File Activity** can also be filtered by action or category.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Sensitivity Label** | `GET beta/security/informationProtection/sensitivityLabels` | A sensitivity label defined in the tenant. Sublabels are named `Parent / Sublabel`. |
| **User** | Advanced hunting `IdentityInfo` | A Microsoft Entra user, including guests, with department, job title and account state. Keyed by Microsoft Entra object ID, with `userPrincipalName` and `entraObjectId` properties for matching users from other Microsoft plugins. |
| **AI App** | Advanced hunting `CloudAppEvents` | A Copilot experience or AI app used in the last 30 days, such as `Copilot.M365Copilot.WebChat`. |
| **Site** | Advanced hunting `CloudAppEvents` | A SharePoint site or OneDrive with activity in the last 30 days, named by its path. |

## Known limitations

- **AI interactions, label activity, file activity, AI apps and sites need Microsoft Defender for Cloud Apps.** They come from the advanced hunting `CloudAppEvents` table, which is only populated when the Defender for Cloud Apps **Microsoft 365** app connector has its **Microsoft 365 activities** component selected. A connector can show as connected with that component off: check it in the [Microsoft Defender portal](https://security.microsoft.com) under **Settings** > **SaaS security** > **App Connectors** > **Microsoft 365** > **Edit settings**. Without it, those tiles are empty, only labels and users are imported, and the **AI interactions** check warns on save.
- **AI interactions, label activity and file activity cover up to 30 days**, the advanced hunting retention period. Timeframes longer than the last 30 days aren't offered.
- **AI apps and sites come from recent activity.** They're imported from the last 30 days of `CloudAppEvents`, so an app or site with no recent activity drops out at the next import. These import steps need Defender for Cloud Apps; users come from the advanced hunting `IdentityInfo` table instead.
- **Imports are sized for about 60,000 users and 60,000 active sites.** Users are imported in eight batches and sites in four. Each batch is one advanced hunting query, and its result must stay within SquaredUp's response size limit. In a larger tenant a batch can fail, and the users or sites in that batch aren't imported. Every OneDrive with activity in the last 30 days counts as a site.
- **Advanced hunting queries are slow.** Every query on `CloudAppEvents` takes several seconds, however simple, and Microsoft Graph rate-limits requests per tenant (we saw 20 calls a minute while testing). Keep dashboards to a few AI, label and file activity tiles, use **Group by** to return only the rows a tile needs, and prefer shorter timeframes.
- **An interaction counts under every sensitivity label it reached.** The **Interactions** column is per label, so adding it up across labels counts an interaction that reached several labels more than once. Use **Unique Interactions** for totals: it counts each interaction once.
- **Alerts only appear for policies you have configured.** Data loss prevention, insider risk and Security for AI alerts are raised by your own Purview policies, and are read from the same Microsoft Graph alerts API as the Microsoft Defender portal.
- **Sensitivity labels come from a Microsoft Graph beta endpoint**, because the v1.0 equivalent returned an error with application permissions. Microsoft may change beta endpoints without notice.
- **Policies, cases and reports aren't included.** Microsoft Graph has no API for DLP or insider risk policies, insider risk cases, or Data Security Posture Management reports.
- **Audit search isn't used.** Purview audit search is asynchronous and can take hours to return, which is too slow for dashboards.
- **Custom queries can read any advanced hunting table.** The **Cloud App Events Query** stream starts from `CloudAppEvents`, but KQL can join or union other tables the `ThreatHunting.Read.All` permission allows, such as email or device events. Anyone who can edit tiles on the data source can run them.
