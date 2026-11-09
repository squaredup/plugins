Track the health of [Splunk Cloud Platform](https://www.splunk.com/en_us/products/splunk-cloud-platform.html) in SquaredUp, using the public [Splunk Cloud Platform status page](https://status.splunkcloud.com): component status, incidents and scheduled maintenance.

> ⚠️ This data source shows Splunk's platform-wide status page. It does not show the health of an individual Splunk Cloud stack, and it does not read from your own Splunk deployment.

## Setup

You don't need credentials, because the status page is public.

1. Add the data source.
2. Save. The data source reads the status page once to check that it is reachable.

## Configuration fields

This data source has no configuration fields.

When you save, the data source requests the status page's current status and checks that it returns a valid status document. A failure means the page could not be reached from the SquaredUp agent or cloud, or it returned something other than status data (for example a maintenance page).

## What this plugin monitors

- **Overall status**: the status banner shown at the top of the status page, with counts of affected components, active incidents, and active and upcoming maintenance.
- **Component health**: the current status of each Splunk Cloud Platform component, such as Search, Index, Ingest and Login.
- **Incidents**: every incident Splunk has published, with its impact, status, affected components, when it started and was resolved, the time to resolve, and the latest update.
- **Scheduled maintenance**: maintenance windows that are upcoming, in progress or completed, with their scheduled times and affected components.

The plugin includes three dashboards: **Overview**, **Incidents** and **Maintenance**.

## Data streams

- **Overall Status**: one row with the status banner text, and counts of affected components, active incidents, and active and upcoming maintenance. It always shows the current state, so it doesn't support timeframes.
- **Component Status**: one row per Splunk Cloud Platform component, with its group and current status. It always shows the current state, so it doesn't support timeframes.
- **Incidents**: one row per incident. It has one parameter:
    - **One row per affected component**: splits an incident that affects several components into one row per component, so that breakdowns by component count the incident against each component it affects.

    The timeframe returns every incident that was open at any point in the range, including one that started earlier and was still running. Set the timeframe to **None** to return every incident the status page lists, which is its 50 most recent.
- **Scheduled Maintenance**: one row per maintenance window. The timeframe returns every window that overlaps the range. Set the timeframe to **None** to return every window the status page lists, including upcoming ones, which is its 50 most recent.

The **State** column uses these rules:

| Stream | Success | Warning | Error | Unknown |
| ------ | ------- | ------- | ----- | ------- |
| Overall Status | No incidents or maintenance | Minor incidents, or maintenance in progress | Major or critical incidents | |
| Component Status | Operational | Degraded performance, or under maintenance | Partial or major outage | |
| Incidents | Resolved | Open incident that is minor or has no impact | Open incident that is major or critical | |
| Scheduled Maintenance | Completed | In progress or verifying | | Upcoming |

## What gets indexed

Nothing. The status page contains status updates, not inventory, so this data source doesn't import any objects into the SquaredUp graph. Components appear as row values, not as objects.

## Known limitations

- **Status is platform-wide.** The status page covers Splunk Cloud Platform as a whole. It can't tell you whether your own stack is affected.
- **An incident's impact can understate it.** Splunk sets the **Impact** value by hand, and it is sometimes lower than what happened (an incident titled "Major Outage" can be filed as minor). **Worst component status** shows the worst status any affected component reached during the incident, so use it when you need severity.
- **History is limited to the 50 most recent records.** The status page returns only its 50 most recent incidents and its 50 most recent maintenance windows, and has no paging. Once either list grows past 50, older records drop out of the data source, even with the timeframe set to **None**. At the time of writing there are 35 incidents, going back to June 2023, so nothing is missing yet.
- **Every tile downloads the whole list.** The status page has no server-side filtering, so each incident request fetches the full list (about 200 KB at the time of writing) and filters it after download.
- **Some resolve times are wrong at the source.** A few older incidents were recorded as resolved before they started. **Time to resolve** is left empty for those rather than showing a negative duration.
- **Some incidents have no components.** Splunk doesn't always tag an incident with the components it affected, so those incidents have an empty **Components** value.
