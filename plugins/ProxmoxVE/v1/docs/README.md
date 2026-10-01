Monitor your Proxmox VE cluster — and optionally the Proxmox Backup Server that backs it up — from SquaredUp. This plugin imports nodes, virtual machines (QEMU/KVM), LXC containers, backup datastores, and backup groups into the SquaredUp graph, and provides dashboards for cluster health, resource utilisation, and backup health.

## Prerequisites

### Proxmox VE

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

**Note on self-signed certificates:** Proxmox uses a self-signed certificate by default. If your Proxmox host uses a self-signed or internal CA certificate, you may need to configure your SquaredUp agent to trust it, replace the certificate with one from a trusted CA, or enable the **Ignore certificate errors** option below.

### Proxmox Backup Server (optional)

If you also want to monitor a Proxmox Backup Server (PBS) instance, enable the **Monitor a Proxmox Backup Server** toggle when configuring this plugin and create a second, separate API token on the PBS side.

**Step 1 — Create an API token:**

1. Log in to your Proxmox Backup Server web UI.
2. Go to **Configuration → Access Control → API Token**.
3. Click **Add**.
4. Select or create the user (e.g. `monitoring@pbs`), enter a Token ID (e.g. `squaredup`), and uncheck **Privilege Separation** if you want the token to inherit the user's permissions.
5. Click **Add** — the token secret is shown **once**. Copy it immediately.

**Step 2 — Grant read permissions to both the user and the token:**

Proxmox Backup Server calculates an API token's permissions from ACL entries granted to the **token itself**, capped by whatever its underlying **user** also has — a permission granted only to one or only to the other is not enough. Grant the `Audit` role at path `/` to **both**:

1. Go to **Configuration → Access Control → Permissions → Add → API Token Permission**, set Path to `/`, User/Token to your token (e.g. `monitoring@pbs!squaredup`), Role to `Audit`, and check **Propagate**.
2. Repeat for the plain user (e.g. `monitoring@pbs`, without the `!tokenname` suffix) at the same path.

Without the second grant, most of the plugin (datastores, backup groups, snapshots) still works, but the **Maintenance Tasks** tile will only show tasks the token itself performed — Proxmox Backup Server restricts a caller to seeing only its own tasks unless it (and its user) holds broader-than-read-only privilege on tasks run by other users, so `Audit` on both is the least-privilege combination that surfaces the full task history (e.g. scheduled Garbage Collection/Prune/Verify jobs typically run as `root@pam`, not your monitoring user).

**Note on self-signed certificates:** the plugin's single **Ignore certificate errors** option (above) applies to both the Proxmox VE and Proxmox Backup Server connections.

## What this plugin monitors

**Imported objects:**
- **Proxmox Node** — physical or virtual cluster member nodes
- **Proxmox VM** — QEMU/KVM virtual machines
- **Proxmox Container** — LXC containers
- **Proxmox Backup Datastore** — a backup storage pool on a Proxmox Backup Server *(optional — requires the Backup Server section to be configured)*
- **Proxmox Backup Group** — one backup target within a datastore (a VM, CT, or host being backed up) *(optional)*

**Out-of-the-box dashboards:**
- **Overview** — cluster-wide resource summary, node health table, VM/container inventory, and — when Backup Server is configured — datastore usage, backup group status, and snapshot verification summary
- **Node perspective** — per-node CPU, memory, and network metrics
- **VM perspective** — per-VM CPU, memory, network, and disk I/O metrics
- **Container perspective** — per-container CPU, memory, network, and disk I/O metrics
- **Backup Datastore perspective** — capacity/usage, backup groups in this datastore, and maintenance task history (backup/GC/prune/verify)
- **Backup Group perspective** — group identity/ownership and full snapshot history (size, protection, verification state)

## Configuration fields

| Field | Description | Required |
|---|---|---|
| **Host URL** | Full URL to your Proxmox VE host, including port. Example: `https://192.168.1.100:8006` | Yes |
| **Token ID** | The full API token identifier in the format `USER@REALM!TOKENID`. Example: `monitoring@pam!squaredup` | Yes |
| **Token Secret** | The UUID secret displayed when the token was created. Example: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Yes |
| **Ignore certificate errors** | Skip TLS certificate validation for both Proxmox VE and (if configured) Proxmox Backup Server. Enable if either host uses a self-signed certificate you haven't configured your agent to trust. | No |
| **Monitor a Proxmox Backup Server** | Toggle to reveal and enable the Backup Server fields below. | No |
| **Backup Server Host URL** | Full URL to your Proxmox Backup Server instance, including port. Example: `https://192.168.1.101:8007` | Only if Backup Server is enabled |
| **Backup Server Token ID** | API token identifier in the format `USER@REALM!TOKENID`. Example: `monitoring@pbs!squaredup` | Only if Backup Server is enabled |
| **Backup Server Token Secret** | The secret shown when the Backup Server token was created. | Only if Backup Server is enabled |

## What gets indexed

| Object type | Source endpoint | Identifier |
|---|---|---|
| Proxmox Node | `/cluster/resources?type=node` | Node name (e.g. `pve1`) |
| Proxmox VM | `/cluster/resources?type=vm` (filtered to `qemu`) | VM ID (e.g. `100`) |
| Proxmox Container | `/cluster/resources?type=vm` (filtered to `lxc`) | Container ID (e.g. `101`) |
| Proxmox Backup Datastore | `/admin/datastore` | Datastore name (e.g. `teststore`) |
| Proxmox Backup Group | `/admin/datastore/{store}/groups` | Composite `{datastore}/{type}/{id}` (e.g. `teststore/ct/100`) — the API has no global group ID |

## Known limitations

- **Write operations are not supported** — this plugin is read-only.
- **RRD time-series data** (Proxmox VE metrics) uses Proxmox's fixed timeframe windows (`hour`, `day`, `week`, `month`) which are mapped to SquaredUp's timeframe picker. Data granularity is pre-aggregated by Proxmox (not raw per-second data).
- **Self-signed TLS** — Proxmox ships with a self-signed certificate. If requests fail with TLS errors, replace the certificate or configure your agent to trust the Proxmox CA.
- **Rate limits** — Proxmox VE does not enforce strict API rate limits, but excessive polling may impact cluster performance.
- **Proxmox Backup Server uses a different auth scheme than Proxmox VE** (`PBSAPIToken` vs `PVEAPIToken`, with a different token/secret separator) — handled internally by the plugin; the two token types are not interchangeable, so a PVE token cannot be reused against a PBS instance or vice versa.
- **Backup Server maintenance task visibility depends on permissions.** See the Prerequisites section above — without `Audit` granted to both the token and its underlying user at `/`, the Maintenance Tasks tile only shows tasks the monitoring token itself performed.
- **Backup Server datastore namespaces are not supported in v1** — backup groups are read from the default namespace only.
