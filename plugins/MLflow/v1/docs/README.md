# MLflow

Monitor an [MLflow](https://mlflow.org/) Tracking Server — experiments, runs, and the model registry — from SquaredUp. Works against self-hosted open-source MLflow and Databricks-hosted MLflow tracking servers.

## What this plugin monitors

- **Experiments** — the top-level containers ML runs are organised under
- **Runs** — individual training/tracking runs, their status, duration, parameters, metrics and tags
- **Registered Models** — named entries in the MLflow Model Registry
- **Model Versions** — specific versions of a registered model, linked back to the run that produced them

Out-of-the-box dashboards give you:

- **Overview** — run success rate (24h/7d), active experiment count, runs today, models currently in Production, and recently failed/killed runs
- **Experiment Detail** — runs, durations and metrics for a single experiment
- **Model Registry Lifecycle** — models grouped by stage (None → Staging → Production → Archived), and how long each version has sat in its current stage
- **Production Model Health** — every model version currently in Production, joined to the metrics of the run that trained it

## Prerequisites

You need the URL of your MLflow Tracking Server and, if authentication is enabled, credentials for it.

**Self-hosted (open-source) MLflow:**

- The base URL of your tracking server, e.g. `http://mlflow.mycompany.com:5000` (no `/api` suffix, no trailing slash)
- If [MLflow Authentication](https://mlflow.org/docs/latest/auth/index.html) is enabled on the server, a username and password with read access
- If it isn't enabled (the common case for internal/self-hosted servers), no credentials are needed — select "No authentication"

**Databricks-hosted MLflow:**

- Your Databricks workspace URL, e.g. `https://adb-1234567890123456.7.azuredatabricks.net`
- A Databricks personal access token (User Settings → Developer → Access tokens) or an OAuth token, with permission to view experiments and the model registry — select "Bearer token"

## Configuration fields

| Field | Description | Required |
|---|---|---|
| Tracking Server URL | Base URL of the MLflow server or Databricks workspace, no `/api` suffix | Yes |
| Authentication | `No authentication`, `Basic auth`, or `Bearer token` | Yes |
| Username / Password | Shown when Authentication is Basic auth | If Basic auth |
| Bearer Token | Shown when Authentication is Bearer token — a Databricks PAT/OAuth token or self-hosted bearer token | If Bearer token |
| Experiment IDs to track runs for | Comma/newline separated list of experiment IDs. MLflow's run search API requires specific experiment IDs — there's no "all runs" endpoint. Leave blank to import runs from the Default experiment (ID `0`) only | No |
| Ignore certificate errors | Enable for self-hosted servers with a self-signed certificate | No |

Experiment IDs are visible in SquaredUp once experiments have imported (look at the indexed **MLflow Experiment** objects), or in the MLflow UI under each experiment's details.

## What gets indexed

| Object type | What it represents | Identified by |
|---|---|---|
| MLflow Experiment | An experiment container | `experiment_id` |
| MLflow Run | A single tracking run within an experiment | `run_id` |
| MLflow Registered Model | A named entry in the model registry | `name` |
| MLflow Model Version | A specific version of a registered model | `name` + `version` |

## Known limitations

- **Runs are scoped to configured experiment IDs, not "all runs".** MLflow's `runs/search` REST endpoint requires an explicit `experiment_ids` list — there's no account-wide "list all runs" endpoint. Set the "Experiment IDs to track runs for" field to the experiments you care about; otherwise only the Default experiment (`0`) imports.
- **GenAI trace/observability data (MLflow 3.x) is not covered.** Trace search endpoints are newer, version-dependent, and share the same per-experiment scoping limitation as Runs.
- **Users/permissions are not covered.** These endpoints only exist when [MLflow Authentication](https://mlflow.org/docs/latest/auth/index.html) is enabled.
- **Databricks Unity Catalog model registries are not covered.** This plugin uses the classic MLflow tracking/registry REST API (`/api/2.0/mlflow/...`), which Databricks workspaces expose for backwards compatibility. Models registered purely in Unity Catalog use a different API surface.
- **Both `current_stage` (legacy) and `aliases` (MLflow 3.x) are captured on Model Versions**, but the Model Registry Lifecycle dashboard groups by `current_stage`. Registries that have fully migrated to aliases (no stages) will show all versions as a single "None" stage.
- **Params and metrics are not flattened into named columns** on the Runs stream, since key names vary per user/project — they're available as raw JSON on each run. Use the separate metric-history stream (parameterised by metric key) to chart a specific metric over time.
