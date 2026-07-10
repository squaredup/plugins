# Proxmox VE Plugin

Monitor your Proxmox VE cluster from SquaredUp. This plugin imports nodes, virtual machines (QEMU/KVM), and LXC containers into the SquaredUp graph and provides dashboards for cluster health, resource utilisation, and per-object metrics.

## What this plugin monitors

**Imported objects:**
- **Proxmox Node** — physical or virtual cluster member nodes
- **Proxmox VM** — QEMU/KVM virtual machines
- **Proxmox Container** — LXC containers

**Out-of-the-box dashboards:**
- **Overview** — cluster-wide resource summary, node health table, VM and container inventory
- **Node perspective** — per-node CPU, memory, and network metrics
- **VM perspective** — per-VM CPU, memory, and disk I/O metrics
- **Container perspective** — per-container CPU, memory, and disk I/O metrics

## Prerequisites

You need a Proxmox VE API token. Tokens are created per-user and can be scoped to read-only access.

**Step 1 — Create an API token:**

1. Log in to your Proxmox VE web UI.
2. Go to **Datacenter → Permissions → API Tokens**.
3. Click **Add**.
4. Select the user (e.g. `monitoring@pam`), enter a Token ID (e.g. `squaredup`), and uncheck **Privilege Separation** if you want the token to inherit the user's permissions.
5. Click **Add** — the token secret (UUID) is shown **once**. Copy it immediately.

**Step 2 — Grant read permissions:**

Assign the `PVEAuditor` role to the token at the datacenter level:

1. Go to **Datacenter → Permissions → Add → API Token Permission**.
2. Set Path to `/`, Token to `monitoring@pam!squaredup`, Role to `PVEAuditor`.
3. Check **Propagate**.

**Note on self-signed certificates:** Proxmox uses a self-signed certificate by default. If your Proxmox host uses a self-signed or internal CA certificate, you may need to configure your SquaredUp agent to trust it, or replace the certificate with one from a trusted CA.

## Configuration fields

| Field | Description | Required |
|---|---|---|
| **Host URL** | Full URL to your Proxmox VE host, including port. Example: `https://192.168.1.100:8006` | Yes |
| **Token ID** | The full API token identifier in the format `USER@REALM!TOKENID`. Example: `monitoring@pam!squaredup` | Yes |
| **Token Secret** | The UUID secret displayed when the token was created. Example: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Yes |

## What gets indexed

| Object type | Source endpoint | Identifier |
|---|---|---|
| Proxmox Node | `/cluster/resources?type=node` | Node name (e.g. `pve1`) |
| Proxmox VM | `/cluster/resources?type=vm` (filtered to `qemu`) | VM ID (e.g. `100`) |
| Proxmox Container | `/cluster/resources?type=vm` (filtered to `lxc`) | Container ID (e.g. `101`) |

## Known limitations

- **Write operations are not supported** — this plugin is read-only.
- **Storage metrics are not included** in v1.
- **RRD time-series data** uses Proxmox's fixed timeframe windows (`hour`, `day`, `week`, `month`) which are mapped to SquaredUp's timeframe picker. Data granularity is pre-aggregated by Proxmox (not raw per-second data).
- **Self-signed TLS** — Proxmox ships with a self-signed certificate. If requests fail with TLS errors, replace the certificate or configure your agent to trust the Proxmox CA.
- **Rate limits** — Proxmox VE does not enforce strict API rate limits, but excessive polling may impact cluster performance.
