Track Zscaler cloud incidents, scheduled maintenance and advisories in SquaredUp, using the public
RSS feed from the [Zscaler Trust](https://trust.zscaler.us) portal. The FedRAMP / Government portal
(`trust.zscaler.us`) and the Commercial portal ([trust.zscaler.com](https://trust.zscaler.com)) are
both supported.

## Setup

You don't need credentials, because the Trust portal feeds are public.

1. Pick the **Trust portal** your Zscaler tenant is listed on: **FedRAMP / Government** for clouds
   such as `zscalergov.net`, `zscalerten.net` and `zpagov.net`, or **Commercial** for clouds such
   as `zscaler.net`, `zscalertwo.net` and `private.zscaler.com`.
2. Optional: to see only the clouds your organization uses, open the portal, note the cloud names
   that appear at the end of post titles (for example `zscalergov.net`), and enter them in
   **Cloud(s) to include**.
3. Save. The data source reads the feed once to check that it is reachable.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Trust portal** | Which Zscaler Trust portal feed to read. | **FedRAMP / Government** is `trust.zscaler.us`; **Commercial** is `trust.zscaler.com`. | Yes |
| **Cloud(s) to include** | A comma-separated list of cloud names. Every tile is limited to posts that affect at least one of them. Leave it blank to include every cloud. | The cloud names at the end of each post title on the Trust portal, for example `zscalergov.net` | No |

When you save, the data source reads the selected portal's RSS feed and checks that it returns a
valid RSS document. A failure means the portal could not be reached, or it returned something other
than its feed (for example a maintenance page).

## What this plugin monitors

- **Incidents**: service degradations, disruptions and issues under investigation. Each one includes
  its status, the affected clouds, when it started and was resolved, the time to resolve, the
  customer impact, any workaround, how it was found (**Internal Monitoring** or
  **Customer Reported**), and the latest update text.
- **Scheduled maintenance**: maintenance windows that are upcoming, in progress or completed, with
  start and end times, duration and the clouds affected.
- **Advisories**: notices such as end-of-life announcements, certificate changes and required
  customer actions.
- **Cloud health**: the current state of each Zscaler cloud, rolled up from active incidents and
  maintenance.
- **Data centers and core services**: the current state of each data center (or core service such
  as **Admin UI** or **DNS**) in a cloud, and its hour-by-hour history over the last 7 days, as
  shown on the portal's **Cloud Status** page.

The plugin includes three dashboards: **Overview**, **Incidents** and **Maintenance & Advisories**.

## Data streams

- **Posts**: one row per Trust portal post (incident, maintenance or advisory). It covers every
  cloud on the selected portal, and has these parameters:
  - **Type**: limits the rows to incidents, maintenance and/or advisories.
  - **Cloud(s)**: limits the rows to posts that affect the selected clouds.
  - **One row per affected cloud**: splits a post that affects several clouds into one row per
    cloud, so that breakdowns by cloud count the post against each cloud it affects.
  - **Timeframe applies to** (on the timeframe step): choose **Published** to filter by publish
    date, or **Event window** to include any post whose start-to-end window overlaps the timeframe.
    Set the timeframe to **None** to return everything in the feed.
- **Cloud Status**: one row per cloud, with its current state and counts of active incidents,
  active and upcoming maintenance, and open advisories. It always shows current state, so it
  doesn't support timeframes.
- **Cloud Component Status**: one row per data center or core service in one cloud, with its region,
  current state and any active event (type, status, start time, summary and a link to the post).
  It reads the portal's **Cloud Status** page rather than the RSS feed, and always shows current
  state. It has these parameters:
  - **Cloud**: the cloud to show, picked from the clouds listed on the selected portal. Required.
  - **Component type**: **Data centers**, **Core cloud services**, **Premium data centers** or
    **Business continuity data centers**. The list shows only the types the selected cloud
    publishes on the portal. Leave it empty for data centers.

  Every data center or service in the cloud is returned. To show only some of them, for example
  `Chicago`, `San Francisco IV` and `Washington DC`, add a filter on **Name** in the tile.
- **Cloud Component History**: one row per data center or service per hour, with that hour's
  state and the worst event during it. It has the same parameters as Cloud Component Status and
  supports the **Last 24 hours** and **Last 7 days** timeframes. Show it as a **Health history**
  chart, with **Hour** as the time, **State** as the status and **Name** as the label, to get the
  portal's 7-day bars. The latest hour also includes any event that is still open, so it matches
  the current-status icon at the end of each bar on the portal.

The **State** column on the Posts and Cloud Status streams uses these rules:

| State | Meaning |
| ----- | ------- |
| Error | An active incident with the event type **Service Disruption** (an outage) |
| Warning | Any other active incident (degradation, under investigation or monitoring), or maintenance in progress |
| Unknown | Upcoming maintenance, or an open advisory. Neither affects cloud health. |
| Success | Resolved, completed or cancelled |

**Cloud Component Status** and **Cloud Component History** use the same idea: **Error** for a
**Service Disruption**, **Warning** for a **Service Degradation** or an issue **Under
Investigation**, and **Success** otherwise.

## What gets indexed

Nothing. The feed contains status posts, not inventory, so this data source doesn't import any
objects into the SquaredUp graph. Clouds appear as row values, not as objects.

## Known limitations

- **History is about three months long.** The feed only contains the posts Zscaler currently
  publishes, which is roughly the last three months. The plugin can't return anything older, and a
  timeframe longer than that returns the same rows as **None**.
- **Every tile downloads the whole feed.** The feed has no server-side filtering or paging, so
  every request fetches the full document (about 200 KB on the FedRAMP portal and about 1 MB on the
  Commercial portal). All filtering happens after download.
- **Status is only as current as the portal.** Zscaler sometimes leaves a post **In Progress** long
  after the issue has gone away. The plugin reports each post as it is published and doesn't guess
  that a stale incident has ended, so one of these can keep a cloud at **Warning**.
- **Clouds are parsed from post titles.** The affected clouds come from the end of each title (for
  example `- zscalergov.net (FedRAMP Moderate)`). If Zscaler changes that format, the plugin falls
  back to the cloud in the post's link, which names only one cloud.
- **Advisory dates are date-only.** The portal publishes most advisories with a midnight (00:00 GMT)
  timestamp.
- **Some text contains replacement characters.** A few posts on the portal include characters that
  are already corrupted at the source (shown as `�`). The plugin passes them through unchanged.
- **Cloud Component Status and Cloud Component History show one cloud per tile.** The cloud is
  chosen in the tile rather than taken from **Cloud(s) to include**. To compare several clouds, add
  the stream to a tile once per cloud.
- **Component history covers the portal's current week only.** The portal's window starts at
  midnight UTC six days ago, so **Last 7 days** shows six full days plus today so far, and nothing
  older is returned. History is in whole hours (UTC), so a short event fills the hour it falls in.
- **Not every cloud publishes every component type.** Premium and business continuity data centers
  are only published for some Commercial clouds, and some clouds publish only core services. The
  **Component type** list hides the types a cloud doesn't publish. A tile that still asks for one,
  for example because its cloud was changed afterwards or because it was left empty on a cloud
  without data centers, shows an error saying so.
- **Read-only.** The plugin only reads the public Trust portal and never changes anything in
  Zscaler.
