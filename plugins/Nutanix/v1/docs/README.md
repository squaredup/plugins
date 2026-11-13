Monitor the health, capacity and performance of your [Nutanix](https://www.nutanix.com) clusters, hosts, VMs and storage containers in SquaredUp, through the [Prism Central v4 APIs](https://developers.nutanix.com/).

> ⚠️ Requires **Prism Central 2024.3** or later, which is when the v4 APIs became generally available. Connect the plugin to Prism Central, not to a cluster's Prism Element.

## Setup

Prism Central usually runs on a private network, which SquaredUp's cloud can't reach. Add the data source through a **relay agent** that can reach Prism Central on port 9440.

You will need either an **API key** for a Prism Central service account (recommended), or a Prism Central **username and password**.

1. Sign in to Prism Central as an administrator.
2. Go to **Admin Center → IAM → Service Accounts** and create a service account for SquaredUp.
3. Assign it a read-only role, such as **Prism Viewer**, that covers the clusters you want to monitor.
4. Create an **API key** for the service account and copy it. The key is shown only once.
5. In SquaredUp, enter the **Prism Central URL**, choose **API key (service account)**, and paste the key into **API key**.

Prism Central uses a self-signed certificate by default. If yours does, turn on **Ignore certificate errors**, or install a certificate the relay agent trusts.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Prism Central URL** | The address of Prism Central, including the port, e.g. `https://prism-central.example.com:9440`. | The address you use to open Prism Central in a browser. | Yes |
| **Authentication** | How the plugin signs in: **API key (service account)** or **Username and password**. | — | Yes |
| **API key** | A service account's API key, sent in the `X-ntnx-api-key` header. | Prism Central → **Admin Center → IAM → Service Accounts**. | With API key |
| **Username** | A Prism Central user with read-only access. | Prism Central → **Admin Center → IAM**. | With username and password |
| **Password** | The password for **Username**. | — | With username and password |

On save, the plugin reads one cluster from Prism Central to check the URL and credentials. If that fails, check that the relay agent can reach Prism Central, that the credentials are valid, and whether **Ignore certificate errors** is needed.

## What this plugin monitors

- **Cluster health and resilience**: availability, operation mode, fault tolerance against the desired level, NCC health score, AOS version and upgrade status.
- **Performance**: CPU, memory, controller IOPS, latency and bandwidth for clusters, hosts, VMs and storage containers, including VM CPU ready time.
- **Capacity**: storage used, free and total per cluster and storage container, data reduction savings, and the vCPUs and memory allocated to VMs against host capacity.
- **Alerts**: open Prism Central alerts by severity, with the affected entity, impact and the possible cause Nutanix suggests.
- **Inventory**: hosts, VMs and storage containers with their hardware, placement, guest OS, IP addresses and configuration.

The out-of-the-box dashboards include an estate-wide **Overview** and a **Capacity** dashboard, plus a perspective for each **Cluster**, **Host**, **VM** and **Storage Container**.

## Data streams

- **Clusters**: every cluster with its status, AOS version, node and VM counts and resilience.
- **Hosts**: every host with its hypervisor, hardware, CVM address and status. Can be filtered to clusters.
- **VMs**: every AHV VM with its power state, sizing, placement, guest OS and IP addresses. Can be filtered to clusters or hosts.
- **Storage Containers**: every storage container with its capacity, replication factor and data reduction settings. Can be filtered to clusters.
- **Alerts**: open alerts, or all alerts raised in the timeframe. Can be filtered to clusters, hosts, VMs or storage containers.
- **Top VMs**: the busiest VMs over the timeframe, ranked by CPU, memory, CPU ready, IOPS or latency. Can be filtered to clusters.
- **Cluster Performance**, **Host Performance**, **VM Performance**, **Storage Container Performance**: utilisation, IOPS, latency, bandwidth and capacity over time for each selected object. Each can be summarised to one row per object (average, peak or latest).

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Cluster** | `GET /api/clustermgmt/v4.0/config/clusters` | A Nutanix cluster registered to Prism Central. Prism Central's own entry is left out. |
| **Host** | `GET /api/clustermgmt/v4.0/config/hosts` | A node in a cluster. |
| **VM** | `GET /api/vmm/v4.0/ahv/config/vms` | An AHV virtual machine. |
| **Storage Container** | `GET /api/clustermgmt/v4.0/config/storage-containers` | A storage container. Nutanix-managed system containers are left out. |

**Relationships:** each host and storage container links to its cluster, and each VM links to its cluster and to the host it runs on.

## Known limitations

- **Prism Central 2024.3 or later, AHV only**: the plugin uses the v4 APIs, so older Prism Central versions aren't supported. VMs on ESXi clusters aren't imported.
- **Rate limits**: Prism Central limits API requests by its size. The VM and alert APIs allow as few as 2 requests a second on small deployments, so dashboards with many per-object tiles can load slowly.
- **Per-object performance requests**: cluster, host, storage container and VM performance are fetched with one request per object. Scope those tiles to the objects you need rather than to every host or VM.
- **All alerts in a timeframe**: Prism Central can't filter alerts by time, so showing all alerts reads every alert and keeps those raised in the timeframe. That can be slow when Prism Central holds a long alert history. Open alerts aren't affected.
- **Large estates**: VMs are imported 100 at a time, so very large estates (roughly 15,000 VMs or more across everything imported) may not finish importing.
