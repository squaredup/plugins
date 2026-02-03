# Google Sheets

## Prerequisites

- A Google Cloud Platform account
- A Google Cloud Project


## Enabling Google APIs

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)

2. Select the Project you wish to use

3. Enable the [Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com)

4. Enable the [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)

## Creating OAuth 2.0 Credentials

1. From the [Google Cloud Console](https://console.cloud.google.com/), navigate to **APIs & Services** > **Credentials**

2. Click **+ Create credentials** and select **OAuth client ID**

3. On the **Create OAuth client ID** page:
    - Select **Web application** as the application type
    - Enter a name for your OAuth client

4. Add authorized JavaScript origins:
    - Click **+ Add URI** under **Authorized JavaScript origins**
    - Enter: `https://app.squaredup.com`

5. Add authorized redirect URIs:
    - Click **+ Add URI** under **Authorized redirect URIs**
    - Enter: `https://app.squaredup.com/settings/pluginsoauth2`

6. Click **Create**

7. Copy the **Client ID** and **Client Secret** that are displayed
