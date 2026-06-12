# Before you start

## Prerequisites

- A Google account with access to Google Search Console
- A verified URL-prefix property in Google Search Console
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
      ```
      https://www.googleapis.com/auth/webmasters.readonly
      ```

4. On the **Create OAuth client ID** page:
    - Select **Web application** as the application type
    - Enter a name for your OAuth client

5. Add authorized JavaScript origins:
    - Click **+ Add URI** under **Authorized JavaScript origins**
    - Enter:
      ```
      https://app.squaredup.com
      ```

6. Add authorized redirect URIs:
    - Click **+ Add URI** under **Authorized redirect URIs**
    - Enter:
      ```
      https://app.squaredup.com/settings/pluginsoauth2
      ```

7. Click **Create**

8. Copy the **Client ID** and **Client Secret** that are displayed, save these somewhere secure as you won't be able to view the client secret again

## Configuring the plugin

Populate the following fields when configuring the plugin:

| Field | Description |
|---------|---------|
| Search Console property URL | The exact URL-prefix property from Google Search Console (for example, `https://example.com/`) |
| Google OAuth client ID | The Client ID created in Google Cloud |
| Google OAuth client secret | The Client Secret created in Google Cloud |
| Sign in | Click to authenticate using a Google account that has access to the Search Console property |

## Example configuration

| Setting | Example |
|---------|---------|
| Search Console property URL | `https://example.com/` |
| Google OAuth client ID | `1234567890-example.apps.googleusercontent.com` |
| Google OAuth client secret | `GOCSPX-xxxxxxxxxxxxxxxxxxxx` |

## Troubleshooting

### Authentication fails

Verify that:

- The Google Search Console API is enabled
- The Client ID and Client Secret are correct
- The redirect URI exactly matches:
  ```
  https://app.squaredup.com/settings/pluginsoauth2
  ```

### Property not found

Verify that:

- The property exists in Google Search Console
- The signed-in Google account has access to the property
- The property URL exactly matches the URL entered in the plugin configuration