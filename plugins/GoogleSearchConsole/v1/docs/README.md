# Before you start

## Prerequisites

- A Google account with access to Google Search Console
- A verified Search Console property (URL-prefix or Domain)
- A Google Cloud Project

## Enabling the Google Search Console API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)

2. Select the project you wish to use

3. Navigate to **APIs & Services** > **Library**

4. Search for **Google Search Console API**

5. Select it and click **Enable**

## Creating OAuth 2.0 Credentials

1. From the [Google Cloud Console](https://console.cloud.google.com/), navigate to **APIs & Services** > **Credentials**

2. Click **+ Create credentials** and select **OAuth client ID**

3. If prompted, configure the OAuth consent screen:

   - Choose **External**
   - Enter the required application details
   - Add the following scope:

     ```text
     https://www.googleapis.com/auth/webmasters.readonly
     ```

4. On the **Create OAuth client ID** page:

   - Select **Web application** as the application type
   - Enter a name for your OAuth client

5. Add authorized JavaScript origins:

   - Click **+ Add URI** under **Authorized JavaScript origins**
   - Enter:

     ```text
     https://app.squaredup.com
     ```

6. Add authorized redirect URIs:

   - Click **+ Add URI** under **Authorized redirect URIs**
   - Enter:

     ```text
     https://app.squaredup.com/settings/pluginsoauth2
     ```

7. Click **Create**

8. Copy the **Client ID** and **Client Secret** that are displayed, save these somewhere secure as you won't be able to view the client secret again

## Which property value to use

Search Console has two property types, entered differently:

- **URL-prefix** — shown as a full `https://…` URL. Use the exact URL **including the trailing slash**: `https://example.com/`. Protocol and subdomain must match exactly.
- **Domain** — shown with a 🌐 globe icon and a bare domain (DNS-verified). Use the `sc-domain:` form with **no protocol or slash**: `sc-domain:example.com`.

Not sure which you have? Check the property selector in Search Console, or call the API's `sites.list` to see the exact string for your account.

## Configuring the plugin

Populate the following fields when configuring the plugin:

| Field | Description |
|---------|---------|
| Search Console property | Your property as it appears in Search Console. URL-prefix: full URL with trailing slash (e.g. `https://example.com/`). Domain: the `sc-domain:` form, no protocol or slash (e.g. `sc-domain:example.com`) |
| Google OAuth client ID | The Client ID created in Google Cloud |
| Google OAuth client secret | The Client Secret created in Google Cloud |
| Sign in | Click to authenticate using a Google account that has access to the Search Console property |

## Example configuration

| Setting | Example |
|---------|---------|
| Search Console property | `https://example.com/` (URL-prefix) or `sc-domain:example.com` (Domain) |
| Google OAuth client ID | `1234567890-example.apps.googleusercontent.com` |
| Google OAuth client secret | `GOCSPX-xxxxxxxxxxxxxxxxxxxx` |

## Troubleshooting

### Authentication fails

Verify that:

- The Google Search Console API is enabled
- The Client ID and Client Secret are correct
- The redirect URI exactly matches:

  ```text
  https://app.squaredup.com/settings/pluginsoauth2
  ```

### Property not found

Verify that:

- The property exists in Google Search Console
- The signed-in Google account has access to the property
- The property value exactly matches the identifier in Search Console
- A **403 "insufficient permission"** despite being an owner usually means the property *type* is wrong — e.g. entering `https://example.com/` for a **Domain** property. Use `sc-domain:example.com` instead (and vice versa)
