Monitor the power, cooling and environmental devices managed by [EcoStruxure IT Data Center Expert](https://www.se.com/ww/en/product-range/61851-ecostruxure-it-data-center-expert/) (formerly StruxureWare Data Center Expert) in SquaredUp. The plugin covers device health, live sensor readings and history, and active and historical alarms, using the Data Center Expert REST API.

> ⚠️ Data Center Expert is usually installed on-premises. If SquaredUp cannot reach the server directly, add this plugin through a [SquaredUp relay agent](https://docs.squaredup.com/features/connect-and-explore/relay-agents) that can.

## Setup

You will need a Data Center Expert **user account** and network access to the server's web interface (HTTPS).

1. Sign in to the Data Center Expert client as an administrator and create (or choose) a user for SquaredUp. Give it access to the **device groups** you want to monitor. The plugin only reads data, so a view-only user is enough.
2. Check the REST API is available by browsing to `https://<your-dce-server>/isxg/dce-rest-api.html`. You should see the **DCE REST API UI** page. Optionally, click **Authorize** and sign in with the new user to confirm the credentials work.
3. In SquaredUp, enter the server address in **Server URL**, and the user's credentials in **Username** and **Password**.
4. If the server uses a self-signed certificate (the default for Data Center Expert), tick **Ignore certificate errors**.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Server URL** | Address of the Data Center Expert server, for example `https://dce.example.com`. The `/isxg` REST API path is added automatically. | The address you use to open the Data Center Expert web interface. | Yes |
| **Username** | Data Center Expert user the plugin signs in as. | Data Center Expert client → user management. | Yes |
| **Password** | Password for that user. | Set when the user is created. | Yes |
| **Ignore certificate errors** | Skips HTTPS certificate checks. | Tick this when the server uses a self-signed certificate. | No |
| **OAuth client ID** | OAuth client sent when requesting an access token. Leave blank unless sign-in fails (see below). | See [If sign-in fails](#if-sign-in-fails). | No |
| **OAuth client secret** | Secret for the OAuth client above. | See [If sign-in fails](#if-sign-in-fails). | No |

On save, the plugin signs in to Data Center Expert and reads the top-level device group, then checks that at least one device is visible. If the first check fails, the server address, credentials or certificate setting is wrong. If the second check fails, the user has no access to any device groups.

### If sign-in fails

The plugin gets a short-lived access token from `https://<server>/isxg/oauth/token` using the username and password. Some Data Center Expert versions may also need an OAuth client ID and secret. If setup fails with a valid username and password:

1. Open `https://<your-dce-server>/isxg/js/springfox-dce.js` in a browser.
2. Search the file for `client` or `Basic` to find the client ID and secret the API page itself uses.
3. Enter them in **OAuth client ID** and **OAuth client secret** under **Advanced**.

## What this plugin monitors

- **Device health**: the status of every UPS, PDU, cooling unit, NetBotz appliance and other device in Data Center Expert, plus model, serial number, IP address and maintenance state.
- **Sensors**: current readings such as temperature, humidity, power, current and door state, with status and units. History is available for any sensor.
- **Alarms**: active alarms with severity and recommended action, resolved alarm history, and alarm counts by device group.
- **Event log**: Data Center Expert's own event log messages.

The out-of-the-box dashboards include a **Data Center Overview**, plus perspectives for each **Device**, **Sensor** and **Device Group**.

## Data streams

- **Devices**: every device with its current status, model and network details (account-wide).
- **Device Groups**: every device group with status and device count (account-wide).
- **Device Group Devices**: devices in a selected device group, including its sub-groups (per device group).
- **Sensors**: current reading and status of every sensor, optionally filtered by device and sensor kind.
- **Sensor History**: readings over time for the selected sensors (per sensor).
- **Active Alarms**: currently active alarms, optionally filtered by device.
- **Alarm History**: resolved alarms that started within the timeframe, optionally filtered by device.
- **Alarm Summary**: active alarm counts by severity per device group, optionally filtered by device group.
- **Event Log**: the newest 1,000 Data Center Expert event log messages in the timeframe (account-wide).

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Device** | `GET /v1/devices` | A managed device such as a UPS, PDU, cooling unit or NetBotz appliance. |
| **Device Group** | `GET /v1/deviceGroups` | A device group from the Data Center Expert group tree. |
| **Sensor** | `GET /v1/devices/sensors` | A single sensor on a device, for example a temperature probe or an output current reading. |

**Relationships:** each Sensor stores its parent device's ID (`deviceGuid`), each Device stores its parent device's ID (`parentGuid`), and each Device Group stores its parent group's ID (`parentIsxcGuid`).

## Known limitations

- **Strict rate limit**: Data Center Expert allows only 5 requests per minute for each API area (devices, device groups, alarms, sensors, event log). Each tile makes one request, so a dashboard with many Data Center Expert tiles, or several dashboards refreshing at once, can be throttled. Throttled tiles show a rate-limit message and load again on the next refresh.
- **Large estates**: sensors are read in a single request for the whole server. Very large installations (many thousands of sensors) may exceed SquaredUp's response size limit.
- **Sensor history is downsampled** over long timeframes: a tile returns at most 20,000 readings in total, shared across its sensors. Beyond that, numeric readings are averaged into time buckets, and state readings (such as door open or closed) are reduced to the points where the state changed. If a sensor has more state changes than its share of the limit, the changes are sampled evenly, so some changes may not be shown.
- **Sensor names are not unique**: a sensor is named as it appears in Data Center Expert (for example "Temperature"), so search results show many sensors with the same name. Drill down from a device to find its sensors.
- **Units follow the server locale**: readings use the Data Center Expert server's default locale (metric or US units).
- **Read-only**: the plugin never acknowledges alarms, changes device controls, or modifies anything in Data Center Expert.
