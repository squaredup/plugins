# Before you start

To use this data source, you will need to create OAuth2 API credentials in your NinjaOne portal.

## Create NinjaOne API Credentials

1. Log in to your NinjaOne portal
2. Navigate to **Administration** > **API** > **Add Application**
3. Configure the application:
    - **Application Name**: Enter a descriptive name (e.g., "SquaredUp Integration")
    - **Allowed Grant Types**: Ensure "Client Credentials" is enabled
    - **Scopes**: Select the following scopes:
        - `monitoring` - Required for device monitoring data
        - `management` - Required for management operations
        - `control` - Required for control operations
        - `offline_access` - Required for refresh tokens
4. Click **Create Application**
5. Copy the **Client ID** and **Client Secret** - you will need these when configuring the plugin in SquaredUp

## Configure the Plugin in SquaredUp

When adding the NinjaOne data source in SquaredUp, you will need to provide:

1. **Region**: Select your NinjaOne instance region (US, EU, Canada, or OC). The API URL will be automatically configured based on your selection.

2. **Client ID**: Paste the Client ID from your NinjaOne API application

3. **Client Secret**: Paste the Client Secret from your NinjaOne API application

4. **NinjaOne Ticketing Module**: Leave this set to **Enabled** (the default) if your NinjaOne tenant has the optional Ticketing add-on enabled. Set it to **Disabled** if your tenant does not — otherwise the import will fail with the error `Ninja Ticketing Integration is not enabled`. When disabled, the **Ticket Boards** and **Tickets** data streams (and the OOB Ticket Board dashboard) will return no data.

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

**Authentication Failed**: Ensure your Client ID and Client Secret are correct and that "Client Credentials" is enabled as an allowed grant type in your NinjaOne API application.

**No Data Returned**: Verify that the selected API Region matches your NinjaOne instance region.

**Insufficient Permissions**: Ensure the API application has all required scopes (`monitoring`, `management`, `control`, `offline_access`).

## Additional Resources

- [NinjaOne API Documentation](https://app.ninjarmm.com/apidocs/)
- [NinjaOne Support](https://support.ninjaone.com/)
