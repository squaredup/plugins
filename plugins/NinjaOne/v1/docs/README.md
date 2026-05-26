# Before you start

To use this data source, you will need to create OAuth2 API credentials in your NinjaOne portal.

## Create NinjaOne API Credentials

1. Log in to your NinjaOne portal.
2. Navigate to **Administration** > **Apps** > **API** and click **Add**.
3. When prompted to choose an **Application Platform**, select **API Services**. This is what enables the Client Credentials grant type the plugin uses — **there is no separate "Client Credentials" checkbox to tick on the next screen.**
4. On the **Client app** screen, fill in:
    - **Name**: A descriptive name (e.g., "SquaredUp Integration").
    - **Redirect URIs**: `https://app.squaredup.com/settings/pluginsoauth2`
    - **Scopes**: Tick all three:
        - `Monitoring` — required for device monitoring data
        - `Management` — required for management operations
        - `Control` — required for control operations
    - **Allowed grant types**: `Refresh token` is **not** required by the plugin and can be left unticked.
5. Save the application. NinjaOne will then show the **Client ID** and **Client Secret** — copy both, as you'll need them when configuring the plugin in SquaredUp. (The Client Secret is only shown once on creation; if you lose it, use **Generate new secret** to issue a new one.)

## Configure the Plugin in SquaredUp

When adding the NinjaOne data source in SquaredUp, you will need to provide:

1. **Region**: Select your NinjaOne instance region (US, EU, Canada, or OC). The API URL will be automatically configured based on your selection.

2. **Client ID**: Paste the Client ID from your NinjaOne API application

3. **Client Secret**: Paste the Client Secret from your NinjaOne API application

That's it! The plugin will automatically authenticate using Client Credentials flow when you save the configuration.

## Available Data Streams

This plugin provides the following data streams for monitoring your NinjaOne environment:

### Core Monitoring

- **Devices** - All managed devices with status and organization details
- **Alerts** - Active alerts across all devices
- **Policies** - Configuration policies applied to devices
- **Organizations** - Customer/organization information
- **Activities** - Recent activity log
- **Device Groups** - Device groups for filtering and organization
- **Locations** - Organization locations and sites

### Health & Security

- **Device Health** - Comprehensive health overview including threats, patches, and vulnerabilities
- **Antivirus Status** - Antivirus product status and definition updates
- **Antivirus Threats** - Detected antivirus threats with quarantine status
- **OS Patches** - OS patch compliance with pending, failed, and installed status
- **Software Patches** - Third-party software patch compliance (Chrome, Adobe, etc.)
- **Volumes** - Disk volumes with capacity, free space, and BitLocker status
- **Backup Usage** - Backup storage usage by organization and location

### System Information

- **Disks** - Physical disk inventory with SMART status
- **Network Interfaces** - Network adapters with IP, MAC, and link speed
- **Processors** - CPU information and specifications
- **Operating Systems** - OS details with reboot requirements
- **Computer Systems** - Hardware information including manufacturer, model, and serial number
- **Software** - Installed software inventory
- **Windows Services** - Windows service status and configurations
- **Logged On Users** - Last logged-on user activity

### Operations & Automation

- **Tasks** - Scheduled and running automation tasks
- **Jobs** - Script and patch job execution status
- **Policy Overrides** - Device policy exceptions and overrides

### Ticketing

- **Ticket Boards** - Ticketing boards for organizing and viewing tickets
- **Tickets** - Tickets from a specific board (scoped to Ticket Board)

## Troubleshooting

**Authentication Failed**: Verify your Client ID and Client Secret are correct. Also check that your NinjaOne client app was created with the **API Services** application platform — this is what makes Client Credentials the active grant type. There is no separate "Client Credentials" checkbox in the client app screen; if you picked a different platform (e.g. Web app), the OAuth token request will fail.

**No Data Returned**: Verify that the selected API Region matches your NinjaOne instance region.

**Insufficient Permissions**: Ensure the API application has all required scopes (`Monitoring`, `Management`, `Control`).

## Additional Resources

- [NinjaOne API Documentation](https://app.ninjarmm.com/apidocs/)
- [NinjaOne Support](https://support.ninjaone.com/)
