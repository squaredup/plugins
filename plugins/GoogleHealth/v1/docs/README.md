# Before you start

## Prerequisites

- A Google account with health data from a Fitbit tracker or Pixel watch
- A Google Cloud Project

## Enabling the Google Health API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)

2. Select the project you wish to use

3. Navigate to **APIs & Services** > **Library**

4. Search for **Google Health API**

5. Select it and click **Enable**

> **Note:** If you cannot see the Google Health API in the library, it can also be enabled by following the steps at <https://developers.google.com/health/setup>

## Creating OAuth 2.0 Credentials

1. From the [Google Cloud Console](https://console.cloud.google.com/), navigate to **APIs & Services** > **Credentials**

2. Click **+ Create credentials** and select **OAuth client ID**

3. If prompted, configure the OAuth consent screen:

   - Choose **External**
   - Enter the required application details
   - Add the following read-only scopes:

     ```text
     https://www.googleapis.com/auth/googlehealth.profile.readonly
     https://www.googleapis.com/auth/googlehealth.settings.readonly
     https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly
     https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly
     https://www.googleapis.com/auth/googlehealth.sleep.readonly
     https://www.googleapis.com/auth/googlehealth.nutrition.readonly
     ```

   - While the consent screen is in **Testing** mode, add your own Google account under **Test users** — this lets you authenticate without completing Google's sensitive-scope verification

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

## Configuring the plugin

Populate the following fields when configuring the plugin:

| Field | Description |
|---------|---------|
| Google OAuth client ID | The Client ID created in Google Cloud |
| Google OAuth client secret | The Client Secret created in Google Cloud |
| Sign in with Google Health | Click to authenticate using the Google account whose health data you want to monitor |

### Daily goals

The Google Health API does not expose the goals you have set in the Fitbit app, so they cannot be imported — enter them manually in the **Daily goals** section of the plugin configuration. Gauges fill towards these targets and their health status (green / amber / red) is measured against them. Leave any field blank to use the default shown.

| Goal | Default |
|---------|---------|
| Steps goal | 10000 |
| Distance goal (km) | 8 |
| Active calories goal | 600 |
| Active zone minutes goal | 22 |
| Sleep goal (hours) | 8 |
| Water goal (mL) | 2000 |
| Calorie budget (kcal) | 2500 |
| Protein goal (g) | 130 |
| Carbohydrate budget (g) | 250 |
| Fat budget (g) | 70 |

To change a goal later, edit the data source configuration and save — dashboards pick up the new targets on their next refresh.

## Example configuration

| Setting | Example |
|---------|---------|
| Google OAuth client ID | `1234567890-example.apps.googleusercontent.com` |
| Google OAuth client secret | `GOCSPX-xxxxxxxxxxxxxxxxxxxx` |
| Steps goal | `10000` |

## Troubleshooting

### Authentication fails

Verify that:

- The Google Health API is enabled
- The Client ID and Client Secret are correct
- The redirect URI exactly matches:

  ```text
  https://app.squaredup.com/settings/pluginsoauth2
  ```

- If the OAuth consent screen is in **Testing** mode, the signed-in Google account is listed as a test user

### Some metrics show no data

Verify that:

- Your device records the metric — SpO₂, VO₂ max, HRV and sleep stages require a compatible Fitbit or Pixel device
- The device has synced recently via the Fitbit app

### Goals look wrong

Goals are not imported from your Google account — set them manually in the **Daily goals** section of the plugin configuration.

### Long timeframes return errors

The API caps daily roll-up requests at 90 days for most metrics and 14 days for heart-rate–derived metrics, and enforces a rate limit of roughly 300 requests per user per minute (HTTP 429 when exceeded). Use shorter timeframes and avoid rapidly refreshing many tiles.
