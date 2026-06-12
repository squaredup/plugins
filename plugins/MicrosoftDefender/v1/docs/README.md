# Configuring the data source

**Display name:** 

Enter a name for your data source. This helps you to identify this data source in the list of your data sources.

**Authentication:** 

Client credentials are required to configure this plugin. Follow the same steps explained in the Microsoft 365 article [Configuring App Registration for the Microsoft 365 Plugin](https://docs.squaredup.com/data-sources/microsoft-365-plugin/configuring-app-registration-for-the-microsoft-365-plugin). Ensure to add the following permissions below to configure your app for Defender:

- _SecurityAlert.Read.All_
- _SecurityIncident.Read.All_
- _ThreatHunting.Read.All_
- _SecurityEvents.Read.All_

Once this is completed, fill in the details below:

- _Directory (Tenant) ID_
- _Application (Client) ID_
- _Client Secret_

Click Test and add to validate the data source configuration. SquaredUp will now attempt to connect using the provided authentication details.

# Testing and troubleshooting

If you encounter an error refer to the errors and warnings reported on the data source configuration screen.

For errors on dashboard tiles see [Troubleshooting tiles](https://docs.squaredup.com/troubleshooting/troubleshooting-tiles).

# Next Steps

Once you have successfully connected to the data source, you can start exploring your imported objects and using your data streams to create data tiles on your dashboards. Take a look at the pre-installed dashboards to see examples of how you can visualize your data.

## Dashboards

The following pre-built dashboards are available with this plugin:

- **Cockpit** — Tenant-wide security overview, showing your current and historical Secure Score, device exposure state, active incidents, and some example detections by category (application control, exploits, persistence & privilege escalation, and malware & antivirus).
- **Devices Health** — Device fleet health, with counts of high- and medium-exposure devices, devices with critical vulnerabilities, and non-compliant devices.
- **Incidents** — Incident operations view, showing active and unassigned incidents, average time to resolve, and incidents broken down by severity, status, and priority score.
- **Devices** — Tiles will appear when you drill into a **Device** object:
    - **Device Status** — Exposure level, sensor health state, onboarding status, last seen time, and device attributes and properties for the selected device.
    - **Vulnerabilities** — Critical and high vulnerability counts, a severity breakdown, affected software, and the full list of vulnerabilities for the selected device.
    - **Recommendations** — Active security configuration recommendations for the selected device, grouped by configuration category and impact.

## Graph imported objects
The following objects are imported:

- **Devices** — Contains property data about each of the devices managed by the connected Defender instance.

## Data streams
The following data streams are installed with this plugin:

- **Advanced Hunting Query** — Queries a specified set of data supported by Defender to proactively look for specific threats in your environment. *Parameters:*
    - *Query*: the KQL query to run.
- **Secure Score History** — Retrieves the current tenant's Secure Score data from the past 90 days.
- **Recommendations** — Returns recommendations data for the specified device.
- **Vulnerabilities** — Returns vulnerabilities data for the specified device.
- **Devices** — Returns detailed attributes and properties for the specified device.
- **Alerts** — Returns a list of alert resources created to track suspicious activities in an organization. *Parameters:*
    - Filters available: *Severity, Status*
- **Incidents** — Returns a list of incident objects that Microsoft Defender created to track attacks in an organization. *Parameters:*
    - Filters available: *Severity, Status*


