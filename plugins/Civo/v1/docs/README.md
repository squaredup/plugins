## Setup

1. Sign in to your [Civo](https://www.civo.com) account and open **Account → Settings → Security** (<https://dashboard.civo.com/security>).
2. Under **API keys**, copy your existing key or click **Regenerate** to create a new one.
3. Paste the key value into the **API key** field when adding this plugin in SquaredUp.
4. Choose the **Region** you want this connection to monitor (e.g. `LON1`, `NYC1`, `FRA1`, `PHX1`). You can pick from the list or type a custom region code (for CivoStack / private regions).

> **One connection = one region.** Civo's Kubernetes and Object Store list endpoints are region-specific, so each configured plugin instance monitors a single region. To monitor resources in more than one region, add the plugin once per region — each appears as its own data source in SquaredUp.

## Configuration fields

| Field       | Required | Description                                                                                     | Where to find it                                                            |
| ----------- | -------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **API key** | Yes      | The Civo API key used to authenticate. Sent as a bearer token (`Authorization`) on every request. | Civo dashboard → Account → Settings → Security → API keys.                   |
| **Region**  | Yes      | The Civo region this connection monitors (e.g. `LON1`). Applied to all region-scoped resources.  | Civo dashboard, or run the built-in **Regions** data stream after connecting. |

## What is monitored

Monitors your [Civo](https://www.civo.com) managed Kubernetes platform in SquaredUp. This plugin connects to the Civo REST API (`https://api.civo.com/v2`) to import your infrastructure as objects you can scope dashboards to, and provides data streams for cluster health, resource usage, quota, and account-wide billing usage.

- **Kubernetes clusters** — your managed clusters, including status, Kubernetes/K3s version, node count, node size, and installed applications. Imported as objects.
- **Instances** — compute VMs (which also back cluster nodes), including status, size, CPU/RAM/disk, and public/private IPs. Imported as objects.
- **Volumes** — block storage volumes, including size, status, and attachment. Imported as objects.
- **Object stores** — S3-compatible buckets, including status, size, and endpoint. Imported as objects.
- **Networks** — VPC networks, including CIDR, label, and status. Imported as objects.
- **Quota** — current account resource usage against limits (instances, CPU, RAM, disk, public IPs, clusters, and more). Available as a data stream.
- **Billing / usage** — account-wide usage charges broken down by service and region over a chosen time range. Available as a data stream. See _Known limitations_ for what the API exposes.
- **Regions** — the Civo regions available to your account and their capabilities (IaaS, Kubernetes). Available as a data stream.

## What gets indexed

The plugin imports five object types into the SquaredUp graph (each keyed on its raw Civo UUID) for the configured region:

- **Civo Cluster** — one object per managed Kubernetes cluster.
- **Civo Instance** — one object per compute instance.
- **Civo Volume** — one object per block storage volume.
- **Civo Object Store** — one object per S3-compatible bucket.
- **Civo Network** — one object per VPC network.

Quota, billing/usage, and regions are provided as **data streams** (not indexed objects) — query them on dashboards.

## Known limitations

- **One connection = one region.** Each configured plugin instance monitors a single Civo region (see _Setup_). Add the plugin once per region to cover several.
- **Billing is usage, not currency.** Civo's `/charges` endpoint returns metered **usage** (billable hours per resource, and GB for volumes) per service and region — it does **not** return monetary amounts through the public API. Dashboards therefore show usage hours/size, not a dollar/pound figure.
- **Billing range is capped at 31 days.** The `/charges` endpoint accepts a maximum 31-day window, so the billing stream's timeframes are limited to ranges within that (up to _Last 30 days_ / _This month_ / _Last month_).
- **Estimated cost is indicative, not your invoice.** Civo's API returns usage only, so the "Estimated Cost" tiles multiply usage by Civo's public list prices held in the plugin. They **exclude** credits, discounts, free-tier allowances, minimums and bandwidth, and the built-in price table may drift when Civo changes prices. Treat these figures as a rough guide, not a bill. Prices are applied flat across regions.
- **Resource lists are capped at 100 per region.** Clusters, instances and object stores are fetched in a single request of up to 100 items each (Civo's pagination cannot be walked reliably), so an account with more than 100 of one of those types in a single region would not show the surplus. Volumes and networks are not affected.
- **Read-only.** The plugin only reads data; it does not create, scale, or delete Civo resources.
- **API key scope.** The API key has full account access; the data returned reflects everything the key's account can see in the selected region.
