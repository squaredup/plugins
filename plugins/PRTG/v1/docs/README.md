Monitor your [PRTG Network Monitor](https://www.paessler.com/prtg) installation in SquaredUp — probes, groups,
devices and sensors, with current status, channel readings, historic sensor data and the PRTG log — via the
[PRTG HTTP API](https://www.paessler.com/manuals/prtg/http_api).

> ⚠️ This plugin uses the **PRTG API v1** (`/api/table.json`). It does not use PRTG API v2, whose object
> endpoints are still marked experimental by Paessler. Any PRTG version that supports API keys will work,
> including PRTG Hosted Monitor, PRTG Network Monitor and PRTG Enterprise Monitor.

## Setup

You will need the **URL** of your PRTG server and a PRTG **API key**.

1. Sign in to your PRTG web interface as a user allowed to create API keys.
2. Go to **Setup → Account Settings → [API Keys](https://www.paessler.com/manuals/prtg/api_keys)**.
3. Hover over the **Add** button and choose **Add API Key**.
4. Set the token type to **Scripting** — the **Desktop** type is reserved for PRTG MultiBoard, and only one
   is allowed per account.
5. Give the key **Read access**. The plugin only ever reads, so `Acknowledge`, `Write` and `Full` access
   are unnecessary.
6. Click **OK**, then copy the generated key immediately — PRTG will not show it again. If you lose it,
   delete the key and create a new one.
7. Paste the key into the **API key** field, and your PRTG address into **PRTG URL**.
8. Set **PRTG time zone** to the time zone of the account whose key you just created — it is shown in PRTG
   under **Setup → Account Settings → My Account → Time Zone**.

## Configuration fields

| Field                              | What it is                                                                                                                                                | Where to find it                                                        | Required |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| **PRTG URL**                       | The base address of your PRTG web interface — for example `https://prtg.example.com` or `https://yourname.my-prtg.com`. Include the sub-path if PRTG sits behind a reverse proxy, but no query string.           | The address bar of your PRTG web interface.                              | Yes      |
| **API key**                        | Authenticates every request. Sent as the `apitoken` query parameter, which is the only scheme PRTG's v1 API accepts.                                       | PRTG → **Setup → Account Settings → API Keys**.                          | Yes      |
| **PRTG time zone**                 | The time zone of the PRTG account whose API key you supplied, as an IANA name such as `Europe/London`. Only affects **Sensor History** and **Log**. Defaults to UTC. | PRTG → **Setup → Account Settings → My Account → Time Zone**.            | No       |
| **Ignore certificate errors**      | Skips TLS certificate validation. Only enable for an on-premise PRTG server using a self-signed certificate.                                               | —                                                                       | No       |

On save, the plugin calls PRTG's status endpoint to confirm the URL and key. A failure means the URL is
unreachable or the key is invalid, expired, or deleted.

> ⚠️ **Get the time zone right.** PRTG interprets date ranges in its *own* time zone rather than UTC, so the
> wrong zone shifts **Sensor History** and **Log** — and on short timeframes can make them look empty.
> Everything else is unaffected. Note that PRTG labels a zone by its *standard* offset, so a UK server shown
> as "(UTC+00:00) … London" is really running an hour ahead during British Summer Time — pick
> `Europe/London` rather than `UTC` and daylight saving is handled for you.

## What this plugin monitors

- **Estate health at a glance** — how many sensors are up, warning, down, paused, unusual or unknown across
  the whole installation, plus your PRTG version and edition.
- **The PRTG hierarchy** — probes, groups, devices and sensors are all indexed, so you can search for them,
  scope dashboards to them, and use them as dashboard variables.
- **Device and sensor state** — per-device sensor counts by state and host address; per-sensor status, last
  reading, status message, uptime and downtime percentage, scanning interval and priority.
- **Sensor detail over time** — the current, minimum and maximum reading of every channel on a sensor, and
  historic readings for any timeframe.
- **The PRTG log** — what PRTG recorded, against which object, over the dashboard's timeframe.
- **Sites** — where a **Location** is set in PRTG, devices and their sensor counts are broken down by it, so
  you can compare sites side by side.

The out-of-the-box dashboards include an estate-wide **Overview**, a **Sites** breakdown, and a perspective
for each **Probe**, **Group**, **Device** and **Sensor**.

## Data streams

- **System Status** — installation-wide sensor counts by state, plus PRTG version, edition and server time. Account-wide.
- **Probes** — every probe with its status and connection state. Account-wide.
- **Groups** — every group with its status and sensor counts by state. Account-wide.
- **Devices** — every device with its status, host address and sensor counts by state. Account-wide.
- **Sensors** — every sensor with its status, last reading, uptime and scanning interval. Account-wide.
- **Sensors in Probe, Group or Device** — the same sensor detail, restricted to everything beneath one probe, group or device. Per-object.
- **Devices in Probe or Group** — device detail restricted to everything beneath one probe or group. Per-object.
- **Sensor Channels** — the current, minimum and maximum reading for each channel of one sensor. Per-object.
- **Sensor History** — historic channel readings for one sensor, one row per channel per interval, over the selected timeframe. Per-object.
- **Log** — PRTG log entries over the selected timeframe. Account-wide.

## What gets indexed

| Object type      | API source                                             | Represents                                                     |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| **PRTG Probe**   | `GET /api/table.json?content=probes&filter_type=probenode` | A local or remote probe that performs monitoring.          |
| **PRTG Group**   | `GET /api/table.json?content=groups`                   | A group of devices. Groups can nest inside other groups.        |
| **PRTG Device**  | `GET /api/table.json?content=devices`                  | A monitored host, identified by its address.                    |
| **PRTG Sensor**  | `GET /api/table.json?content=sensors`                  | A single check running against a device.                        |

**Relationships:** every object stores its PRTG parent's id as a `parentId` property, and sensors also store
`deviceId`, `deviceName`, `groupName` and `probeName`. The **Sensors** stream links its Device column
straight to the **PRTG Device** object, so you can click through from a sensor to the device it runs on. See
the first limitation below for why these are properties rather than graph relationships.

**Sites:** PRTG has no "site" object. Probes, groups and devices each store a `location` property holding
PRTG's **Location** field, which is the closest thing — a remote probe usually maps to one site, and groups
are the usual way to organise by site. The **Sites** dashboard groups devices by `location`.

## Known limitations

- **No graph relationships between PRTG objects.** SquaredUp only supports creating graph edges from
  code-based plugins, not low-code ones like this. The PRTG hierarchy is therefore expressed as properties
  (`parentId`, `deviceName`, `groupName`, `probeName`) and through dashboard scoping and drilldown, rather
  than as traversable parent/child links in the graph.
- **Date ranges follow PRTG's own time zone.** See the **PRTG time zone** field above. PRTG offers no way to
  query in UTC and accepts no relative ranges, so the zone has to be supplied. It is also used to convert
  **Sensor History** timestamps to UTC, because that endpoint reports times only as local text with no UTC
  equivalent — so the wrong zone shifts both the range queried *and* the times plotted. An unrecognised zone
  name falls back to UTC rather than failing the request.
- **Very large installations may hit a response size limit.** Each object type is fetched in a single
  request rather than page by page. In practice the sensor import is the binding constraint and should
  comfortably handle around 10,000 sensors, which is also Paessler's own recommended maximum per core
  server. Larger installations may fail to import sensors.
- **Sensor History is limited to 30 days**, and beyond a week it is averaged hourly. Finer buckets over a
  long range return more rows than the platform's response size limit allows, so when you have not chosen an
  **Averaging interval** the plugin asks PRTG for hourly figures on ranges longer than seven days. Choosing
  **5 minutes** or **Raw** explicitly on a long range can still exceed the limit and fail the tile.
- **The log returns at most 5,000 entries per query.** PRTG returns newest first, so on a busy installation
  over a long timeframe the oldest entries in the range are dropped without warning. Unlike the object
  tables, PRTG reports no usable total for the log, so there is no way to detect that truncation happened —
  shorten the dashboard timeframe to see further back.
- **PRTG tags are a single string.** They are indexed as a `prtgTags` property holding PRTG's
  comma-separated list, not as native SquaredUp tags.
- **Location is only reported where it is set, and never on sensors.** PRTG's API returns a `location` for a
  probe, group or device only when one is set on that object directly — it is not inherited down the tree in
  the API response, and sensors never carry one at all. The **Sites** dashboard therefore aggregates
  *devices* (and PRTG's per-device sensor counts) by location, and shows nothing until you set **Location**
  on your devices in PRTG.
- **No map visualisation.** SquaredUp has no map tile type, and PRTG's API exposes no usable coordinates —
  `lat`/`lon` are not valid columns and the `lonlat` property reads `0,0` unless PRTG has geocoded the
  location. Sites are therefore shown as charts and tables, not on a map.
- **Sensor status in the graph is not indexed.** Because objects are re-imported only every 12 hours by
  default, indexing a sensor's status would show stale health. Use the **Sensors** stream for current status.
- **Historic data granularity is PRTG's.** PRTG aggregates history into buckets and returns a `coverage`
  percentage per bucket; intervals PRTG has no data for are omitted rather than plotted as zero. Choosing
  **Raw** on **Sensor History** is only practical over short timeframes.
- **The API key travels in the query string.** PRTG's v1 API rejects `Authorization: Bearer`, so the token
  must be sent as the `apitoken` query parameter. Always use HTTPS.
- **Read-only.** The plugin never creates, modifies, acknowledges, pauses or deletes anything in PRTG, and a
  **Read access** API key is all it needs.
