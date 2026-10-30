Monitor Microsoft Defender alerts, incidents, Secure Score and vulnerability exposure, and, when your licence includes advanced hunting, your devices and threat detections.

## Before you start

Each part of this plugin needs its own application permission, and vulnerability management and advanced hunting also need the right licence. Grant only the permissions for the data you want. Anything you leave out shows as a warning during setup and does not stop you adding the data source.

| Capability | Permission | Licence | What it enables |
| --- | --- | --- | --- |
| Alerts | _SecurityAlert.Read.All_ | Any Microsoft Defender product, including Plan 1 tiers | **Alerts** data stream, alert tiles on the **Overview** dashboard |
| Incidents | _SecurityIncident.Read.All_ | Any Microsoft Defender product, including Plan 1 tiers | **Incidents** data stream and dashboard, incident tiles on the **Overview** dashboard |
| Secure Score | _SecurityEvents.Read.All_ | Any Microsoft 365 tenant | **Secure Score History** data stream, Secure Score tiles on the **Overview** dashboard |
| Vulnerability management | _Vulnerability.Read.All_ (WindowsDefenderATP API, not Microsoft Graph) | A licence with vulnerability management, such as Microsoft Defender for Business, Microsoft 365 Business Premium or Microsoft Defender for Endpoint Plan 2. Advanced hunting is not needed | **Vulnerability Exposures** data stream and **Vulnerability Exposure** dashboard |
| Advanced hunting | _ThreatHunting.Read.All_ | A licence with advanced hunting, such as Microsoft Defender for Endpoint Plan 2 or Microsoft Defender for Office 365 Plan 2 | **Advanced Hunting Query** data stream, for the tables your licence covers |
| Advanced hunting on devices | _ThreatHunting.Read.All_ | A licence with advanced hunting on device data, such as Microsoft Defender for Endpoint Plan 2 | Device import, the **Advanced Hunting** dashboards, and the **Devices**, **Vulnerabilities** and **Recommendations** data streams |

> [!NOTE]
> Microsoft Defender for Endpoint Plan 1, Microsoft Defender for Business and Microsoft Defender for Office 365 Plan 1 do not include advanced hunting. With these licences, use the **Overview** and **Incidents** dashboards, plus the **Vulnerability Exposure** dashboard with Microsoft Defender for Business.

## Configuring the data source

Client credentials are required to configure this plugin. Follow the steps in [Configuring App Registration for the Microsoft 365 Plugin](https://docs.squaredup.com/data-sources/microsoft-365-plugin/configuring-app-registration-for-the-microsoft-365-plugin) to create the app registration and client secret. When you add API permissions, add only the application permissions you chose from the table above, not the permission list in that article, which covers the wider Microsoft 365 plugin. Most are under **Microsoft Graph**. _Vulnerability.Read.All_ is under **APIs my organization uses** > **WindowsDefenderATP**. Grant admin consent after adding them.

Then fill in the details below:

- **Directory (tenant) ID**
- **Application (client) ID**
- **Client secret**

Click **Test and add** to validate the data source configuration. SquaredUp checks each permission separately.

## Testing and troubleshooting

- **A warning on one check** means that permission or licence is missing. The data source still works for everything else. See [Before you start](#before-you-start) for what each check enables.
- **A warning on every check** usually means the tenant ID, client ID or client secret is wrong, or the client secret has expired.
- **No devices imported** means advanced hunting on device data is not available. This is expected without a licence that includes it.
- **The vulnerability management check fails** when _Vulnerability.Read.All_ is missing or has no admin consent, or when the tenant has no Defender for Endpoint or Defender for Business.

For errors on dashboard tiles see [Troubleshooting tiles](https://docs.squaredup.com/troubleshooting/troubleshooting-tiles).

## Dashboards

The following dashboards work with any licence, as long as the matching permissions are granted:

- **Overview**: Current and historical Secure Score, active incidents, and active alerts by severity, service and category, with a list of active high severity alerts.
- **Incidents**: Active and unassigned incidents, average time to resolve, and incidents broken down by severity, status and priority score.

The following dashboard needs vulnerability management, but not advanced hunting:

- **Vulnerability Exposure**: Critical and high severity CVEs, exposed devices and vulnerable software, the most exposed CVEs and software, and a list of every critical and high exposure.

The **Advanced Hunting** folder holds dashboards that need advanced hunting on device data:

- **Threat Detections**: Example detections by category: application control, exploits, persistence and privilege escalation, and malware and antivirus.
- **Devices Health**: Counts of high and medium exposure devices, devices with critical vulnerabilities, non-compliant devices, and device exposure state.
- **Device Status**, **Vulnerabilities** and **Recommendations**: Appear when you drill into a **Device** object, and show its exposure, sensor health and attributes, its vulnerabilities, and its active security configuration recommendations.

## Imported objects

The following objects are imported when advanced hunting on device data is available:

- **Devices**: Each device managed by the connected Defender instance.

## Data streams

These data streams work with any licence:

- **Alerts**: Alerts created to track suspicious activities in an organization. *Parameters:* Severity, Status.
- **Incidents**: Incidents that Microsoft Defender created to track attacks in an organization. *Parameters:* Severity, Status.
- **Secure Score History**: The tenant's Secure Score over the past 90 days.

This data stream needs vulnerability management, but not advanced hunting:

- **Vulnerability Exposures**: Vulnerabilities found across all devices, one row per device, software and CVE, with the fixing KB when there is one. Devices are identified by their Defender device ID. *Parameters:* Severity.

This data stream needs advanced hunting, and returns data for the tables your licence covers:

- **Advanced Hunting Query**: Runs a KQL query to proactively look for threats in your environment. *Parameters:* Query.

These data streams need advanced hunting on device data:

- **Devices**: Attributes and properties for the selected device.
- **Vulnerabilities**: Vulnerabilities for the selected device.
- **Recommendations**: Security configuration recommendations for the selected device.
