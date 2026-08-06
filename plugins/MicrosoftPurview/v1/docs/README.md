
This plugin connects SquaredUp to Microsoft Purview and surfaces data governance posture across collections, data sources, scans, classifications, policies, and lineage.

## What it does

- Imports Purview **Collections**, **Data Sources**, and **Scans** into the SquaredUp graph so they can be used as objects, drilldowns, and dashboard variables.
- Provides data streams for:
    - Assets — searchable per collection, with breakdowns by entity type and classification
    - Classification coverage — what proportion of assets carry each classification
    - Classifications — custom and built-in classifications applied to assets
    - Scan status and run history — per data source, per scan, and global recent runs
    - Policy coverage — metadata policies attached to collections
    - Lineage — upstream and downstream lineage for a given asset
    - Governance domains — domains defined in the Unified Catalog
    - Glossary terms — terms defined within a governance domain
- Ships with an out-of-the-box **Overview** dashboard.

## Prerequisites

You need a Microsoft Entra ID (Azure AD) **app registration** with a **client secret** and at least the **Data Reader** role on the Purview root collection. For scan endpoints, **Data Source Administrator** is required.

### 1. Register an application in Microsoft Entra ID

1. In the Azure portal, go to **Microsoft Entra ID → App registrations → New registration**.
2. Give it a name (e.g. `SquaredUp Purview Reader`) and register it (no redirect URI needed).
3. From the **Overview** page, copy the **Application (client) ID** and **Directory (tenant) ID**.
4. Go to **Certificates & secrets → Client secrets → New client secret**. Copy the **Value** immediately — it's only shown once.

### 2. Grant the application access to your Purview account

Purview uses **collection-level role assignments**, not Microsoft Graph API permissions. Grant the app registration access inside Purview itself.

1. Open the **Microsoft Purview governance portal** for your account.
2. Go to **Data Map → Collections → Root collection → Role assignments**.
3. Add the app registration to:
    - **Data Reader** (required — read assets, classifications, lineage, search)
    - **Data Source Administrator** (required — list data sources, scans, and scan history)
    - **Policy Author** or **Collection Administrator** is **not** needed for read-only use, but the app must be able to **read** metadata policies. The Data Source Administrator role is sufficient for this.

Role assignments at the root collection are inherited by all child collections.

### 3. Grant access to the Unified Catalog (governance domains and glossary terms)

The **Governance Domains** and **Glossary Terms** streams use the Purview Unified Catalog API, which has its own permission model separate from Data Map collection roles.

1. Open the **Microsoft Purview portal** and go to **Unified Catalog → Catalog Management → Governance Domains**.
2. Select the governance domain you want to expose.
3. Go to the **Roles** tab.
4. Add the app registration to the **Data Catalog Reader** role.

Repeat for each governance domain you want to surface. Without this role, the Governance Domains and Glossary Terms streams will return an "Unauthorized" error even if all Data Map roles are correctly assigned.

## Configuration fields

| Field                       | What it is                                                                                                                          | Where to find it                                                                                                          | Required |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| Purview account name        | The short name of your Purview account — the bit before `.purview.azure.com`. For `contoso-pv.purview.azure.com`, enter `contoso-pv` | Azure portal → your Purview account → **Overview** (the "Name" field) | Yes      |
| Directory (tenant) ID       | Your Entra ID tenant ID                                                                                                            | Entra ID → **Overview** → Tenant ID                                                                                       | Yes      |
| Application (client) ID     | The app registration's client ID                                                                                                   | App registration → **Overview** → Application (client) ID                                                                  | Yes      |
| Client secret               | The secret value generated in step 1                                                                                               | App registration → **Certificates & secrets**                                                                              | Yes      |

## What gets indexed

| Object type            | Represents                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| **Purview Collection** | An organisational unit in your Purview account. The root collection is named after the account itself.    |
| **Purview Data Source** | A registered data source — e.g. an Azure SQL database, ADLS Gen2 account, Snowflake instance, Amazon S3 bucket. |                                                            |
| **Purview Governance Domain** | A governance domain defined in the Unified Catalog. Requires the Data Catalog Reader role — see step 3 above. |

Assets (tables, files, columns) are **not** indexed because a single Purview account can hold millions of them. They are queried on-demand by the data streams instead.

## Known limitations

- **Asset cardinality** — large estates can return millions of assets. The asset search streams page through results but cap at the API's per-call limit of 1000 rows per page. Use the keyword and entity-type filters to narrow results.
- **Lineage depth** — the lineage stream walks up to a configurable depth (default 3 hops) in each direction; very deep lineage graphs are truncated by the API.
- **Policy coverage** — only **metadata policies** are surfaced. DLP and sensitivity-label policies live in Microsoft Graph and are not in scope for this plugin.
- **Permissions are not Graph permissions** — granting roles in Entra ID alone does nothing. The app registration must be added to Purview collection role assignments.
- **Account name format** — the account name field is the bare account name only. Do **not** include `https://` or `.purview.azure.com`.
- **API throttling** — the classic Purview Data Plane has per-account rate limits. Imports can take several minutes for large estates.
