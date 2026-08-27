Monitor your [PRTG Network Monitor](https://www.paessler.com/prtg) installation in SquaredUp — probes, groups,
devices and sensors, with current status, channel readings, historic sensor data and the PRTG log — via the
[PRTG HTTP API](https://www.paessler.com/manuals/prtg/http_api).

> ⚠️ **This plugin uses the PRTG API v1** — `/api/table.json`, `/api/historicdata.json` and
> `/api/getstatus.htm`. Any PRTG version that supports API keys will work, including PRTG Network Monitor,
> PRTG Enterprise Monitor and PRTG Hosted Monitor, and you do **not** need to enable the new UI or API v2.
> See [Why this plugin uses API v1](#why-this-plugin-uses-api-v1) for the reasoning.

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
   under **Setup → Account Settings → My Account → Time Zone**. Saving checks your answer against the zone
   PRTG reports, so a mismatch is flagged there and then.

## Configuration fields

| Field                              | What it is                                                                                                                                                | Where to find it                                                        | Required |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| **PRTG URL**                       | The base address of your PRTG web interface — for example `https://prtg.example.com` or `https://yourname.my-prtg.com`. Include the sub-path if PRTG sits behind a reverse proxy, but no query string.           | The address bar of your PRTG web interface.                              | Yes      |
| **API key**                        | Authenticates every request. Sent as the `apitoken` query parameter — PRTG rejects the key in an `Authorization` header.                                    | PRTG → **Setup → Account Settings → API Keys**.                          | Yes      |
| **PRTG time zone**                 | The time zone of the PRTG account whose API key you supplied, as an IANA name such as `Europe/London`. Only affects **Sensor History** and **Log**. Defaults to UTC. | PRTG → **Setup → Account Settings → My Account → Time Zone**.            | No       |
| **Ignore certificate errors**      | Skips TLS certificate validation. Only enable for an on-premise PRTG server using a self-signed certificate.                                               | —                                                                       | No       |

On save, the plugin calls PRTG's status endpoint twice: once to confirm the URL and key — a failure there
means the URL is unreachable or the key is invalid, expired, or deleted — and once to compare **PRTG time
zone** against the zone PRTG says it is using. A zone mismatch is a warning rather than a failure, so it
will not stop you connecting.

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
| **Probe**        | `GET /api/table.json?content=probes&filter_type=probenode` | A local or remote probe that performs monitoring.          |
| **Group**        | `GET /api/table.json?content=groups`                   | A group of devices. Groups can nest inside other groups.        |
| **Device**       | `GET /api/table.json?content=devices`                  | A monitored host, identified by its address.                    |
| **Sensor**       | `GET /api/table.json?content=sensors`                  | A single check running against a device.                        |

**Relationships:** every object stores its PRTG parent's id as a `parentId` property, and sensors also store
`deviceId`, `deviceName`, `groupName` and `probeName`. The **Sensors** stream links its Device column
straight to the **Device** object, so you can click through from a sensor to the device it runs on. See
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

  PRTG does report the zone it is using, as a fixed offset — the **System Status** data stream surfaces it as
  **Server Time Zone**, and saving the configuration warns when it disagrees with the zone you picked. That
  offset cannot replace the setting, though: it describes only the present moment, whereas **Sensor History**
  covers up to 30 days and needs the daylight saving transitions an IANA name carries.
- **Very large installations may hit a response size limit.** Each object type is fetched in a single
  request rather than page by page. In practice the sensor import is the binding constraint and should
  comfortably handle around 10,000 sensors, which is also Paessler's own recommended maximum per core
  server. Larger installations may fail to import sensors.
- **Sensor History is limited to 30 days**, and beyond a week it is averaged hourly. Finer buckets over a
  long range return more rows than the platform's response size limit allows, so when you have not chosen an
  **Averaging interval** the plugin asks PRTG for hourly figures on ranges longer than seven days. Choosing
  **5 minutes** or **Raw** explicitly on a long range can still exceed the limit and fail the tile. A tile
  following a dashboard timeframe longer than 30 days shows the most recent 30 days rather than failing.
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
- **The API key travels in the query string.** PRTG's manual documents `Authorization: Bearer` for API keys,
  but PRTG rejects it in practice — `Bearer`, `X-Api-Key` and `Authorization: apitoken` all answer
  `401 Unsupported authorization scheme` on 26.3.122.1665, leaving the `apitoken` query parameter as the only
  scheme that works. Always use HTTPS.
- **Read-only.** The plugin never creates, modifies, acknowledges, pauses or deletes anything in PRTG, and a
  **Read access** API key is all it needs.

## Why this plugin uses API v1

PRTG also has a newer [API v2](https://www.paessler.com/support/prtg/api/v2/overview/index.html), and where
it is stable it is the better API: ISO 8601 timestamps rather than Excel-style serial numbers, typed status
enumerations rather than numeric codes, native latitude and longitude, a sensor status summary embedded in
every probe, group and device, and a `path` array giving each object its place in the tree. It cannot yet
run this plugin, for three separate reasons.

### 1. Endpoints this plugin needs that API v2 does not have

Checked against the published
[API v2 OpenAPI specification](https://www.paessler.com/support/prtg/api/v2/oas/prtg.api.yaml):

| What the plugin needs | API v1 | API v2 |
| --------------------- | ------ | ------ |
| List every probe, group, device and sensor, for indexing | `table.json?content=…&count=50000` — one request per type | Only `GET /experimental/{probes,groups,devices,sensors}`. The non-experimental equivalents are deprecated, and the stable endpoints are single-object `GET /{type}/{id}` lookups. Capped at 3,000 objects per request. |
| Everything beneath one probe, group or device | `table.json?content=sensors&id=…` — PRTG walks the subtree | Only through the experimental `filter` parameter on those experimental list endpoints. |
| Channel readings for one sensor | `table.json?content=channels&id=…` | `GET /sensors/{id}/data` — **stable, and better than API v1.** |
| Historic readings over an arbitrary window | `historicdata.json?sdate=&edate=&avg=` — any range, and a choice of raw, 5-minute, hourly or daily buckets | `GET /experimental/timeseries/{id}/{type}`, where `type` is one of four fixed windows: `live` (4 hours), `short` (2 days), `medium` (60 days), `long` (365 days). No arbitrary range and no averaging control. |
| PRTG log entries over a timeframe | `table.json?content=messages&filter_dstart=&filter_dend=` | **Nothing.** The specification contains no log, message or event endpoint. |
| Installation-wide sensor counts, version and edition | `getstatus.htm?id=0` — one request | `GET /sensor-status-summary` and `GET /version` are stable and cover most of it, and the experimental `/license` covers the edition — but that is three requests instead of one, and the new-message count, new-alarm count and server clock have no equivalent. |
| The PRTG account's time zone | `getstatus.htm?id=0` → `UserTimeZone` | **Nothing.** The word "timezone" does not appear in the specification. |

On API v2, then, the **Log** data stream could not be built at all, **Sensor History** could not follow a
dashboard timeframe, and the time zone check performed when you save the configuration would not be
possible.

### 2. What remains is marked experimental

Paessler define an experimental endpoint as one that "might change between releases", and API v2 has
already moved: the plain `/probes`, `/groups`, `/devices`, `/sensors` and `/channels` endpoints are
deprecated in favour of `/experimental/…` ones, the original `/experimental/timeseries/{id}` is deprecated
in favour of `/experimental/timeseries/{id}/{type}`, `/experimental/channels` is simultaneously deprecated
*and* experimental, and the API was substantially reworked in PRTG 24.3.100. Every object list this plugin
indexes would sit on an endpoint Paessler reserve the right to change.

API v1 carries the lower churn risk today, not the higher one. It is not deprecated, it has no announced
end of life, and Paessler's own API v2 reference still says that if you cannot achieve your objective with
API v2 you can use API v1 instead.

### 3. API v2 is not available everywhere API v1 is

Per Paessler's [guidance on the new UI and API v2](https://helpdesk.paessler.com/en/support/solutions/articles/76000063881-i-want-to-use-the-new-ui-and-api-v2-what-do-i-need-to-know-),
API v2 is not available on PRTG Hosted Monitor at all, clusters are not supported, and on an existing
installation it stays off until an administrator enables it under **Setup → Activate New UI And API v2**,
which needs ports 1615, 1616 and 23580 free on the PRTG server. It is only on by default for installations
created since PRTG 25.2.106.

A low-code plugin has a single base URL and a single authentication configuration, so using API v2 even for
part of the data would make all of that a prerequisite for using the plugin at all, and would end Hosted
Monitor support. The one stream that would benefit — Sensor Channels — is not worth that trade.

### When this should be revisited

A separate PRTG plugin built on API v2 becomes worth having once:

1. API v2 exposes a log or messages endpoint that can be filtered by date;
2. historic data can be requested for an arbitrary start and end time, with a choice of averaging interval;
3. the probe, group, device and sensor list endpoints leave `/experimental/` without being deprecated, and
   offer either a subtree filter or a page size that makes indexing tens of thousands of sensors practical;
4. API v2 reaches PRTG Hosted Monitor, or dropping Hosted Monitor support becomes an accepted trade.

The first two are hard blockers; the rest are cost. Because moving off API v1 would break existing users,
it belongs in a new major version of this plugin alongside this one rather than as a change to it.
