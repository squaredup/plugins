Track the health of any public status page hosted on [Atlassian Statuspage](https://www.atlassian.com/software/statuspage) in SquaredUp: component status, incidents, incident updates and scheduled maintenance. The data comes from the page's public [Status API](https://metastatuspage.com/api), so you don't need credentials.

> ⚠️ This data source reads a vendor's public status page. It shows what the vendor has published, not the health of your own account, tenant or region with that vendor.

## Setup

1. Under **Status page**, choose how to identify the page:
    - **Select from list**: pick the vendor from **Page**. The list holds well-known status pages that have been checked to work.
    - **Custom**: enter the page's address in **Status page URL**, such as `status.example.com`.
2. Save. The data source reads the status page to check it is reachable and runs on Statuspage.

Add one data source per status page. To track several vendors, add the data source once for each.

To find out whether a page you want to add runs on Statuspage, open `https://<address>/api/v2/summary.json` in a browser. A Statuspage page returns JSON that starts with `{"page":`. Any other page returns a web page or an error, and can't be used.

To read the page from inside your network, for example where outbound traffic must come from an allow-listed address, run the data source on a [relay agent](https://docs.squaredup.com/features/connect-and-explore/relay-agents).

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Status page** | Whether to pick the page from the list or enter its address. | Choose **Select from list** or **Custom**. | Yes |
| **Page** | A well-known status page, shown when **Select from list** is chosen. | Type the vendor's name to search the list. | Yes, for **Select from list** |
| **Status page URL** | The address of any status page hosted on Statuspage, shown when **Custom** is chosen. Accepts a full URL (`https://status.example.com`), a host name (`status.example.com`), or a Statuspage page ID or subdomain (`abc123xyz`, read from `abc123xyz.statuspage.io`). Any path is ignored, and requests always use HTTPS. | The vendor's status page link, usually in the footer of their website or their support pages. | Yes, for **Custom** |

When you save, the data source runs two checks:

- **Read the status page** reads the page's current status. If it fails, the address returned something other than Statuspage data, usually because the page runs on a different status page product, or because it isn't reachable from SquaredUp or your relay agent.
- **Check scheduled maintenance** reads the page's scheduled maintenance. If it fails, the page imitates the Statuspage API but isn't hosted on Statuspage (some vendors use products such as incident.io that do this). Component status and incidents still work, but scheduled maintenance isn't available and incidents don't list the components they affected.

## What this plugin monitors

- **Overall status**: the banner at the top of the status page, with counts of affected components, active incidents and maintenance in progress.
- **Component health**: the current status of each component, with its group.
- **Incidents**: incidents the vendor has published, with impact, status, affected components, start and resolve times, time to resolve, and the latest update.
- **Incident updates**: each update posted to an incident, including which components changed status.
- **Scheduled maintenance**: maintenance windows that are upcoming, in progress or completed.
- **Component reliability**: an estimate of outage time and availability per component, rebuilt from incident updates.

The plugin includes four dashboards, **Overview**, **Incident Analysis**, **Maintenance** and **Component Reliability**, plus a **Component** perspective that opens when you select an imported component.

## Data streams

- **Overall Status**: one row with the status banner text, and counts of affected components, active incidents and active maintenance. It always shows the current state, so it doesn't support timeframes.
- **Component Status**: one row per component, with its group and current status. It always shows the current state, so it doesn't support timeframes.
- **Incidents**: one row per incident. The timeframe returns every incident that was open at any point in the range. Set the timeframe to **None** to return every incident the page lists. It has these parameters:
    - **One row per affected component**: splits an incident that affects several components into one row per component, so breakdowns by component count the incident against each one.
    - **Phase**: **Active** or **Resolved**. Leave empty for both.
    - **Impact**: **None**, **Minor**, **Major**, **Critical** or **Maintenance**. Leave empty for all.
    - **Components**: limits the rows to incidents that affected the chosen components.
- **Active Incidents**: one row per incident that is currently unresolved. It reads a smaller list than **Incidents**, so it suits tiles that only show what is happening now. It has a **Components** parameter.
- **Incident Updates**: one row per update posted to an incident, with any component status changes it made. It has **One row per affected component** and **Components** parameters, and follows the timeframe like **Incidents**.
- **Scheduled Maintenance**: one row per maintenance window. The timeframe returns every window that overlaps the range, and **None** returns every window the page lists, including upcoming ones. It has **Phase** (**Upcoming**, **Active** or **Completed**) and **Components** parameters.
- **Component Reliability (Estimate)**: one row per component with incident count, time spent in major outage, partial outage, degraded performance and maintenance, **Availability** (time not in major outage) and **Fully Operational** (time not in any outage or degraded state). Maintenance counts against neither. It supports timeframes from the last 7 days to last year, and has a **Components** parameter.

The **State** column uses these rules:

| Stream | Success | Warning | Error | Unknown |
| ------ | ------- | ------- | ----- | ------- |
| Overall Status | All systems operational | Minor incident, or maintenance in progress | Major or critical incident | |
| Component Status | Operational | Degraded performance, or under maintenance | Partial or major outage | |
| Incidents, Active Incidents | Resolved | Open incident with minor or no impact | Open incident with major or critical impact | |
| Scheduled Maintenance | Completed | In progress | | Upcoming |

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| Page | `status.json` | The status page itself, with its URL and time zone. |
| Component | `summary.json` | Each component on the page (group headings are not imported). Named `<Page> / <Component>`, so components stay distinct when you add several status pages. A name that repeats across groups also includes its group, such as `<Page> / <Group> / <Component>`. |

Select a component to open the **Component** perspective, or pick components in the **Components** parameter of any stream.

## Known limitations

- **History is limited to the 50 most recent records.** The Status API returns only the 50 most recent incidents and the 50 most recent maintenance windows, and has no paging. Older records aren't available, even with the timeframe set to **None**. On a busy page, 50 incidents can cover only a few weeks.
- **Every tile downloads the whole list.** The Status API has no server-side filtering, so incident and maintenance tiles fetch the full list and filter it afterwards.
- **An incident's impact can understate it.** Vendors set **Impact** by hand, and it is sometimes lower than what happened. **Worst Component Status** shows the worst status any affected component reached during the incident, so use it when you need severity.
- **Some resolve times are wrong at the source.** A few older incidents on some pages were recorded as resolved before they started. **Time To Resolve** is left empty for those, rather than showing a negative duration.
- **Some incidents have no components.** Vendors don't always tag an incident with the components it affected, so those incidents have an empty **Components** value and don't count towards **Component Reliability (Estimate)**.
- **Component reliability is an estimate.** It is rebuilt from the status changes recorded in incident updates, not from the vendor's own uptime figures, and can only reach back as far as the 50 most recent incidents. When the history doesn't cover the whole timeframe, the stream warns you, assumes the earlier time was operational, and shows where the history starts in **History From**.
- **Pages that imitate Statuspage are partly supported.** Some status page products, such as incident.io, serve a copy of the Status API. These return fewer incidents, don't list affected components, and have no scheduled maintenance or **Active Incidents** list. **Overall Status**, **Component Status** and **Incidents** still work.
- **Private and audience-specific pages aren't supported.** Only public pages can be read, because the data source sends no credentials.

## Adding a status page to the list

The **Page** list is defined in this plugin's [`ui.json`](https://github.com/squaredup/plugins/blob/main/plugins/Statuspage/v2/ui.json), so anyone can propose a new entry with a pull request to the [squaredup/plugins](https://github.com/squaredup/plugins) repository. Until it is added, any Statuspage page works with **Custom**.

1. **Check the page runs on Statuspage.** Open both of these in a browser, using the page's own address:
    - `https://<address>/api/v2/summary.json` must return JSON with `page`, `status` and `components`.
    - `https://<address>/api/v2/scheduled-maintenances/upcoming.json` must return JSON, not a 404 page. A 404 means the page imitates Statuspage, so leave it out of the list. Users can still add it with **Custom**.
2. **Use the vendor's published address.** Use the host name the vendor links to, such as `status.example.com`. Don't guess a `<name>.statuspage.io` subdomain, because those can belong to a different page.
3. **Add an entry to the `knownPage` field** in `ui.json`, under `data.values`, in alphabetical order of `label`. `value` is the host name only, with no `https://` and no path, and `label` is the vendor or product name as the vendor styles it:

    ```json
    {
        "value": "status.example.com",
        "label": "Example Cloud"
    }
    ```

4. **Add search keywords** to `keywords` in `metadata.json`: the vendor name in lowercase, plus any other name people search for, such as a former product name or the parent company. This lets people find the plugin by searching for the vendor.
5. **Bump the minor version** in `metadata.json`, such as from `2.1.0` to `2.2.0`.
6. **Test and raise a pull request** using the *Change to an existing plugin* template. Deploy the plugin to your own organization with the [SquaredUp CLI](https://docs.squaredup.com/ai-features/building-plugins-with-ai), add a data source with the new page selected, and confirm that the configuration checks pass and the **Overview** dashboard shows data.
