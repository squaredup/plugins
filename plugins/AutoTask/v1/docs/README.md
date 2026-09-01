Connect to Datto Autotask PSA to monitor tickets, contracts, projects, resources, and company data.

## Before you start

You will need an Autotask account with admin access to create an API User. API Users are a dedicated account type in Autotask used for system integrations. They are separate from regular user accounts and cannot log in to the Autotask UI.

## Creating an API User

1. Log in to Autotask and go to **Admin > Account Settings & Users > Resources/Users (HR) > Resources/Users**
2. Hover over **New** and select **New API User**
3. Complete the required fields in the **General** section, including **Email Address**. This address is only used to notify you if the integration has a problem, and it is **not** the API Username
4. Set **Security Level** to an API User (API-only) level with read access to the entities you want to monitor
5. In the **Credentials** section, click **Generate Key** to create the **Username (Key)**, and **Generate Secret** to create the **Password (Secret)**. Let Autotask generate both rather than typing your own, so they are formatted correctly
6. In the **API Tracking Identifier** section, select **Squared Up** as your **Integration Vendor** (it's listed with a space, not as "SquaredUp"). Its **API Integration Code** is `FWAABGUO7E7BBHD3PQMLWCGLGY` — enter this value when configuring the plugin
7. Save the record, then copy the Username (Key), Password (Secret) and tracking identifier somewhere safe. The secret cannot be retrieved again after you leave the page

The API User must have sufficient security permissions to read the entities you want to monitor (Companies, Tickets, Contracts, Projects, Resources, and Survey Results).

## Which value is the API Username

This is the most common setup mistake, because the generated Username is formatted like an email address and looks interchangeable with the email address on the General section.

- **Correct:** the **Username (Key)** value from the **Credentials** section, for example `A1B2C3D4E5F6@yourdomain.com`
- **Incorrect:** the **Email Address** field from the **General** section, for example `apiuser@yourdomain.com`

Entering the General section email address results in a 401 error when the configuration is validated.

## Finding your Zone URL

Your Zone URL is based on the Autotask data centre your account is hosted on. To find it:

1. Log in to Autotask and look at the URL in your browser address bar, for example `https://ww14.autotask.net`
2. Replace `ww` with `webservices` to get the API base URL, for example `https://webservices14.autotask.net`

Enter the full base including `https://`.

## Credential field reference

| Field | Where to find it |
|---|---|
| **Zone URL** | Derived from your Autotask login URL. See above |
| **API Username** | API User record > Credentials > **Username (Key)** |
| **API Integration Code** | The **Squared Up** Integration Vendor code is `FWAABGUO7E7BBHD3PQMLWCGLGY` |
| **API Secret** | API User record > Credentials > **Password (Secret)** |
