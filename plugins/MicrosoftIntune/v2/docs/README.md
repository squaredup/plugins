Monitor [Microsoft Intune](https://learn.microsoft.com/intune/intune-service/fundamentals/what-is-intune) managed devices, compliance policies, configuration profiles and apps in SquaredUp, using the [Intune APIs in Microsoft Graph](https://learn.microsoft.com/graph/api/resources/intune-graph-overview).

## Setup

The plugin signs in to Microsoft Graph as an app registration in Microsoft Entra ID, using a client secret. Your tenant needs an Intune licence, and the person granting admin consent needs a role that can consent to Microsoft Graph application permissions, such as **Privileged Role Administrator** or **Global Administrator**.

Grant these Microsoft Graph **application** permissions (not delegated permissions):

| Permission | Required | What it enables |
| --- | --- | --- |
| _DeviceManagementManagedDevices.Read.All_ | Yes | Managed device import, the **Managed Devices**, **Managed Device Details**, **Device Summary**, **Autopilot Deployments**, **Device Compliance Setting States** and **Device App Statuses** data streams, and per-device policy states |
| _DeviceManagementConfiguration.Read.All_ | Yes | Compliance policy and configuration profile import, policy overviews, device statuses, the summary data streams, **Compliance Setting Summaries** and **Compliance Settings** |
| _DeviceManagementServiceConfig.Read.All_ | No | The **Autopilot Devices**, **Enrollment Configurations**, **Apple Push Certificate** and **Apple Enrollment Tokens** data streams |
| _DeviceManagementApps.Read.All_ | No | App import, the **Apps**, **App Install Summaries**, **App Install Summary** and **App Device Statuses** data streams, the **Apps** dashboard and **App** perspective, and the **Apple VPP Tokens** data stream |
| _User.Read.All_ | Only with **Index users** on | User import and the link from each user to the devices they own |

### Reuse an existing app registration

If you already have an app registration for the Microsoft 365 or Microsoft Defender data source, you can use it here. Open it in the [Microsoft Entra admin center](https://entra.microsoft.com), check **API permissions**, add any permission from the table that is missing, and grant admin consent again. Then continue from step 7 below with its IDs and a client secret.

### Create a new app registration

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) and go to **Entra ID → App registrations**.
2. Click **New registration**, give it a name such as `SquaredUp Intune`, leave **Supported account types** as **Accounts in this organizational directory only**, and click **Register**. No redirect URI is needed. See [Register an application](https://learn.microsoft.com/entra/identity-platform/quickstart-register-app) for more detail.
3. On the app's **Overview** page, copy the **Directory (tenant) ID** and the **Application (client) ID**.
4. Go to **API permissions → Add a permission → Microsoft Graph → Application permissions**.
5. Add _DeviceManagementManagedDevices.Read.All_ and _DeviceManagementConfiguration.Read.All_. Add _DeviceManagementServiceConfig.Read.All_ for the Autopilot, enrollment and Apple push certificate and enrollment token data streams, _DeviceManagementApps.Read.All_ for apps, app install status and Apple VPP tokens, and _User.Read.All_ if you plan to turn on **Index users**. The [Microsoft Graph permissions reference](https://learn.microsoft.com/graph/permissions-reference) describes each one.
6. Click **Grant admin consent for _your tenant_** and confirm. Each permission's **Status** should show a green **Granted** tick. See [Grant tenant-wide admin consent](https://learn.microsoft.com/entra/identity/enterprise-apps/grant-admin-consent) if the button is unavailable.
7. Go to **Certificates & secrets → Client secrets → New client secret**, set a description and an expiry, and click **Add**. Copy the secret's **Value** straight away, because it is only shown once. Do not copy the **Secret ID**.
8. Paste the tenant ID, client ID and secret value into the fields below.

> ⚠️ Client secrets expire, after at most 24 months. When the secret expires every check and tile fails with an authentication error. Before the expiry date shown under **Certificates & secrets**, create a new secret and paste it into the **Client secret** field of this data source.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Directory (tenant) ID** | The ID of the Microsoft Entra tenant that holds your Intune data. | App registration → **Overview** → **Directory (tenant) ID**. | Yes |
| **Application (client) ID** | The ID of the app registration the plugin signs in as. | App registration → **Overview** → **Application (client) ID**. | Yes |
| **Client secret** | The secret the plugin uses to get a Microsoft Graph token. | App registration → **Certificates & secrets** → the secret's **Value**, copied when you created it. | Yes |
| **Index users** | Imports Microsoft Entra ID users and relates each one to the managed devices they own. Off by default. Needs _User.Read.All_. | Turn it on here if you want user objects. | No |

When you click **Test and add**, SquaredUp checks access to managed devices, policies, Autopilot and enrollment settings, app management data (for apps, app install status and Apple VPP tokens) and, when **Index users** is on, users. Each check runs separately: a warning on one check means that permission is missing or has no admin consent, and the rest of the data source still works. The Autopilot and enrollment check and the apps check need optional permissions, so a warning on either only affects the objects, dashboards and data streams that use them. A warning on every check usually means the tenant ID, client ID or client secret is wrong, or the secret has expired.

## What this plugin monitors

- **Enrolled devices**: how many devices are enrolled, broken down by operating system, enrollment type and Exchange access state.
- **Device compliance**: the compliance state of every managed device, tenant-wide counts by state, and which policies each device passes or fails.
- **Compliance policies**: for each policy, how many devices succeed, fail, error or are pending, and the status of each device it applies to.
- **Configuration profiles**: the same per-profile view for device configuration profiles, plus a tenant-wide status summary by policy type.
- **Device details**: operating system, model, ownership, encryption, storage and enrollment details for each managed device.
- **Why a device is not compliant**: the failing setting, policy and error behind each non-compliant device, plus tenant-wide results per compliance setting and how devices with no policy are treated.
- **Apps**: every app added to Intune, which apps are failing or pending installation across the tenant, the install state of each app on each device, and the apps targeted at each managed device.
- **Enrollment and Autopilot**: recent Autopilot deployment results and durations, Autopilot device identities and enrollment configurations.
- **Apple connectors**: expiry and sync health of the Apple push certificate, Automated Device Enrollment tokens and VPP tokens, so you can act before Apple devices stop syncing.

The out-of-the-box dashboards are an **Overview** of the whole tenant, an **Enrollment and Apple Connectors** dashboard and an **Apps** dashboard, plus a perspective for each **Managed Device**, **Compliance Policy**, **Configuration Profile** and **App**.

## Data streams

- **Managed Devices**: every managed device with its compliance state, operating system, model, owner and last sync time. Tenant-wide. _Parameters:_ compliance state(s), operating system(s).
- **Compliance Policies**: every device compliance policy with its platform, version and modified date. Tenant-wide.
- **Configuration Profiles**: every device configuration profile with its platform, version and modified date. Tenant-wide.
- **Device Summary**: the number of enrolled devices, MDM and dual enrolled devices, device counts by operating system (including Android enrollment types, Linux, ChromeOS, AOSP and Configuration Manager) and by Exchange access state, in one row. Uses the Microsoft Graph beta API. Tenant-wide.
- **Compliance Summary**: device counts by compliance state across the tenant, in one row. Tenant-wide.
- **Configuration Profile Status Summary**: the number of profiles with errors, one row per profile type (settings catalog and template-based profiles; compliance policies are excluded). Tenant-wide.
- **Compliance Policy Overview**: success, error, failed, pending and not applicable device counts for the selected compliance policy.
- **Configuration Profile Overview**: the same counts for the selected configuration profile.
- **Compliance Policy Device Statuses**: each device the selected compliance policy applies to, with its status, user and last report time. _Parameters:_ include unknown status.
- **Configuration Profile Device Statuses**: each device the selected configuration profile applies to, with the same columns. _Parameters:_ include unknown status.
- **Device Compliance Policy States**: the state of each compliance policy on the selected managed device.
- **Device Configuration States**: the state of each configuration profile on the selected managed device, including settings catalog and administrative template profiles. Uses the Microsoft Graph beta API.
- **Device Compliance Setting States**: each compliance setting that is not compliant on the selected managed device, with its policy, error and user, showing why the device is not compliant. _Parameters:_ include compliant settings.
- **Compliance Setting Summaries**: device counts by status (compliant, not compliant, error, conflict, remediated, not applicable, unknown) for each compliance setting, including the built-in checks _Has a compliance policy assigned_, _Is active_ and _Enrolled user exists_. Tenant-wide.
- **Compliance Settings**: the tenant's compliance settings in one row: how devices with no compliance policy are marked, enhanced jailbreak detection, and the compliance validity period in days. Uses the Microsoft Graph beta API. Tenant-wide.
- **Autopilot Deployments**: recent Windows Autopilot deployments with their state, deployment profile, durations and any failure details. Uses the Microsoft Graph beta API. Tenant-wide.
- **Autopilot Devices**: Windows Autopilot device identities with their enrollment state, serial number, model, group tag, profile assignment and last contact time. Tenant-wide.
- **Enrollment Configurations**: device enrollment configurations such as device limits, platform restrictions, Windows Hello for Business and Enrollment Status Page, with their priority. Tenant-wide.
- **Apple Push Certificate**: the Apple MDM push certificate with its Apple ID, expiry and days until expiry, flagged when it has expired or expires within 30 days. iOS, iPadOS and macOS devices cannot be managed after it expires. Tenant-wide.
- **Apple Enrollment Tokens**: Automated Device Enrollment (ADE) tokens with their expiry, last sync and synced device count, flagged when a token has expired, expires within 30 days or failed its last sync. Uses the Microsoft Graph beta API. Tenant-wide.
- **Apple VPP Tokens**: Apple Volume Purchase Program location tokens with their state, expiry and last sync, flagged when a token has expired, is invalid, is assigned to another MDM, expires within 30 days or failed its last sync. Tenant-wide.
- **Managed Device Details**: the full record for the selected managed device, including hardware, storage, encryption and enrollment details.
- **Apps**: every app added to Intune with its app type, platform, publisher, version and whether it is assigned. Uses the Microsoft Graph beta API. Tenant-wide.
- **App Install Summaries**: installed, failed, pending, not installed and not applicable device and user counts for every app, with its publisher, platform, version and failed device percentage, flagged when installs have failed or are pending and unknown when Intune has no install status for the app. Failed apps are listed first. Uses the Microsoft Graph beta API. Tenant-wide.
- **App Install Summary**: the same device and user install counts for the selected app, in one row, flagged as error when any device failed, warning when installs are pending, and unknown when Intune has no install status for the app. Uses the Microsoft Graph beta API.
- **App Device Statuses**: the install state of the selected app on each device it targets, with failed installs first, plus the error detail and code, user, platform, app version and when the status last changed. Uses the Microsoft Graph beta API. Apps assigned only as available show no rows until a user installs them.
- **Device App Statuses**: the install state, assignment intent and version of each app targeted at the selected managed device through its primary user, with failed installs first. Uses the Microsoft Graph beta API.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Managed Device** | `GET v1.0/deviceManagement/managedDevices` | A device enrolled in Intune, with its operating system, model, manufacturer, ownership, serial number and primary user. |
| **Compliance Policy** | `GET beta/deviceManagement/deviceCompliancePolicies` | A device compliance policy, with its platform and version. |
| **Configuration Profile** | `GET beta/deviceManagement/deviceConfigurations` | A device configuration profile, with its platform and version. |
| **App** | `GET beta/deviceAppManagement/mobileApps` | An app added to Intune, with its type, platform, publisher, assignment and version. Needs _DeviceManagementApps.Read.All_. |
| **User** | `GET v1.0/users` | A Microsoft Entra ID user. Imported only when **Index users** is on. |

**Relationships:** when **Index users** is on, each User links to the managed devices they own.

## Known limitations

- **App-only sign-in**: the plugin only supports a client secret on an app registration. Delegated (user) sign-in and certificate credentials are not supported.
- **Compliance state is not stored on the object**: device compliance changes faster than objects are re-imported, so it is read live by the data streams rather than kept as an object property.
- **Template-based configuration profiles only**: **Configuration Profiles** comes from the device configurations API, so settings catalog and endpoint security policies are not imported and have no **Configuration Profile** perspective.
- **Some data streams use Microsoft Graph beta APIs**: the compliance policy, configuration profile and app import and their per-object data streams, **Configuration Profile Status Summary**, **Device Configuration States**, **Device Summary**, **Compliance Settings**, **Autopilot Deployments**, **Apple Enrollment Tokens**, **Apps**, **App Install Summaries**, **App Install Summary**, **App Device Statuses** and **Device App Statuses** call beta endpoints, which Microsoft can change without notice. Policies and profiles use beta because Graph v1.0 leaves out newer profile types, such as macOS endpoint protection, Wi-Fi and software update profiles, and Windows delivery optimization and identity protection profiles. Apps use beta because v1.0 leaves out newer app types and whether an app is assigned, and **Device Summary** uses beta because v1.0 leaves out the Linux, ChromeOS and AOSP device counts.
- **App install counts can differ between data streams**: **App Install Summary** and **App Install Summaries** come from two separately aggregated Intune reports, so their counts for the same app can differ, most often in the pending count.
- **Apps with no install status show as unknown**: unassigned apps, and apps assigned only as available that nobody has installed yet, have no install status in Intune. They show as unknown with zero counts, and **App Device Statuses** returns no rows for them.
- **App Device Statuses lists devices twice**: Intune returns a device-context record with no user and a record per user, so there are about twice as many rows as devices. Count distinct devices rather than rows to get the number of devices.
- **Device App Statuses comes from the device's primary user**: it reads the primary user's app intent and state for the device, so it has no error code, error detail or last-modified time; use **App Device Statuses** on the **App** perspective for those. Apps targeted only through other users are not shown, and devices with no primary user, such as userless or shared devices, may show an error.
- **Rarer install states are untested**: only _installed_, _failed_, _pending install_ and _unknown_ have been seen in testing. The other mapped states (_not installed_, _uninstall failed_, _not applicable_) follow Microsoft's documented list.
- **App report times are assumed to be UTC**: the Intune app installation report returns its last-changed time with no time zone, so **App Device Statuses** treats it as UTC.
- **Autopilot Deployments shows recent deployments only**: Intune keeps only recent Autopilot deployment events, so older deployments are not listed and an empty list is normal.
- **Autopilot device identities are not imported**: they are read live by **Autopilot Devices**, and link to a managed device only after it enrolls.
- **Device Compliance Setting States makes one request per policy**: Graph does not return setting results in a device's policy list, so the stream makes one extra request for each failing policy on the device, or for every policy when **Include compliant settings** is on.
- **Optional permissions**: without _DeviceManagementServiceConfig.Read.All_ or _DeviceManagementApps.Read.All_, the data streams that need them show "Microsoft Graph refused access to this data (HTTP 403)", and without _DeviceManagementApps.Read.All_ no **App** objects are imported. The rest of the data source still works.
- **Device links in device statuses**: Graph does not return a device ID on policy device status records, so the plugin reads it from the record's ID, which has the form `<tenant ID>_<policy ID>_<device ID>`. If Microsoft changes that format, device names in those rows stop linking to the **Managed Device** object.
- **Status records for removed devices**: Graph keeps policy status records for devices that are no longer managed. They show a blank device name, do not link to a device, and can still count as errors or non-compliant.
- **Configuration profiles list devices twice**: Graph returns a device-context record with no user and a record per user, so **Configuration Profile Device Statuses** has about twice as many rows as devices.
- **Unknown statuses are filtered by the plugin**: Graph cannot filter device statuses by status, so every record is fetched and unknown ones are hidden unless **Include unknown status** is on.
- **No conflict counts on policy overviews**: the policy overview data streams do not report conflicts. A policy shows as an error when any device has an error or failure, and as a success otherwise.
- **Storage and memory blank for some devices**: Intune reports no storage or memory for Android personally owned work profile devices, so those columns are blank.
- **Built-in default compliance policy**: Intune's **Default Device Compliance Policy** shows in a device's compliance policy states but is not a policy object, so it does not link to a **Compliance Policy** perspective.
- **Overview covers up to 50 policies**: the policy overview tiles on the **Overview** dashboard make one request per policy, so they show the first 50 compliance policies and configuration profiles by name.
- **Throttling**: Microsoft Graph limits Intune requests per tenant, and its reporting endpoints have their own limit. Large tenants may see slower imports, and tiles that cover many policies may briefly show "Microsoft Graph is limiting requests for this data".

## Monitoring several tenants

Each data source connects to one Microsoft Entra tenant. Managed service providers can monitor customer tenants with one multi-tenant app registration: set **Supported account types** to accounts in any organizational directory, grant admin consent in each customer tenant, then add one data source per tenant with that tenant's **Directory (tenant) ID** and the same client ID and secret. Combine them in a workspace per customer, or in one workspace for a cross-tenant view.

## Moving from the Microsoft 365 data source

This plugin replaces the Intune option of the Microsoft 365 data source. It uses its own object types and data streams, so existing tiles and dashboards built on the Microsoft 365 Intune data do not move across automatically.

1. Add this data source. You can reuse the Microsoft 365 app registration, as long as it has the permissions in [Setup](#setup).
2. Rebuild any custom tiles with this plugin's data streams, using the table below.
3. Turn off the Intune option on the Microsoft 365 data source so the same devices and policies are not imported twice. If the Microsoft 365 data source still imports users, turning on **Index users** here imports a second copy of each user, which this plugin relates to their devices.

| Microsoft 365 data stream | Replaced by |
| --- | --- |
| _Intune: Managed Devices by Compliance State_ | **Managed Devices** |
| _Intune: Managed Device Properties_ | **Managed Device Details** |
| _Intune: Compliance Policy Summary_ | **Compliance Summary** |
| _Intune: Configuration Policy Summary_ | **Configuration Profile Status Summary** |
| _Intune: Compliance Policy Overview_ | **Compliance Policy Overview** |
| _Intune: Compliance Policy Device Status_ | **Compliance Policy Device Statuses** |
| _Intune: Configuration Policy Overview_ | **Configuration Profile Overview** |
| _Intune: Configuration Policy Device Status_ | **Configuration Profile Device Statuses** |
| _Intune: Compliance Policy Status by Device_ | **Device Compliance Policy States** |
| _Intune: Configuration Policy Status by Device_ | **Device Configuration States** |

Objects are imported again under new types: **Managed Device**, **Compliance Policy**, **Configuration Profile** and **User** replace the _Microsoft 365 Managed Device_, _Device Compliance Policy_, _Device Configuration Policy_ and _User_ types, so scopes and dashboard variables need re-pointing too.

### What is different

- **Sign-in**: only an app registration with a client secret is supported. The Microsoft 365 data source's **Sign in with Microsoft** option has no equivalent here.
- **Complete lists**: device lists and policy device statuses page through every result. The Microsoft 365 data source stopped at 500 rows and showed a "Data incomplete" warning.
- **Managed Devices columns**: a fixed set of columns, filterable by compliance state and operating system, replaces the list of device properties you could pick. Phone number, IMEI and MEID are no longer returned.
- **Configuration Profile Status Summary** covers template-based and settings catalog profiles, one row per profile type. The Microsoft 365 summary covered settings catalog policies only, so it could show no errors when template-based profiles were failing.
- **Device Configuration States** reads the report the Intune admin center uses. It includes settings catalog and administrative template profiles, its states are the report's labels (_Succeeded_, _Error_, _Conflict_, _NotApplicable_), and it avoids the throttling that made the Microsoft 365 data stream slow to load.
- **Policy overview state**: a policy with no errors or failures shows as a success. The Microsoft 365 data source showed a warning when no device had succeeded yet or any device was pending, for example a profile assigned to no devices.
- **Configuration profile grace period**: **Configuration Profile Device Statuses** fills in **Grace Period Ends**. The matching Microsoft 365 column was always empty.
- **Removed devices** in policy device statuses show a blank device name. The Microsoft 365 data source showed a broken link.
- **Compliance state labels** follow the Intune admin center, for example _Not evaluated_ for unknown and _Configuration Manager_ for devices managed by Configuration Manager.
- **Relationships**: users link to the devices they own when **Index users** is on. The Microsoft 365 data source's optional links from policies to devices are not imported; use the policy device status and per-device state data streams instead.
- **Dashboards**: this plugin includes a **Managed Device** perspective; the Microsoft 365 data source listed its equivalent under the wrong name in its dashboard manifest. New dashboards and data streams cover compliance settings, Autopilot, enrollment and Apple connectors.
- **Apps and enrolled device counts are new**: **App** objects, the **Apps** dashboard and **App** perspective, app install status (**App Install Summaries**, **App Install Summary**, **App Device Statuses** and **Device App Statuses**) and **Device Summary** have no equivalent in the Microsoft 365 data source.
