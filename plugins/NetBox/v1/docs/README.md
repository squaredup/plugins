Visualize your [NetBox](https://netboxlabs.com/oss/netbox/) source of truth in SquaredUp: device and site inventory, IP prefix capacity, rack space and elevations, power feeds, data quality gaps, circuits, and the change log. Data comes from the [NetBox REST API](https://netboxlabs.com/docs/netbox/integrations/rest-api/) and the [NetBox GraphQL API](https://netboxlabs.com/docs/netbox/integrations/graphql-api/).

## Setup

You need the address of your NetBox instance and an **API token** for a user that can view the objects you want in SquaredUp.

1. Sign in to NetBox in a browser and note the address. Examples: `https://netbox.example.com` for a self-managed instance, or `https://<name>.cloud.netboxapp.com` for NetBox Cloud.
2. Open the user menu (top right) and choose **API Tokens**, then click **Add a token**.
    - On NetBox 4.5 and later, create a **v2** token. NetBox shows the full token as `Bearer nbt_<key>.<secret>`. v1 tokens still work, but they are deprecated and will be removed in a future NetBox release.
    - Leave **Write enabled** unticked. The plugin only reads data.
    - If you set **Allowed IPs**, include the addresses SquaredUp connects from, or the on-premises agent's address.
3. Copy the values immediately. NetBox shows the secret only once.
4. In SquaredUp, enter the address in **NetBox URL**, choose the **Token version**, and paste the token into **Token** exactly as NetBox shows it. Including the leading `Bearer` is fine.

The token inherits the permissions of the user that owns it. Objects the user cannot view are not imported.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **NetBox URL** | The address of the NetBox instance. Do not include `/api`. If you do, it is removed automatically. | The address bar when NetBox is open in a browser. | Yes |
| **Token version** | The NetBox API token format. **v2** sends `Authorization: Bearer nbt_<key>.<token>`. **v1** sends `Authorization: Token <token>`. | v2 tokens require NetBox 4.5 or later. | Yes |
| **Token** | The API token. For v2, paste the full value NetBox shows (`Bearer nbt_<key>.<secret>`). The `Bearer` prefix is optional. For v1, paste the 40-character token. | NetBox → user menu → **API Tokens**. | Yes |
| **Key** | The public key of a v2 token. Only needed if **Token** contains just the secret, without the `nbt_<key>.` prefix. Shown only when **Token version** is v2. | NetBox → user menu → **API Tokens**. | No |
| **Ignore certificate errors** | Skips TLS certificate validation. Only tick this for self-managed instances that use a self-signed or private CA certificate (common on new NetBox Enterprise installs). | n/a | No |

When you save, the plugin checks two things:
1. It calls the NetBox status endpoint. A failure here means the address is unreachable, the token is invalid, expired or disabled, or the token's **Allowed IPs** blocks SquaredUp.
2. It reads the list of sites. A warning here means the token's user can't view DCIM objects.

## What this plugin monitors

The plugin works with **NetBox Community**, **NetBox Enterprise**, and **NetBox Cloud**. All three expose the same APIs, so no edition-specific setup is needed. NetBox records the intended state of your network, not live health, so the dashboards show inventory, capacity and lifecycle rather than up/down status.

- **Inventory**: sites, racks, devices, virtual machines, circuits and IP addresses. This covers status, role, manufacturer, model, platform, tenant and location.
- **IP capacity**: prefix utilization, calculated the same way as NetBox. Containers count their child prefixes, pools count their full size, and prefixes marked as utilized count as full. VLAN group utilization is also shown.
- **Rack capacity**:
  - Rack space used and available per rack and per site, counting both faces.
  - A unit-by-unit rack elevation listing for one rack or every rack at a site, including empty units, multi-unit devices and a role filter.
- **Power**: power feeds by site, rack and panel, with voltage, amperage, phase and available power in kVA.
- **Data quality**:
  - Devices missing a serial number, primary IP, tenant or platform.
  - Devices not updated in over a year.
  - Unassigned IP addresses.
- **Lifecycle**: devices and virtual machines that aren't active (planned, staged, offline, decommissioning), and circuit termination dates.
- **Change activity**: the NetBox change log by user, action and object type over time.
- **Custom fields**: every custom field on sites, racks, devices, virtual machines, prefixes, circuits, IP addresses and power feeds appears as an extra column.

**Dashboards.** The out-of-the-box dashboards are **Overview**, **IPAM Capacity**, **Rack Capacity**, **Data Quality**, **Lifecycle and Circuits**, **Change Activity**, **Data Centers** (including a map of sites), **Power**, and **Device Inventory**. There is also a perspective dashboard for each **Site**, **Rack**, **Device**, **Virtual Machine**, **Prefix** and **Circuit**.

**Comparing NetBox with monitoring data.** Device and virtual machine objects carry their name and primary IP address (without the mask). You can use them to compare NetBox's intended inventory with what other SquaredUp data sources actually monitor, for example by joining the **Devices** stream with a monitoring stream on name or IP in a dashboard tile.

## Data streams

- **Sites**: every site with status, region, site group, tenant, facility, coordinates, object counts and custom fields. Account-wide.
- **Racks**: every rack with site, location, status, role, height and device count. Account-wide, with an optional **Site** filter.
- **Devices**: every device with status, role, manufacturer, model, platform, site, rack and position, serial, tenant, primary IP and data-quality flags. Account-wide, with optional **Site**, **Rack** and **Role(s)** filters.
- **Virtual Machines**: every virtual machine with status, cluster, site, role, platform, vCPUs, memory, disk and primary IP. Account-wide, with an optional **Site** filter.
- **Prefixes**: every IP prefix with VRF, scope, status, role, VLAN and pool settings. Account-wide, with an optional **Site** filter.
- **Prefix Utilization**: used and total addresses and utilization % for each selected prefix. Per prefix.
- **IP Addresses**: IP addresses with VRF, status, role, DNS name and the device or virtual machine they're assigned to.
  - Account-wide.
  - Optional filters: **Prefix**, **Device**, **Virtual machine**, **Assignment** (assigned or unassigned) and **Status**.
- **VLAN Groups**: VLAN groups with scope, VLAN ID ranges and utilization. Account-wide.
- **Circuits**: circuits with provider, type, status, commit rate, terminations, and install and termination dates. Account-wide.
- **Device Interfaces**: interfaces on the selected devices, with type, enabled state, speed, MTU, VLAN mode, cabling and what each is connected to. Per device.
- **Rack Utilization**: rack units used and available per rack, counting both faces. Account-wide, with optional **Site** and **Rack** filters.
- **Rack Elevation**: one row per rack unit from the top down, with the device, role, type, manufacturer, face and height at that unit, including empty units. Account-wide, with optional **Site**, **Rack** and **Role** filters.
- **Power Feeds**: power feeds with site, rack, panel, status, type, supply, phase, voltage, amperage, maximum utilization and available power in kVA. Account-wide, with an optional **Site** filter.
- **Change Log**: changes recorded in NetBox, with time, user, action and object.
  - Account-wide, for timeframes up to 30 days.
  - Optional filters: an **Object**, **Action** or **Object type**.
- **Instance Status**: the NetBox version, number of installed plugins and number of background workers.
- **GraphQL Query**: runs a NetBox GraphQL query you write and returns one row per item in the first list in the result, with nested fields flattened into columns.
  - Use it for views the other streams don't cover.
  - Build and test queries in NetBox's GraphiQL explorer at `https://<your-netbox>/graphql/`.
  - Add `pagination: { limit: 1000, offset: 0 }` to lists that may be longer than 1,000 items.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Site** | `GET /api/dcim/sites/` | A NetBox site (data centre, office or campus). |
| **Rack** | `GET /api/dcim/racks/` | An equipment rack. |
| **Device** | `GET /api/dcim/devices/` | A physical device, such as a switch, router, server or PDU. |
| **Virtual Machine** | `GET /api/virtualization/virtual-machines/` | A virtual machine. |
| **Prefix** | `GET /api/ipam/prefixes/` | An IPv4 or IPv6 prefix, in a VRF or the global table. |
| **Circuit** | `GET /api/circuits/circuits/` | A carrier circuit. |

Each object is identified by its NetBox ID and keeps key properties such as status, site, role and tenant. Each also keeps a link back to the object in NetBox.

Imports run every 12 hours by default. Dashboard tiles query NetBox live, but SquaredUp caches results briefly, so use the dashboard's refresh button to see a change straight away.

## Known limitations

- **Read-only.** The plugin never creates, changes or deletes anything in NetBox.
- **Prefix utilization makes one request per prefix.**
  - NetBox's API has no utilization or IP-count field, so each prefix is calculated with its own request.
  - Tiles that show many prefixes take longer on large NetBox instances. The IPAM Capacity dashboard keeps this to a single tile.
  - IP ranges marked as populated aren't counted, so such prefixes can read lower than in NetBox.
  - A container prefix with more than 1,000 child prefixes is under-counted.
- **Large lists.** List streams return every matching object. On very large instances (many thousands of devices or IP addresses), use the Site, Prefix, Status or Assignment filters to keep tiles within SquaredUp's response size limit.
- **GraphQL lists stop at 1,000 items.** NetBox returns at most 1,000 items per GraphQL list, even when a higher limit is requested.
  - The plugin's own GraphQL streams (Rack Utilization, Rack Elevation and Power Feeds) page through results automatically.
  - Queries in the **GraphQL Query** stream must add `pagination` themselves.
- **Rack space.**
  - Utilization counts a unit as used if a device occupies it on either face.
  - 0U devices and devices in device bays don't use rack units. Rack Elevation lists them after the units.
- **Power.** Available power is the feed's rated capacity (voltage × amperage × maximum utilization, adjusted for three-phase). NetBox doesn't record live power draw. If you track actual load in a custom field, it appears as a column.
- **Site map.**
  - Sites appear on the Data Centers map only if their latitude and longitude are set in NetBox. NetBox doesn't convert addresses into coordinates.
  - The map uses SmartViz Geo Map. Until it's available in your SquaredUp region, the tile shows a table of sites instead.
- **Change log.** Available for up to 30 days at a time. On busy instances, filter by object, action or object type.
- **Reconnecting after plugin updates.** If a plugin update changes how SquaredUp connects to NetBox, open the data source and save it again.
- **NetBox version.**
  - Built for NetBox 4.x and tested with NetBox 4.7.
  - v2 tokens need NetBox 4.5 or later.
  - On older 4.x releases, check the Change Log stream and the GraphQL-based streams (Rack Utilization, Rack Elevation, Power Feeds). They depend on the current change log API location and GraphQL filter syntax.
