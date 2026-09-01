Monitor device patch posture, policy compliance, and pre-patch risk for one
[Automox](https://www.automox.com) organization via the
[Automox Console API](https://developer.automox.com).

> ⚠️ **Beta plugin.** This is an early release built directly from Automox's
> published API specifications. It has not yet been verified against a live
> Automox tenant — see **Known limitations** below before relying on it.

> ⚠️ This plugin connects to **one Automox organization per data source**. To
> monitor several organizations, add the plugin again with a different
> **Organization ID**.

## Setup

You will need an Automox **API Key** and your organization's numeric **ID**.

1. Sign in to the [Automox console](https://console.automox.com).
2. Go to **Settings → Keys** and create a new API key. The key is generated
   per-user and inherits that user's permissions — use a service account
   with read access to the organization you want to monitor.
3. Copy the generated key and paste it into the **API Key** field below.
4. Find your **Organization ID** — the numeric `o` value shown in the
   console's URL bar when the organization is selected (e.g.
   `console.automox.com/console/organization/123456/...`) — and enter it in
   the **Organization ID** field.

## Configuration fields

| Field                | What it is                                                           | Where to find it                                             | Required |
| --------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- | -------- |
| **API Key**           | Authenticates every request via the `Authorization: Bearer` header.    | Automox console → **Settings → Keys**.                        | Yes      |
| **Organization ID**   | The numeric ID of the organization to monitor.                        | The `o` value in the console URL when that organization is selected. | Yes      |

On save, the plugin validates the key by listing the organizations it can
see; an invalid or expired key fails setup with an authentication error. The
organization's UUID (needed for device inventory) is resolved and cached
automatically — you never need to supply it.

## What this plugin monitors

- **Devices** — OS, connection state, reboot state, compliance state, agent
  version, and detailed per-category inventory.
- **Policies** — patch, required-software and custom (worklet) policies,
  their schedules, and compliance across devices.
- **Pre-patch risk** — pending patch operations by severity, and the devices
  they're pending on.
- **Devices needing attention** — non-compliant devices by severity, and
  their failing policies.

The out-of-the-box dashboards include an **Estate Overview**, **Patch
Posture**, **Policy Compliance** (with a Policy variable), a **Device
Drilldown** perspective, and a **Devices Needing Attention** worklist.

## Data streams

- **Devices** — devices in the organization, with optional filters for
  server group, policy, patch status, pending/managed/exception state.
- **Policies** — patch, required-software and custom policies in the
  organization.
- **Policy Stats** — compliant/non-compliant/pending device counts per
  policy, with a computed compliance percentage.
- **Pre-Patch Summary** — a single-row severity breakdown of pending patch
  operations.
- **Pre-Patch Devices** — one row per device with a pending patch; can be
  filtered to a specific device.
- **Needs Attention Summary** — a single-row severity breakdown of
  non-compliant devices.
- **Devices Needing Attention** — one row per non-compliant device with its
  failing policies; can be filtered to a specific device.
- **Device Inventory** — detailed inventory attributes for a device, filtered
  by category. Issues one API call per device in scope — avoid scoping this
  to the full device estate.

## What gets indexed

| Object type          | API source        | Represents                                   |
| ---------------------- | -------------------- | ----------------------------------------------- |
| **Automox Device**    | `GET /servers`      | A managed endpoint in the organization.       |
| **Automox Policy**    | `GET /policies`     | A patch, required-software, or custom policy. |

**Relationships:** each Device is linked to the Policies applied to it (via
the device's policy status list).

## Known limitations

- **One organization per data source** — add the plugin again, with a
  different Organization ID, to monitor another organization.
- **Pre-Patch total counts operations, not devices** — the same pending
  update on 50 devices counts as 50 in `prepatch.total`.
- **Report streams join on integer device `id`, not `uuid`** — Pre-Patch
  Devices and Devices Needing Attention identify devices by the same
  integer `id` carried on every Device object as a property, not by the
  Device object's actual identity (`uuid`). This means those rows cannot
  graph-drilldown-link directly to a Device object; the optional device
  filter on both streams instead matches against each selected device's
  `id` property in a script. This filtering is unverified against live data.
- **Some policy fields are best-effort** — `uuid`, `status`, `server_count`,
  `create_time` and `next_remediation` are present on patch and custom
  policies but may be absent on required-software policies, per the API
  specification.
- **Organization UUID is resolved and cached automatically** (via `GET
  /orgs`, matched against your configured Organization ID) the first time
  Device Inventory is used. This resolution mechanism is unverified against
  a live tenant.
- **Device→Policy relationship is unverified** — it's built from a
  correlation rule matching each device's list of policy IDs against each
  policy's ID. Whether the platform's `equals` correlation operator does
  array-membership matching for a multi-valued property (rather than exact
  scalar equality) has not been confirmed live.
- **Rate limits** — Automox allows 100 requests/minute by default. On a 429,
  streams surface a message naming when the limit resets rather than
  silently failing; there is no automatic retry.
- **Read-only** — the plugin never creates, modifies, or deletes anything in
  Automox.
- **Not yet verified against a live tenant** — this plugin was built from
  Automox's published OpenAPI specifications without an authenticated test
  session. Response shapes, pagination behavior, and field names should
  match the spec, but haven't been confirmed against real data. Please
  report any stream that doesn't behave as documented.
