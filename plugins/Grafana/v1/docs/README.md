# Grafana Plugin

Connect SquaredUp to your Grafana instance to import dashboards as objects on the map and monitor dashboard health and alert rules.

## Prerequisites

- A running Grafana instance (self-hosted or Grafana Cloud)
- Admin or Server Admin access to create a service account

## Setup

### 1. Create a Service Account

1. In Grafana, navigate to **Administration > Users and access > Service accounts**
2. Click **Add service account**
3. Give the account a name (e.g. `squaredup-readonly`)
4. Set the role to **Viewer**
5. Click **Create**

### 2. Generate a Token

1. On the service account page, click **Add service account token**
2. Give it a name and an optional expiry date
3. Click **Generate token**
4. Copy the token — it won't be shown again

### 3. Configure the Plugin

| Field | Description |
|---|---|
| **Grafana URL** | Base URL of your Grafana instance, e.g. `https://grafana.example.com` |
| **Service account token** | The token generated in step 2 |

## Data Streams

| Name | Scope | Description |
|---|---|---|
| **Dashboards** | Unscoped | Lists all dashboards in the Grafana instance. Also used to populate objects on the SquaredUp map. |
| **Alert Rules** | Unscoped | Lists all Grafana-managed alert rule configurations. |
| **Dashboard Health** | Grafana Dashboard | Shows recent alert state changes (Alerting / Pending / OK) for a specific dashboard, sourced from Grafana annotations. |

## Notes

- The **Alert Rules** stream uses the Grafana Provisioning API (`/api/v1/provisioning/alert-rules`) and returns rule configuration, not live firing state.
- The **Dashboard Health** stream uses Grafana alert annotations to show recent state transitions per dashboard panel.
- Both streams require that your service account has at least the **Viewer** role.
- For Grafana Cloud, use the full stack URL, e.g. `https://yourorg.grafana.net`.
