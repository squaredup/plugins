Monitor the hosts and services in a [Checkmk](https://checkmk.com) site from SquaredUp. Track host and service states, see current problems and downtimes, and chart service metrics over time.

## Before you start

- A Checkmk 2.2 or later site. The plugin uses the Checkmk REST API. It has been tested with Checkmk 2.3 Enterprise.
- The site must be reachable from SquaredUp. For a site on a private network, add the data source through a SquaredUp relay agent that can reach it.

## Create an automation user

1. In Checkmk, go to **Setup > Users > Add user**.
2. Enter a username, for example `squaredup`.
3. Under **Security > Authentication**, choose **Automation secret for machine accounts**. Click the dice icon to generate a secret, and copy it.
4. Under **Roles**, choose a role that can see every host and service you want in SquaredUp, for example **Guest user** (read-only). A role without the **See all host and services** permission only sees hosts and services the user is a contact for.
5. Click **Save**, then **Activate changes**. Checkmk rejects the secret until the change is activated.

## Configuration

| Field | Description |
| --- | --- |
| Site URL | The URL of the Checkmk site, including the site name, for example `https://checkmk.example.com/mysite`. You can paste the address from your browser: anything from `/check_mk` onwards is ignored. |
| Automation user | The automation user's username. |
| Automation secret | The automation user's secret. |

If the Checkmk server's certificate is issued by an internal certificate authority, turn on **Ignore certificate errors** (see [Troubleshooting](#troubleshooting)).

## Troubleshooting

- **`unable to verify the first certificate`**: the relay agent doesn't trust the server's certificate. Relay agents don't use the Windows certificate store, and a server that doesn't send its intermediate certificates fails even when a browser on the same machine opens the site. Turn on **Ignore certificate errors**, or make the relay trust your certificate authority (for example with the `NODE_EXTRA_CA_CERTS` environment variable) and configure the Checkmk web server to send its full certificate chain.
- **`Checkmk rejected the automation user or secret (HTTP 401)`**: the user isn't an automation user, the secret is wrong, or the change hasn't been activated in Checkmk. To check the credentials outside SquaredUp, run this on the relay agent machine (Windows):

  ```powershell
  $u = 'squaredup'
  $p = [Net.NetworkCredential]::new('', (Read-Host 'Automation secret' -AsSecureString)).Password
  curl.exe -sS -k --ssl-no-revoke -w "`nHTTP %{http_code}`n" -H "Authorization: Bearer $u $p" -H 'Accept: application/json' 'https://checkmk.example.com/mysite/check_mk/api/1.0/version'
  ```

  `HTTP 200` with the Checkmk version means the credentials work.
- **`Not found (HTTP 404)`**: the Site URL doesn't point at a Checkmk site. Check it includes the site name.

## What this plugin monitors

- **Hosts**: every host Checkmk monitors, with its state, check output and a count of its services by state.
- **Services**: the state, check output and check plugin of every service, filtered to problems, unhandled problems or chosen hosts.
- **Downtimes**: scheduled host and service downtimes.
- **Metrics**: any service metric over time, for example CPU utilization, memory or filesystem usage.

## Data streams

| Data stream | Description |
| --- | --- |
| Host Status | Current state of each host with a count of its services by state. Optionally filtered to chosen hosts. |
| Services | Current state, output and check plugin of each service. **State** filters to **Problems** (every service that isn't OK) or **Unhandled problems** (problems on hosts that are up, not acknowledged and not in downtime, the definition Checkmk's own overview uses). With no hosts chosen it defaults to Problems; with hosts chosen it defaults to All. |
| Downtimes | Scheduled host and service downtimes, with whether each is active now. Optionally filtered to chosen hosts. |
| Metric History | One metric of one service over time, for each selected host. **Service** is the service name exactly as Checkmk shows it, and **Metric** is the Checkmk metric ID, for example `util` for CPU utilization, `load1` for CPU load, `mem_used_percent` for Memory or `fs_used_percent` for a filesystem. You can find metric IDs in Checkmk in the **Service Metrics** entry on the service's details page. |

## What gets indexed

| Object type | Properties |
| --- | --- |
| Host | Alias, address, folder, host groups, labels and service names |

Hosts are imported every 12 hours.

## Known limitations

- **All services on every host**: choosing **All** without choosing hosts can exceed SquaredUp's 6 MB limit on a single response, even on a site with a few thousand services. Use **Problems** or **Unhandled problems**, or choose hosts. **Host Status** shows each host's service counts by state.
- **Up to 25 hosts per tile**: Host Status, Services and Downtimes can be filtered to at most 25 hosts. The Checkmk REST API only accepts GET requests for these lists, so the chosen hosts are sent in the URL, and the web server rejects URLs that are too long (HTTP 414). Leave **Host(s)** empty to include every host.
- **Hosts not yet activated**: hosts added in Checkmk Setup but not yet activated aren't monitored, so they aren't imported.
- **Plugin column**: for active checks, Checkmk's check command includes the check's command-line arguments, which can contain credentials. The plugin shows only the check plugin's name.
- **Metric History**: each selected host is one request to Checkmk, and a request that takes longer than about 28 seconds fails, so a tile can chart at most 10 hosts. A host without the chosen service returns no data instead of an error, based on the service names from the last import, so a service added since then shows no data until the next import. A service that exists but doesn't have the chosen metric ID still returns an error, because that usually means the metric ID is wrong. Metric IDs can differ between check plugins: for example, VMware ESX hosts' **Memory** service has `mem_used` but not `mem_used_percent`, so the Host dashboard charts `mem_used`. Windows agents record CPU utilization as `util_numcpu_as_max`, so on hosts labelled `cmk/os_family:windows` the plugin requests that when the metric is `util`.
- **Very large sites**: hosts are imported in a single request that includes each host's service names. Sites with many thousands of hosts may exceed SquaredUp's 6 MB response limit.
- **Read-only**: the plugin never acknowledges problems, schedules downtimes or changes anything in Checkmk.
