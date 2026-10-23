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

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

<!-- finalized in Phase 9 -->
