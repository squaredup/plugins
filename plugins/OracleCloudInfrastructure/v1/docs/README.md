Monitor your [Oracle Cloud Infrastructure (OCI)](https://www.oracle.com/cloud/) tenancy in SquaredUp: an inventory of your resources across every subscribed region, performance metrics, alarm status, cost and usage, and budgets, via the [OCI REST APIs](https://docs.oracle.com/en-us/iaas/api/).

> ⚠️ Supports tenancies in Oracle's commercial cloud (`oraclecloud.com`). Government and sovereign cloud realms are not supported.

## Setup

The plugin authenticates with an OCI **API signing key** belonging to a user with read-only access. A dedicated user is recommended.

1. Sign in to the [OCI Console](https://cloud.oracle.com) as an administrator.
2. Create a group, e.g. **SquaredUp-ReadOnly**, and a user, e.g. **squaredup-readonly**, and add the user to the group. See [Managing users](https://docs.oracle.com/en-us/iaas/Content/Identity/users/about-managing-users.htm).
3. In the root compartment, create a policy for the group with these statements. See [Managing policies](https://docs.oracle.com/en-us/iaas/Content/Identity/policymgmt/managingpolicies_topic-To_create_a_policy.htm).

    ```text
    Allow group SquaredUp-ReadOnly to inspect all-resources in tenancy
    Allow group SquaredUp-ReadOnly to read instances in tenancy
    Allow group SquaredUp-ReadOnly to read load-balancers in tenancy
    Allow group SquaredUp-ReadOnly to read metrics in tenancy
    Allow group SquaredUp-ReadOnly to read alarms in tenancy
    Allow group SquaredUp-ReadOnly to read usage-report in tenancy
    Allow group SquaredUp-ReadOnly to read usage-budgets in tenancy
    ```

    In a tenancy that uses identity domains, prefix the group with its domain, e.g. `'Default'/'SquaredUp-ReadOnly'`.

    | Statement | Used for |
    | --------- | -------- |
    | `inspect all-resources` | Listing compartments and resources. It does not allow reading data such as bucket contents. |
    | `read instances` | Compute instance shape, OCPUs and memory. |
    | `read load-balancers` | Listing load balancers, which `inspect` alone does not return. |
    | `read metrics` | Performance metrics. |
    | `read alarms` | Alarm status. |
    | `read usage-report` | Cost and usage. |
    | `read usage-budgets` | Budgets. |

4. Open the user's details page, go to **API keys** and click **Add API key**. Choose **Generate API key pair**, click **Download private key**, then click **Add**. See [Required keys and OCIDs](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm).
5. Copy the values from the **Configuration file preview** that OCI shows into the fields below, and paste the contents of the downloaded private key file into **Private key**.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Tenancy OCID** | The tenancy to monitor. | `tenancy` in the API key's **Configuration file preview**, or **Profile → Tenancy** in the Console. | Yes |
| **User OCID** | The user the API key belongs to. | `user` in the **Configuration file preview**. | Yes |
| **Fingerprint** | Identifies which of the user's API keys signs requests. | `fingerprint` in the **Configuration file preview**, or next to the key under **API keys**. | Yes |
| **Private key** | The private half of the API key, used to sign every request. Paste the whole file, including the `BEGIN` and `END` lines. Passphrase-protected keys are not supported. | The `.pem` file downloaded when the key was added. | Yes |
| **Home region** | The tenancy's home region. Cost, budget and identity requests are sent here; inventory, metrics and alarms cover every subscribed region. | `region` in the **Configuration file preview**, or **Governance & Administration → Tenancy details → Home region**. | Yes |

On save, the plugin signs a request for the tenancy's details. A failure means one of the five values doesn't match the API key, or the key hasn't been added to the user.

## What this plugin monitors

- **Inventory** — compute instances, block and boot volumes, VCNs, subnets, load balancers, network load balancers, Autonomous Databases, DB systems, buckets, Kubernetes clusters, file systems, and Functions applications and functions, across every subscribed region, with their compartment, state and tags.
- **Performance** — CPU, memory, disk, network and load for compute instances; requests, connections and backend health for load balancers; CPU, storage and sessions for Autonomous Databases; size, object count and requests for buckets; invocations and duration for functions; and any other OCI Monitoring metric.
- **Alarms** — the current status of every Monitoring alarm, in every region.
- **Cost and usage** — daily or monthly cost and usage by service, compartment, region, SKU or resource, plus budgets with actual and forecast spend.

The out-of-the-box dashboards include an **Overview** and a **Cost** dashboard, plus perspectives for each **Compartment**, **Region**, **Compute Instance**, **Load Balancer**, **Autonomous Database**, **Bucket** and **Function**.

## Data streams

- **Resources** — resources in a region, optionally filtered to compartment(s). Per region.
- **Compartments** — active compartments, including nested ones. Account-wide.
- **Instance Details** — live shape, OCPUs, memory, placement and state of a compute instance. Per instance.
- **Metrics** — any OCI Monitoring metric by namespace and name, with an optional dimension filter and compartment. Per region.
- **Instance Metrics**, **Load Balancer Metrics**, **Autonomous Database Metrics**, **Bucket Metrics**, **Function Metrics** — a chosen metric and statistic over time. Per object.
- **Alarm Status** — current state, severity and trigger time of each alarm. Per region.
- **Cost and Usage** — cost or usage grouped by up to four of service, compartment, region, SKU and resource, optionally filtered to compartments or resources. Account-wide.
- **Budgets** — each budget's amount, actual spend and forecast spend. Account-wide.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Region** | Identity: `GET /tenancies/{id}/regionSubscriptions` | A region the tenancy is subscribed to. |
| **Compartment** | Identity: `GET /tenancies/{id}` and `GET /compartments` | The root compartment and every active compartment beneath it. |
| **Compute Instance** | Search: `POST /resources` (`instance`) | A virtual machine or bare metal instance. |
| **Block Volume** | Search (`volume`) | A block storage volume. |
| **Boot Volume** | Search (`bootvolume`) | An instance boot volume. |
| **VCN** | Search (`vcn`) | A virtual cloud network. |
| **Subnet** | Search (`subnet`) | A subnet in a VCN. |
| **Load Balancer** | Search (`loadbalancer`) | A flexible load balancer. |
| **Network Load Balancer** | Search (`networkloadbalancer`) | A network load balancer. |
| **Autonomous Database** | Search (`autonomousdatabase`) | An Autonomous Database. |
| **DB System** | Search (`dbsystem`) | A Base Database Service DB system. |
| **Bucket** | Search (`bucket`) | An Object Storage bucket. |
| **Kubernetes Cluster** | Search (`clusterscluster`) | An OKE cluster. |
| **File System** | Search (`filesystem`) | A File Storage file system. |
| **Functions Application** | Search (`functionsapplication`) | A Functions application. |
| **Function** | Search (`functionsfunction`) | A function. |

Resources are imported from every subscribed region, excluding terminated and deleted ones. Each carries its region, compartment, availability domain, state, creation time, and freeform and defined tags.

## Known limitations

- **Commercial cloud only** — government and sovereign realms are not supported.
- **Unencrypted keys only** — passphrase-protected private keys are rejected. Export an unencrypted copy with `openssl pkcs8 -topk8 -nocrypt -in key.pem -out key-unencrypted.pem`.
- **Cost data is daily or monthly** — ranges up to 90 days are daily, longer ranges monthly, so cost timeframes start at the last 7 days. OCI can take up to 48 hours to report cost, so the most recent days may be incomplete.
- **Cost by resource shows resource OCIDs** — OCI's cost data does not include resource names.
- **Budget spend lags** — OCI recalculates budget spend periodically, so a new budget shows no actual or forecast spend at first.
- **Metrics cover the last 90 days** — OCI Monitoring keeps 90 days of data, so metric timeframes stop at last month. New instances take a few minutes to start reporting.
- **Functions metrics in the Metrics stream** — tenancy-wide queries for the `oci_faas` namespace return no data; choose the function's compartment, or use **Function Metrics**.
- **Bucket size metrics are hourly** — **Bucket Metrics** timeframes start at the last 24 hours.
- **Compartment filters are not recursive** — filtering resources or cost to a compartment excludes its child compartments.
- **Saved data sources keep their original setup script** — after a plugin update, open the data source and click **Save** to pick up changes to request signing.
- **Imports run every 12 hours** — new resources appear after the next import; their live data streams are always current.
