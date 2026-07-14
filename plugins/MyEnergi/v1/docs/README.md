# myenergi

Monitor your [myenergi](https://www.myenergi.com/) home-energy devices in SquaredUp — EV chargers (zappi), solar/heating diverters (eddi), home batteries (libbi) and CT sensors (harvi). The plugin indexes every device on your account and pulls live status, minute-by-minute energy readings and your overall home energy usage.

This plugin uses the **official myenergi 3rd-party API** (`api.s18.myenergi.net`) with OAuth 2.0.

## What this plugin monitors

- **Sites** and **Devices** — your account's sites and every zappi, eddi, libbi, harvi and hub on them, imported as objects you can scope dashboards to, search, and drill into.
- **Device status** — current state (charging, diverting, boosting, idle…), supply/charge mode, live power (grid, generation, diverted/charge power) and, for libbi, battery state of charge.
- **Energy history** — minute-by-minute imported / exported / generated / diverted power for each device over a selected timeframe.
- **Charge sessions** — completed zappi charging sessions with energy delivered, green energy and duration.
- **Overall usage** — a site overview rolling up current power flows and energy across all your devices.

## Prerequisites — getting your API credentials

The official myenergi 3rd-party API uses OAuth 2.0. Unlike the older app API, it does **not** use your hub serial and an app password — it uses an OAuth **Client ID** and **Client secret** issued to a registered application.

1. **Register your application with myenergi.** Client credentials are issued manually. Contact [myenergi support](https://support.myenergi.com/) and request 3rd-party API (OAuth) access. You will need to provide the **redirect URI** shown by SquaredUp on the plugin's configuration screen so myenergi can whitelist it.
2. myenergi will provide a **Client ID** and **Client secret**. Keep the secret safe.
3. When you add the plugin in SquaredUp, enter the Client ID and Client secret, then complete the myenergi sign-in when prompted. This authorises SquaredUp to read your device data.

> Access tokens last 1 day and refresh tokens last 1 year — SquaredUp refreshes them automatically, so you only sign in once.

## Configuration fields

| Field             | What it is                                              | Where to find it                                        | Required |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------- | -------- |
| **Client ID**     | OAuth client identifier for your registered application | Provided by myenergi support when you register your app | Yes      |
| **Client secret** | OAuth client secret paired with the Client ID           | Provided by myenergi support alongside the Client ID    | Yes      |

## What gets indexed

| Object type        | Represents                                 |
| ------------------ | ------------------------------------------ |
| **myenergi Site**  | A site (location) on your myenergi account |
| **myenergi Zappi** | A zappi EV charger                         |
| **myenergi Eddi**  | An eddi solar/heating diverter             |
| **myenergi Libbi** | A libbi home battery                       |
| **myenergi Harvi** | A harvi wireless CT sensor                 |
| **myenergi Hub**   | A myenergi hub / gateway                   |

## Known limitations

- **OAuth registration is manual.** Client credentials must be requested from myenergi support; there is no self-service portal yet.
- **Read-only.** The plugin does not send control commands (change mode, boost, schedules) — it only reads data.
- **Energy history is minute-granularity.** Very long timeframes return large volumes of data; the available timeframes are limited accordingly and the API caps how far back and how wide a single query can be.
- **Charge sessions** are available for **zappi 2+** only and cannot be queried further back than 90 days.
- **eddi** third-party API support is flagged by myenergi as _in development_, so some eddi fields may be incomplete.
- **Harvi and Hub** expose no status or energy endpoints, so they are indexed for inventory only.
