# Before you start

To use this data source, you will need to create OAuth2 API credentials in your NinjaOne portal.

## Create NinjaOne API Credentials

1. Log in to your NinjaOne portal
2. Navigate to **Administration** > **API** > **Add Application**
3. Configure the application:
   - **Application Name**: Enter a descriptive name (e.g., "SquaredUp Integration")
   - **Redirect URI**: Use the URI provided by SquaredUp when adding the data source
   - **Scopes**: Select the following scopes:
     - `monitoring` - Required for device monitoring data
     - `management` - Required for management operations
     - `control` - Required for control operations
     - `offline_access` - Required for refresh tokens
4. Click **Create Application**
5. Copy the **Client ID** and **Client Secret** - you will need these when configuring the plugin in SquaredUp

## Configure the Plugin in SquaredUp

When adding the NinjaOne data source in SquaredUp, you will need to provide:

1. **NinjaOne Instance**: Select your NinjaOne instance region
   - US (us.ninjarmm.com) - United States
   - EU (eu.ninjarmm.com) - Europe
   - Canada (ca.ninjarmm.com) - Canada
   - OC (oc.ninjarmm.com) - Oceania

2. **API Base URL**: Select your NinjaOne API endpoint
   - US (us-api.ninjarmm.com) - United States
   - EU (eu-api.ninjarmm.com) - Europe
   - Canada (ca-api.ninjarmm.com) - Canada
   - OC (oc-api.ninjarmm.com) - Oceania

3. **Client ID**: Paste the Client ID from your NinjaOne API application

4. **Client Secret**: Paste the Client Secret from your NinjaOne API application

## Available Data Streams

This plugin provides the following data streams for monitoring your NinjaOne environment:

### Core Monitoring
- **Devices** - All managed devices with status and organization details
- **Alerts** - Active alerts across all devices
- **Policies** - Configuration policies applied to devices
- **Organizations** - Customer/organization information
- **Activities** - Recent activity log

### Health & Security
- **Device Health** - Comprehensive health overview including threats, patches, and vulnerabilities
- **Antivirus Status** - Antivirus product status and definition updates
- **OS Patches** - OS patch compliance with pending, failed, and installed status
- **Volumes** - Disk volumes with capacity, free space, and BitLocker status

### System Information
- **Disks** - Physical disk inventory with SMART status
- **Network Interfaces** - Network adapters with IP, MAC, and link speed
- **Processors** - CPU information and specifications
- **Operating Systems** - OS details with reboot requirements
- **Software** - Installed software inventory
- **Windows Services** - Windows service status and configurations
- **Logged On Users** - Last logged-on user activity

## Troubleshooting

**Authentication Failed**: Ensure your Client ID and Client Secret are correct and that the redirect URI matches what was configured in NinjaOne.

**No Data Returned**: Verify that the selected API Base URL matches your NinjaOne instance region.

**Insufficient Permissions**: Ensure the API application has all required scopes (`monitoring`, `management`, `control`, `offline_access`).

## Additional Resources

- [NinjaOne API Documentation](https://app.ninjarmm.com/apidocs/)
- [NinjaOne Support](https://support.ninjaone.com/)
