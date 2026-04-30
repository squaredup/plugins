# Before you start

You will need an AutoTask account with admin access to create an API User. API Users are a dedicated account type in AutoTask used for system integrations — they are separate from regular user accounts and do not consume a standard user licence.

## Creating an API User

1. Log in to AutoTask and go to **Admin > Resources/Users (HR) > Resources**
2. Click **New** and select **API User** as the resource type
3. Complete the required fields, including an email address — this becomes the **API Username**
4. Under the **Credentials** section, click **Generate** next to **Integration Code** to create your **API Integration Code**
5. Set a **Password / Secret** — this becomes the **API Secret**
6. Save the record

The API User must have sufficient security permissions to read the entities you want to monitor (Companies, Tickets, Contracts, Projects, Resources, and Survey Results).

## Finding your Zone URL

Your Zone URL is based on the AutoTask data centre your account is hosted on. To find it:

1. Log in to AutoTask and look at the URL in your browser address bar — for example `https://ww14.autotask.net`
2. Replace `ww` with `webservices` to get the API base URL — for example `https://webservices14.autotask.net`

Enter the full base including `https://`.

## Credential field reference

| Field | Where to find it |
|---|---|
| **Zone URL** | Derived from your AutoTask login URL — see above |
| **API Integration Code** | Generated on the API User record under Credentials > Integration Code |
| **API Username** | The email address entered when creating the API User |
| **API Secret** | The password set on the API User record under Credentials |
