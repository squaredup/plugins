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

The **State** column on both streams uses these rules:

| State | Meaning |
| ----- | ------- |
| Error | An active incident with the event type **Service Disruption** (an outage) |
| Warning | Any other active incident (degradation, under investigation or monitoring), or maintenance in progress |
| Unknown | Upcoming maintenance, or an open advisory. Neither affects cloud health. |
| Success | Resolved, completed or cancelled |

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
- **Read-only.** The plugin only reads the public feed and never changes anything in Zscaler.
