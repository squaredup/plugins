Monitor your [myenergi](https://www.myenergi.com) devices in SquaredUp — live power flow, EV charging on the Zappi, hot water diversion on the Eddi, CT readings from the Harvi, and battery state on the Libbi, plus per-minute and hourly energy history — via the myenergi cloud API used by the myenergi app.

> ⚠️ myenergi does not officially support or document this API. It is the same cloud service the myenergi app uses, and myenergi may change it without notice.

## Setup

You will need the **serial number** of your gateway device and a myenergi **API key**. The gateway device is your myenergi hub or, if you have no hub, the Zappi or Eddi connected to your network that acts as one.

1. Sign in to [myenergi myaccount](https://myaccount.myenergi.com) with the account that registered your devices.
2. Go to **Products**, find the gateway device (shown as **Hub**, or as the Zappi or Eddi acting as one), and note its **serial number**.
3. Open that device's **Advanced** section and click **Generate new API key**. Copy the key straight away — it is only shown once.
4. In SquaredUp, enter the serial number in **Hub serial number** and the key in **API key**.

> ⚠️ Generating a new API key revokes the previous one. Anything else using the old key, such as Home Assistant, will need the new key too.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Hub serial number** | The serial of the gateway device. Used as the username for every request. | [myaccount](https://myaccount.myenergi.com) → **Products**. | Yes |
| **API key** | The key generated for the gateway device. Used as the password for every request. | [myaccount](https://myaccount.myenergi.com) → **Products** → gateway device → **Advanced** → **Generate new API key**. | Yes |
| **Server** | The myenergi server to connect to. Leave blank to use `director.myenergi.net`. | Only needed if myenergi support has given you a specific server, e.g. `s18.myenergi.net`. | No |

On save, the plugin signs in and lists the devices registered to the hub. If that fails, check the serial number belongs to the gateway device and that the API key has not been regenerated since you copied it.

## What this plugin monitors

- **Live power flow** — grid import and export, solar generation, total consumption, house load, and the power going to EV charging, hot water and the battery.
- **Device status** — each Zappi, Eddi, Harvi and Libbi with its status, mode, plug state, power, energy, tank temperatures, battery level, voltage and frequency, and whether its data is current.
- **CT clamps** — the live reading and configured type (Grid, Generation, Internal Load and so on) of every current transformer clamp.
- **Energy history** — grid import and export, generation, diverted (surplus) and boosted (grid) energy, and battery charge and discharge, per minute for ranges up to 24 hours and per hour beyond that.
- **Boost schedules** — the boost timers configured on each Zappi and Eddi.

The out-of-the-box dashboards include an **Overview** of the whole site plus a perspective for each **Zappi**, **Eddi**, **Libbi** and **Harvi**.

## Data streams

- **Power Flow** — live power flow for the whole site, as a single row.
- **Device Status** — live status and readings, one row per selected device (any mix of Zappi, Eddi, Harvi and Libbi).
- **CT Readings** — live power on each active CT clamp, one row per clamp on the selected devices.
- **Energy History** — energy or average power over time, one row per selected Zappi, Eddi or Libbi per minute or hour. Use the **Measure** option to switch between energy (kWh) and average power (kW).
- **Boost Schedules** — configured boost timers, one row per timer on the selected Zappi and Eddi devices.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Hub** | `cgi-jstatus-*` | The gateway device the plugin signs in with — a myenergi hub, or the Zappi or Eddi acting as one. |
| **Zappi** | `cgi-jstatus-*` | An EV charger. |
| **Eddi** | `cgi-jstatus-*` | A hot water diverter. |
| **Harvi** | `cgi-jstatus-*` | A wireless CT sensor. |
| **Libbi** | `cgi-jstatus-*` | A home battery. |

Devices are named by type and serial number, for example **Zappi 12345678**. Device lists refresh every 12 hours, so a newly installed device can take that long to appear.

## Known limitations

- **Unofficial API** — myenergi does not document or support this API, and it can change without notice.
- **Read-only** — the plugin never changes modes, boosts, schedules or any other setting on your devices.
- **History range** — energy history is available for up to the last 30 days, this month or last month. Longer ranges aren't offered, because a single request covers at most 31 days.
- **Site totals repeat per device** — every device reports the same grid import, export and generation for the site, so don't sum those columns across devices. Diverted and boosted energy are per device and can be summed.
- **Harvi has no history** — the API provides live readings only for Harvi, so it isn't offered in **Energy History**.
- **Harvi and Libbi are untested** — their streams and dashboards follow the community documentation of the API but have not been verified against real devices.
- **Eddi boost timers** — the Eddi reports some timers without a duration and under timer groups whose meaning isn't documented, so they are labelled by output number.
- **One hub per data source** — add a separate data source for each myenergi hub. Features that need a myenergi account sign-in, such as Libbi grid charging targets, tariffs and vehicles, aren't covered.
