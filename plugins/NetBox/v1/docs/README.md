Visualize your [NetBox](https://netboxlabs.com/oss/netbox/) source of truth in SquaredUp: device and site inventory, IP prefix capacity, rack space, data quality gaps, circuits, and the change log. Data comes from the [NetBox REST API](https://netboxlabs.com/docs/netbox/integrations/rest-api/).

The plugin works with **NetBox Community**, **NetBox Enterprise**, and **NetBox Cloud**. All three expose the same REST API, so no edition-specific setup is needed.

## Setup

You need the address of your NetBox instance and an **API token** for a user that can view the objects you want in SquaredUp.

1. Sign in to NetBox in a browser and note the address. Examples: `https://netbox.example.com` for a self-managed instance, or `https://<name>.cloud.netboxapp.com` for NetBox Cloud.
2. Open the user menu (top right) and choose **API Tokens**, then click **Add a token**.
    - On NetBox 4.5 and later, create a **v2** token. NetBox shows the full token as `Bearer nbt_<key>.<secret>`. v1 tokens still work, but they are deprecated and will be removed in a future NetBox release.
    - Leave **Write enabled** unticked. The plugin only reads data.
    - If you set **Allowed IPs**, include the addresses SquaredUp connects from, or the on-premises agent's address.
3. Copy the values immediately. NetBox shows the secret only once.
4. In SquaredUp, enter the address in **NetBox URL**, choose the **Token version**, and paste the token into **Token** exactly as NetBox shows it. Including the leading `Bearer` is fine.

The token inherits the permissions of the user that owns it. Objects the user cannot view are not imported.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **NetBox URL** | The address of the NetBox instance. Do not include `/api`. If you do, it is removed automatically. | The address bar when NetBox is open in a browser. | Yes |
| **Token version** | The NetBox API token format. **v2** sends `Authorization: Bearer nbt_<key>.<token>`. **v1** sends `Authorization: Token <token>`. | v2 tokens require NetBox 4.5 or later. | Yes |
| **Token** | The API token. For v2, paste the full value NetBox shows (`Bearer nbt_<key>.<secret>`). The `Bearer` prefix is optional. For v1, paste the 40-character token. | NetBox → user menu → **API Tokens**. | Yes |
| **Key** | The public key of a v2 token. Only needed if **Token** contains just the secret, without the `nbt_<key>.` prefix. Shown only when **Token version** is v2. | NetBox → user menu → **API Tokens**. | No |
| **Ignore certificate errors** | Skips TLS certificate validation. Only tick this for self-managed instances that use a self-signed or private CA certificate (common on new NetBox Enterprise installs). | n/a | No |

When you save, the plugin calls the NetBox status endpoint. A failure means the address is unreachable, the token is invalid, expired or disabled, or the token's **Allowed IPs** blocks SquaredUp.

## What this plugin monitors

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

<!-- finalized in Phase 9 -->
