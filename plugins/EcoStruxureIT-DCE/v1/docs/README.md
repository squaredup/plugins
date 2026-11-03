Monitor the power, cooling and environmental devices managed by [EcoStruxure IT Data Center Expert](https://www.se.com/ww/en/product-range/61851-ecostruxure-it-data-center-expert/) (formerly StruxureWare Data Center Expert) in SquaredUp. The plugin covers device health, live sensor readings and history, and active and historical alarms, using the Data Center Expert REST API.

> ⚠️ Data Center Expert is usually installed on-premises. If SquaredUp cannot reach the server directly, add this plugin through a [SquaredUp relay agent](https://docs.squaredup.com/features/connect-and-explore/relay-agents) that can.

## Setup

You will need a Data Center Expert **user account** and network access to the server's web interface (HTTPS).

1. Sign in to the Data Center Expert client as an administrator and create (or choose) a user for SquaredUp. Give it access to the **device groups** you want to monitor. The plugin only reads data, so a view-only user is enough.
2. Check the REST API is available by browsing to `https://<your-dce-server>/isxg/dce-rest-api.html`. You should see the **DCE REST API UI** page. Optionally, click **Authorize** and sign in with the new user to confirm the credentials work.
3. In SquaredUp, enter the server address in **Server URL**, and the user's credentials in **Username** and **Password**.
4. If the server uses a self-signed certificate (the default for Data Center Expert), turn on **Ignore certificate errors**.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Server URL** | Address of the Data Center Expert server, for example `https://dce.example.com`. The `/isxg` REST API path is added automatically, and anything after `/isxg` (such as `/isxg/dce-rest-api.html`) is ignored. | The address you use to open the Data Center Expert web interface. | Yes |
| **Username** | Data Center Expert user the plugin signs in as. | Data Center Expert client → user management. | Yes |
| **Password** | Password for that user. | Set when the user is created. | Yes |
| **Ignore certificate errors** | Skips HTTPS certificate checks. | Turn this on when the server uses a self-signed certificate. | No |
| **OAuth client ID** | OAuth client sent when requesting an access token. Leave blank unless sign-in fails with valid credentials. | See [If sign-in fails with valid credentials](#if-sign-in-fails-with-valid-credentials). | No |
| **OAuth client secret** | Secret for the OAuth client above. | See [If sign-in fails with valid credentials](#if-sign-in-fails-with-valid-credentials). | No |
| **Import sensors** | Imports every sensor as an object, for the **Sensor** dashboard and sensor history. Off by default. | Turn on only for smaller installations; see [Known limitations](#known-limitations). | No |

On save, the plugin signs in to Data Center Expert and reads the top-level device group, then checks that at least one device is visible. If the first check fails, see [Troubleshooting](#troubleshooting). If only the second check fails, the user has no access to any device groups.

### Troubleshooting

The setup checks show only a summary. When the plugin connects through a relay agent, the agent's log records the actual error:

1. On the relay agent machine, open `Agent\appsettings.json` in the agent's install folder and set `"LogLevel": "Debug"`. The agent picks up the change without a restart. While Debug is on, the log records the Data Center Expert password in plain text (see step 5).
2. In SquaredUp, click **Rerun tests** on the data source.
3. Open the newest log file in `Agent\transient\logs` (named `SquaredUpCloudLog-<date>.log`). The log doesn't name the plugin (every request shows as `WebAPIOnPremise`), so find this plugin's requests by searching for `/isxg/` or the server's address, which appear in lines like `Calling token URL: https://<server>/isxg/oauth/token`.
4. Note that line's `CorrelationId` up to the last `-` (for example `FqINBh87IAMEcmg=`) and search for it. This shows every line for that request, including `Plugin reported error` and `original error:` lines with the underlying error.
5. Set `"LogLevel"` back to `"Information"` when you're done, then delete the log files written while Debug was on. Turning Debug off doesn't remove what's already logged, and when **OAuth client ID** is blank those files contain the password in the token URL (see [Known limitations](#known-limitations)). If you need to share a log, remove the `Calling token URL` lines first. If a log has already been copied or shared, change the Data Center Expert user's password.

If more than one relay agent is installed on the machine, each has its own install folder. Each log line names the agent group it served (`AgentGroup: "..."`), so check the log of the agent in the data source's agent group.

| Error | Likely cause |
| ----- | ------------ |
| `Request to …/oauth/token failed with status 400` or `401` | The username or password is wrong, or the user may not use the REST API. If **OAuth client ID** is filled in, also check it's correct. |
| `invalid_client` / `Given client ID does not match authenticated client` | An **OAuth client ID** was sent that this server doesn't expect. Leave **OAuth client ID** and **OAuth client secret** blank unless the server requires them. |
| `self-signed certificate`, `unable to verify the first certificate` or another certificate error | Turn on **Ignore certificate errors**. |
| `ECONNREFUSED`, `ETIMEDOUT` or `ENOTFOUND` | The relay agent machine can't reach the server. Check the Server URL and any firewalls in between. |
| `Invalid URL` | The Server URL isn't a full address. Include `https://`. |
| `429` | Data Center Expert's rate limit was reached. Wait a minute and rerun the tests. |

To check the username and password independently of SquaredUp, run this in PowerShell 7 (`pwsh`) on the relay agent machine. It prompts for the username and password, so the password isn't typed into the command or saved in PowerShell's history. A reply showing an `access_token` means the credentials work:

```powershell
$cred = Get-Credential -Message "Data Center Expert user"
$body = @{ grant_type = "password"; username = $cred.UserName; password = $cred.GetNetworkCredential().Password }
Invoke-RestMethod -Method Post -Uri "https://<your-dce-server>/isxg/oauth/token" -Body $body -SkipCertificateCheck
```

`-SkipCertificateCheck` turns off certificate verification, matching **Ignore certificate errors**, so the check works against Data Center Expert's default self-signed certificate. If the server has a certificate the relay agent machine trusts, leave it out so the certificate is checked too. Windows PowerShell 5.1 doesn't have `-SkipCertificateCheck`, so there the check only works against a trusted certificate.

#### If sign-in fails with valid credentials

The plugin gets a short-lived access token from `https://<server>/isxg/oauth/token` using the username and password, without an OAuth client. Some Data Center Expert versions may need an OAuth client ID and secret instead:

1. Open `https://<your-dce-server>/isxg/js/springfox-dce.js` in a browser.
2. Search the file for `client` or `Basic` to find the client ID and secret the API page itself uses.
3. Enter them in **OAuth client ID** and **OAuth client secret** under **Advanced**.

## What this plugin monitors

- **Device health**: the status of every UPS, PDU, cooling unit, NetBotz appliance and other device in Data Center Expert, plus model, serial number, IP address and maintenance state.
- **Environmental conditions**: temperature, humidity, dew point, airflow, leak and door readings for each device, with their history, and environmental alarms across the whole installation.
- **Sensors**: current readings such as temperature, humidity, power, current and door state, with status and units. Each sensor and alarm is categorised as **Environmental**, **Power** or **Other**.
- **Alarms**: active alarms with severity and recommended action, resolved alarm history, and alarm counts by device group.
- **Event log**: Data Center Expert's own event log messages.

The out-of-the-box dashboards include a **Data Center Overview** (with environmental alarms), plus perspectives for each **Device** (with environmental readings and history), **UPS** (battery, load, runtime and voltage), **Rack PDU** (power, current by phase and bank, outlet states), **Environmental** (NetBotz and other environmental monitors: temperature and humidity against ASHRAE ranges, door and sensor states), **Sensor** and **Device Group**. A UPS, rack PDU or environmental monitor shows the **Device** perspective as well as its own.

## Data streams

- **Devices**: every device with its current status, model and network details (account-wide).
- **Device Groups**: every device group with status and device count (account-wide).
- **Device Group Devices**: devices in a selected device group, including its sub-groups (per device group).
- **Sensors**: current reading, status and category of every sensor, optionally filtered by device and sensor kind.
- **Sensor History**: readings over time for the selected sensors (per sensor).
- **Environmental History**: readings over time from the environmental sensors of the selected devices (per device). Needs no Sensor objects, so it works on installations of any size.
- **Device Sensor History**: readings over time from the sensors of the selected devices that match the given names (for example **Output Load**) and kinds (for example **Current**), per device. With neither given, it reads the device's environmental sensors.
- **Active Alarms**: currently active alarms with their category, optionally filtered by device or by a single device group (including its sub-groups).
- **Alarm History**: alarms resolved within the timeframe (whenever they started), with their category, optionally filtered by device. For a single device it covers the whole timeframe; across all devices it covers the last 24 hours at most.
- **Alarm Summary**: active alarm counts by severity per device group, optionally filtered by device group.
- **Event Log**: the newest 1,000 Data Center Expert event log messages in the timeframe (account-wide). Not on the out-of-the-box dashboards; see Known limitations.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Device** | `GET /v1/devices` | A managed device such as a UPS, PDU, cooling unit or NetBotz appliance. |
| **Device Group** | `GET /v1/deviceGroups` | A device group from the Data Center Expert group tree. |
| **Sensor** | `GET /v1/devices/sensors` | A single sensor on a device, for example a temperature probe or an output current reading. Imported only when **Import sensors** is on. |

**Relationships:** each Sensor stores its parent device's ID (`deviceGuid`), each Device stores its parent device's ID (`parentGuid`), and each Device Group stores its parent group's ID (`parentIsxcGuid`).

## Known limitations

- **Strict rate limit**: Data Center Expert allows only 5 requests per minute for each API area (devices, device groups, alarms, sensors, event log), and enforces it. The limit is shared by every tile and user of a data source, so several dashboards refreshing at once can be throttled. Throttled tiles show a rate-limit message and load again on the next refresh.
- **Large installations can't import sensors**: sensors can only be imported with a single request for every sensor on the server. On a large installation (tens of thousands of sensors) that takes longer, and returns more data, than SquaredUp allows, and the rate limit rules out reading each device's sensors in turn. So **Import sensors** is off by default and the **Sensor** perspective has nothing to show; turned on for a large installation, the **sensors** import step finishes with a warning while devices and device groups are still imported. Environmental readings and history on each **Device** dashboard read only that device's sensors, so they work regardless.
- **Some calls are slow on Data Center Expert's side**: reading device groups and the alarm summary takes Data Center Expert around 10 seconds (up to about 25 seconds when busy), so those tiles load slowly. The event log took about 27 seconds even when empty in testing, longer than SquaredUp allows, so it isn't on the out-of-the-box dashboards.
- **Alarm history across all devices covers the last 24 hours at most**: on a large installation Data Center Expert returns thousands of resolved alarms a day (about 6,500 a day, 2.4 MB, in testing), and a week is far more than SquaredUp can take in one response. A single device's alarm history uses its own endpoint and covers any timeframe.
- **Categories are best-effort**: a sensor's category comes from its kind and label; an alarm's comes from keywords in its description (for example "temperature" or "leak"), because alarms don't say which kind of sensor raised them.
- **Sensor history is downsampled** over long timeframes: a tile returns at most 20,000 readings in total, shared across its sensors. Beyond that, numeric readings are averaged into time buckets, and state readings (such as door open or closed) are reduced to the points where the state changed. If a sensor has more state changes than its share of the limit, the changes are sampled evenly, so some changes may not be shown.
- **Sensor names are not unique**: a sensor is named as it appears in Data Center Expert (for example "Temperature"), so search results show many sensors with the same name. Drill down from a device to find its sensors.
- **Temperature bands use °F**: the **Temperature** gauge and **Temperature History** chart on each Device dashboard use a 50–100 °F scale, show the ASHRAE recommended range (64.4–80.6 °F), and mark the ASHRAE class A1 allowable limits (59 and 89.6 °F). Both leave out sensors with "Battery" in their name, since ASHRAE ranges apply to room air rather than UPS batteries. The **Humidity** gauge is green up to 70 %RH, amber to 80 %RH, and red outside the 8–80 %RH allowable range.
- **Sensors are shown on their device's dashboard**: with **Import sensors** off there are no Sensor objects, so sensor names in device tiles are plain text rather than links. Each Device dashboard reads its sensors' current values and history directly from Data Center Expert.
- **Readings are in English and US units**: the plugin asks Data Center Expert for the `en_US` locale on every request, whatever the server's own locale. Sensor names, states and alarm text are therefore in English, and temperatures are in °F. The dashboards depend on this: the **UPS** tiles find their sensors by name (such as **Output Load**), and categories and temperature bands assume English names and °F. Temperatures show as `F` without the degree sign, because a SquaredUp relay agent currently garbles non-ASCII characters (`°F` would appear as `Â°F`).
- **The UPS perspective relies on standard APC sensor names**: its tiles read **Battery Capacity Remaining**, **Battery Time Remaining**, **Output Load**, **Input Voltage**, **Output Voltage** and similar sensors, which were identical across the Smart-UPS 1000, 1500, 3000 XL and SRT 5000 in testing. A UPS model that names them differently shows "No data" in those tiles. Status blocks are coloured by Data Center Expert's own severity for each sensor, and the plugin never overrides it. So a state such as **UPS Operation Mode: On Battery** or **Self-Test Status: Invalid Test** shows green unless Data Center Expert raises it. To have those states flagged, set up alarm thresholds for them in Data Center Expert, or edit the **UPS Status** tile to colour by the reading instead.
- **The Rack PDU perspective selects sensors by kind**: PDU sensor names differ between APC model families (**Total Power Output** or **Total Real Power**, **Current - Phase 1** or **Current, Phase 1**), so its tiles pick sensors by kind (current, power) plus a keyword. In testing this covered the AP7900B, AP7968B, AP7863, AP8965 and AP8841. **Outlets** shows only on switched PDUs; metered models have no outlet states, so that tile shows "No data". Outlet blocks are coloured by Data Center Expert's severity, like the UPS status blocks.
- **Sign-in details are sent as URL parameters**: when **OAuth client ID** is blank, the token request sends the username and password as URL parameters, the form Data Center Expert accepts without an OAuth client. HTTPS encrypts them in transit, but they may appear in the Data Center Expert web server's access logs, and a relay agent with `"LogLevel": "Debug"` writes the token URL, password included, to its log. After troubleshooting, turn Debug logging off and delete the log files written while it was on (see [Troubleshooting](#troubleshooting)). Setting an **OAuth client ID** sends them in the request body instead.
- **Read-only**: the plugin never acknowledges alarms, changes device controls, or modifies anything in Data Center Expert.
