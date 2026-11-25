Monitor [Oracle Cloud Infrastructure (OCI)](https://www.oracle.com/cloud/) in SquaredUp: resources across every subscribed region and compartment, Monitoring metrics with MQL, alarms, log search, audit events, SQL queries on your databases, Cloud Guard problems, cost and service announcements. The plugin calls the [OCI REST APIs](https://docs.oracle.com/en-us/iaas/api/) directly, signed with an OCI API key, so no agent is needed.

> ⚠️ SQL queries run through [OCI Database Tools](https://docs.oracle.com/en-us/iaas/database-tools/home.htm) connections. Create one connection per database you want to query (see step 6 below). Everything else works without it.

## Setup

You need an OCI user with an **API signing key** and IAM policies that let it read your tenancy.

1. In the [OCI Console](https://cloud.oracle.com), create a group for SquaredUp, for example `squaredup-readers`, under **Identity & Security → Domains → (your domain) → Groups**, and a user in that group. You can also use an existing user.
2. Create a policy in the root compartment under **Identity & Security → Policies** with these statements (replace the group name if yours differs):

    ```text
    Allow group squaredup-readers to inspect compartments in tenancy
    Allow group squaredup-readers to inspect tenancies in tenancy
    Allow group squaredup-readers to read all-resources in tenancy
    Allow group squaredup-readers to read metrics in tenancy
    Allow group squaredup-readers to read alarms in tenancy
    Allow group squaredup-readers to read log-content in tenancy
    Allow group squaredup-readers to read audit-events in tenancy
    Allow group squaredup-readers to read cloud-guard-family in tenancy
    Allow group squaredup-readers to read usage-reports in tenancy
    Allow group squaredup-readers to read announcements in tenancy
    Allow group squaredup-readers to use database-tools-family in tenancy
    ```

    You can drop the lines for features you don't need. `use database-tools-family` is only needed for SQL queries. See [OCI policy reference](https://docs.oracle.com/en-us/iaas/Content/Identity/Reference/policyreference.htm).

3. Sign in as that user (or open the user as an administrator), go to **Profile → My profile → API keys** and click **Add API key**. Choose **Generate API key pair**, click **Download private key**, then **Add**. See [Required keys and OCIDs](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm).
4. The **Configuration file preview** shown after adding the key holds the `user`, `fingerprint`, `tenancy` and `region` values. Copy them into **User OCID**, **Key fingerprint**, **Tenancy OCID** and **Home region**.
5. Open the downloaded `.pem` file in a text editor and paste its whole contents into **Private key**.
6. To run SQL queries, create a Database Tools connection for each database under **Developer Services → Database Tools → Connections → Create connection**. Store the database user's password in an OCI Vault secret as the wizard asks, and add a private endpoint if the database isn't publicly reachable. Use a database user with read-only privileges. See [Creating a Database Tools connection](https://docs.oracle.com/en-us/iaas/database-tools/doc/creating-connection.html).

## Configuration fields

| Field                        | What it is                                                                                   | Where to find it                                                        | Required |
| ---------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| **Tenancy OCID**             | Identifies your tenancy.                                                                      | API key **Configuration file preview** (`tenancy`).                     | Yes      |
| **User OCID**                | The user the API key belongs to.                                                              | API key **Configuration file preview** (`user`).                        | Yes      |
| **Key fingerprint**          | Identifies which of the user's API keys signs requests.                                      | API key **Configuration file preview** (`fingerprint`).                 | Yes      |
| **Private key**              | The unencrypted PEM private key that signs every request. Stored encrypted.                  | The `.pem` file downloaded when the key was added.                      | Yes      |
| **Home region**              | Your tenancy's home region identifier, such as `us-ashburn-1`.                               | API key **Configuration file preview** (`region`), or **Tenancy details**. | Yes      |
| **Regions to import**        | Limits the import to these regions. Leave empty for every subscribed region.                 | **Governance & Administration → Region management**.                    | No       |
| **Resource types to import** | Which OCI resource types become SquaredUp objects.                                            | Pick from the list.                                                     | Yes      |
| **Realm domain**             | Only for non-commercial realms, for example `oraclegovcloud.com`. Defaults to `oraclecloud.com`. | Your realm's documentation.                                          | No       |

On save, the plugin reads your tenancy details and region subscriptions. A failure means OCI rejected the signature (the OCIDs, fingerprint and key don't belong together) or the user's policies don't allow reading the tenancy.

## What this plugin monitors

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

<!-- finalized in Phase 9 -->
