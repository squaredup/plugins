Track your [Device42](https://www.device42.com/) CMDB in SquaredUp: device inventory, data center buildings and rack capacity, IPv4 subnet utilization, hardware end-of-life, business applications and newly discovered devices. Data comes from the [Device42 REST API](https://api.device42.com/) and [DOQL](https://docs.device42.com/reports/device42-doql/), Device42's read-only SQL query interface.

## Setup

You need the URL of your Device42 appliance and an **API client** (a client key and secret) created in Device42.

1. Sign in to your Device42 appliance as an administrator.
2. Open **Resources > Secrets > API Clients** and create an API client. On older Device42 versions, API clients are under **Tools > Admins & Permissions**.
3. Set **Resource Owner** to a Device42 user that can view everything you want in SquaredUp. The plugin reads with that user's permissions, so a read-only user is enough. Give it view permission for devices, buildings, rooms, racks, customers, business applications, subnets and IP addresses. Leave **Superuser Status** off unless you want SquaredUp to see everything.
4. Make sure **Active** is on, and save. Any **Token Time to Live** works: the plugin renews its token automatically.
5. Copy the **Client Key** and the client secret into the fields below.
6. If your Device42 appliance isn't reachable from the internet, turn on **Via relay agent** and choose the agent group of a [relay agent](https://docs.squaredup.com/features/connect-and-explore/relay-agents/configuring-an-agent-windows-platforms) that can reach it.

> ⚠️ **Internal certificates and relay agents.** If the appliance uses a certificate from an internal CA, or doesn't send its intermediate certificate, the relay agent can fail with "unable to verify the first certificate", even with **Ignore certificate errors** on, because that setting doesn't yet apply to the plugin's token request. Fix the certificate chain on the appliance, or make the relay agent's Node.js trust it by setting the `NODE_EXTRA_CA_CERTS` environment variable on the relay agent service to a file containing the issuing and root certificates, then restart the service.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Device42 URL** | The address of your Device42 appliance, for example `https://device42.example.com`. | The address you use to sign in to Device42. | Yes |
| **API Client Key** | Identifies the API client. The plugin exchanges the key and secret for a short-lived token. | Device42 → **Resources > Secrets > API Clients** → **Client Key**. | Yes |
| **API Client Secret** | The secret shown when the API client was created. | Shown once when you create the API client. | Yes |

When you save, the plugin fetches one building from Device42. If that fails, check the URL, that the API client is **Active** and not **Locked**, and that its resource owner can view buildings.

## What this plugin monitors

- **Inventory** — every device with its type, operating system, hardware model, manufacturer, service level, customer and location, and device counts broken down any of those ways.
- **Change** — devices first added to Device42 in a chosen timeframe.
- **Data center capacity** — buildings, rooms and racks, with each rack's free and used rack units.
- **IP address management** — the most utilized IPv4 subnets, with capacity, used and free addresses.
- **Hardware lifecycle** — hardware models in use with their end-of-life and end-of-support dates.
- **Business applications** — criticality, type, service level, owners and data sensitivity.
- **Anything else in Device42** — the **DOQL Query** stream runs a query you write.

The out-of-the-box dashboards include an **Overview** and perspectives for each **Building**, **Rack**, **Customer** and **Device**.

## Data streams

- **Devices** — devices with hardware, operating system, location and service details, up to 2,000 rows sorted by name. Filter by device type, building, customer, rack or device. When filtered to specific devices, it also returns IP addresses, CPUs, memory, asset number and dates.
- **Device Summary** — device counts grouped by type, operating system, building, customer, service level, hardware model, manufacturer or service status. Filter by device type, building, customer or rack. Counts cover every device, with no row limit.
- **New Devices** — devices first added during the timeframe, up to 5,000 rows. Filter by device type, building or customer.
- **Hardware Lifecycle** — hardware models in use, with device counts, end-of-life and end-of-support dates, and a lifecycle status. Filter by device type, building or customer.
- **Subnet Utilization** — the 1,000 most utilized IPv4 subnets, with capacity, used and free addresses. Set **Minimum size** to leave out small subnets such as /30 links.
- **Racks** — racks with location, size, and free and used rack units. Filter by one building.
- **Rooms** — rooms and their building. Filter by one building.
- **Buildings** — buildings with address and contact.
- **Customers** — customers with contact details.
- **Business Applications** — business applications with criticality, type, service level, owners and data sensitivity.
- **DOQL Query** — the results of a DOQL query you write.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Device** | `GET /api/1.0/devices/all/` | A physical, virtual, cluster or other device, with its type, operating system, hardware, service level, customer and location as properties. |
| **Building** | `GET /api/1.0/buildings/` | A building or site. |
| **Room** | `GET /api/1.0/rooms/` | A room within a building. |
| **Rack** | `GET /api/1.0/racks/` | A rack, with its building, room, row and size. |
| **Customer** | `GET /api/1.0/customers/` | A customer, department or tenant that devices belong to. |
| **Business Application** | `GET /api/1.0/businessapps/` | A business application, with its criticality, owners and service level. |

Objects are re-imported every 12 hours.

## Known limitations

- **Row limits on lists** — **Devices** returns at most 2,000 rows and **New Devices** at most 5,000, sorted. Use the filters to narrow large estates, and use **Device Summary** for counts, which has no limit.
- **Subnet Utilization** returns only the 1,000 most utilized IPv4 subnets. IPv6 subnets aren't included. Used addresses are the IP addresses recorded in Device42 for the subnet that aren't marked available.
- **Permissions decide what you see** — the plugin sees only what the API client's resource owner can view. If a dashboard is empty or a stream returns "You don't have permissions to access this resource", grant that user view permission for the object type.
- **Hardware lifecycle dates** come from the hardware models in Device42. Models without dates show "No dates recorded".
- **Data freshness** — data is as current as Device42's own discovery. Imported objects refresh every 12 hours.
- **Read-only** — the plugin never creates, changes or deletes anything in Device42. DOQL queries are read-only.

## Acknowledgements

Built with **John Butler**, who wrote the first version of this plugin and tested every version against a live Device42 appliance behind a relay agent. The authentication, certificate and permission guidance above comes from what he worked through, rather than from assumptions.
