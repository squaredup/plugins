# Google Health

Bring your personal fitness, activity, sleep, body, heart-rate and nutrition data from the **Google Health API** into SquaredUp. The Google Health API is the next-generation replacement for the legacy Fitbit Web API and serves data from Fitbit devices, Google Pixel watches and other connected sources, all through Google's OAuth 2.0 platform.

This plugin turns that data into dashboards you can explore — daily activity and calorie totals, weight and resting-heart-rate trends over time, sleep sessions, workouts and daily nutrition — and lets you drill down into the underlying figures.

## What this plugin monitors

The plugin imports two object types into SquaredUp:

| Object type | What it represents |
| ----------- | ------------------ |
| **Google Health User** | The authenticated account holder — profile, goals, timezone and identity. Everything you see is that one person's data. |
| **Google Health Device** | Each paired Fitbit tracker or Pixel watch, with its battery level, last sync time and firmware version. |

From those objects the plugin exposes data streams covering:

- **Daily metrics** (steps, distance, floors, active zone minutes, calories, resting heart rate, weight, body fat, VO₂ max, SpO₂, respiratory rate, HRV, hydration) — one configurable stream that powers every "over time" trend chart.
- **Nutrition** — daily calories in, carbohydrates, fat, protein and water.
- **Heart-rate zones** — minutes and calories spent in each zone per day.
- **Sleep sessions** — start, end, duration, efficiency and time in each sleep stage.
- **Workouts** — exercise sessions with type, duration, distance, calories and heart rate.
- **Intraday heart rate** — heart rate through the day at a chosen resolution.
- **Profile & devices** — current profile details and paired-device status.

The plugin ships ready-made **Activity**, **Diet & Nutrition**, **Trends Over Time** and **Sleep** dashboards, plus per-user and per-device perspectives.

## Prerequisites — getting your credentials

The Google Health API uses Google OAuth 2.0. You need a Google Cloud project with the API enabled and an OAuth client, and your Google account must have health data (from a Fitbit or Pixel device).

1. **Create / choose a Google Cloud project** at <https://console.cloud.google.com/>.
2. **Enable the Google Health API** — in the Cloud console go to *APIs & Services → Library*, search for **Google Health API**, and click **Enable**.
3. **Configure the OAuth consent screen** — *APIs & Services → OAuth consent screen*:
   - User type **External**.
   - Add the scopes this plugin uses (all read-only):
     - `https://www.googleapis.com/auth/googlehealth.profile.readonly`
     - `https://www.googleapis.com/auth/googlehealth.settings.readonly`
     - `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly`
     - `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`
     - `https://www.googleapis.com/auth/googlehealth.sleep.readonly`
     - `https://www.googleapis.com/auth/googlehealth.nutrition.readonly`
   - While the consent screen is in **Testing** mode, add your own Google account under **Test users** — this lets you authenticate without full Google verification. (Publishing to production for other users requires Google's sensitive-scope verification.)
4. **Create an OAuth client ID** — *APIs & Services → Credentials → Create credentials → OAuth client ID*:
   - Application type **Web application**.
   - Add SquaredUp's OAuth redirect URL as an **Authorized redirect URI**. SquaredUp shows this URL on the plugin's sign-in step when you add the plugin — copy it from there into the Cloud console.
   - Copy the generated **Client ID** and **Client secret**.

## Configuration fields

When you add the plugin in SquaredUp you'll be asked for:

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Google OAuth client ID** | The OAuth 2.0 client ID for your Google Cloud project | Cloud console → *Credentials* → your OAuth client | Yes |
| **Google OAuth client secret** | The matching client secret | Cloud console → *Credentials* → your OAuth client | Yes |
| **Sign in with Google Health** | Launches Google's sign-in so you can grant access | — click it and complete Google sign-in | Yes |

After entering the client ID and secret, click **Sign in with Google Health**, choose your Google account and approve the requested health permissions. SquaredUp stores a refresh token and renews access automatically.

## What gets indexed

- **Google Health User** — one object representing you, with your display name, timezone and average daily step goal.
- **Google Health Device** — one object per paired tracker/watch, with battery, sync and version details.

## Goals and monitoring

The plugin's gauges measure progress against the targets you set in the **Daily goals** section of the plugin configuration (steps, calories, protein, water and so on) — edit the configuration and save to change them.

Every gauge also ships with a pre-configured health monitor (green when you hit your goal, amber when slightly off, red when well off). **Monitors are dormant on the built-in dashboards** — this is standard SquaredUp behaviour for out-of-the-box content, so a plugin never generates monitoring load or notifications you didn't ask for. To activate them, open a dashboard and use **Copy dashboard**: your copy's gauges will show live health states and can raise notifications.

## Known limitations

- **One account per configuration.** The Google Health API is strictly single-user (`users/me`), so each plugin configuration surfaces exactly one person's data. Add a separate configuration per account.
- **Read-only.** The plugin only reads data; it never writes, edits or deletes health data.
- **Aggregation range caps.** The API caps daily roll-up requests at **90 days** for most metrics and **14 days** for heart-rate–derived metrics (heart rate, active minutes, heart-rate zones). Daily streams therefore offer timeframes up to those limits — very long ranges (e.g. a full year) aren't available in a single query. Longer-term trends are best viewed month-by-month.
- **Rate limits.** Google enforces roughly **300 requests per user per minute**; exceeding it returns HTTP 429. The plugin's dashboards stay well within this, but very frequent manual refreshes across many tiles can hit it briefly.
- **Data depends on the device.** Metrics only appear if your device records them — e.g. SpO₂, VO₂ max, HRV and sleep stages require a compatible Fitbit/Pixel device and recent sync.
- **Sensitive scopes.** Sharing this plugin with other users in production requires completing Google's OAuth verification for the health scopes. In Testing mode it works immediately for accounts added as test users.
