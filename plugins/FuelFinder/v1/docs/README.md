Monitor UK road fuel prices in SquaredUp — find the cheapest petrol and diesel forecourts near you, compare prices by region and brand, and track price changes — via the UK government's [Fuel Finder](https://www.gov.uk/government/collections/fuel-finder) open data service.

> ⚠️ The Fuel Finder API covers **Great Britain and Northern Ireland forecourts only**, and rejects requests from **datacenter and cloud IP addresses** — run the data source on a relay agent on a UK machine with an ordinary broadband connection.

## Setup

You will need Fuel Finder API credentials (a **client ID** and **client secret**). Each user of this plugin registers for their own — registration is free and open to individuals and organisations.

1. Go to the [Fuel Finder developer portal](https://www.developer.fuel-finder.service.gov.uk/fuel-finder/public-api) and sign in with a **GOV.UK One Login** (create one if needed — guidance is on the [GOV.UK access page](https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email)).
2. Register as a data user and create **API credentials**. Copy the **client ID** and **client secret** it issues.
3. In SquaredUp, add the **Fuel Finder** data source and paste them into the **Client ID** and **Client secret** fields.
4. Click **Add** — the plugin validates your credentials, then imports every UK fuel station (~8,100) with current prices, refreshed hourly.
5. Scope your dashboards to the stations you care about (e.g. a collection of your local forecourts, or a postcode-area filter), or use the distance parameters on the data streams.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Client ID** | Identifies your Fuel Finder API registration. | [Fuel Finder developer portal](https://www.developer.fuel-finder.service.gov.uk/fuel-finder/public-api) → your API credentials. | Yes |
| **Client secret** | Authenticates the plugin, exchanged for a short-lived access token on each request. | Issued alongside the client ID on the developer portal. | Yes |

On save, the plugin validates your credentials by requesting the first batch of fuel stations; a failure usually means a mistyped credential, a revoked registration, or a non-UK source IP.

## What this plugin monitors

- **Current fuel prices** — the price per fuel type (petrol E10/E5, diesel B7, premium diesel) at every UK forecourt, refreshed hourly, with optional distance-from-a-location filtering on the tiles.
- **Price changes** — which stations changed their prices during a timeframe, and what they changed to.
- **Station details** — brand, address, postcode area, fuel types sold, amenities, and whether it's a motorway or supermarket forecourt.

The out-of-the-box content includes a **Fuel Prices** overview, a **UK Fuel Market** analysis dashboard (regional, brand, motorway and supermarket price comparisons), and a perspective for each **Fuel Station**.

## Data streams

- **Fuel Prices** — one row per fuel station in scope with its current price for each fuel type; optional latitude/longitude/radius parameters add a distance column and filter by it.
- **Price Changes** — fuel price changes during the chosen timeframe (last 24 hours to last 30 days), one row per change.
- **Fuel Stations**, **Fuel Station Prices** and **Connection Test** are hidden streams used for importing objects and validating credentials.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Fuel Station** | `GET /api/v1/pfs` | A UK forecourt and its details (~8,100 objects). |
| **Fuel Price** | `GET /api/v1/pfs/fuel-prices` | The current per-fuel prices for one forecourt, refreshed hourly. |

**Relationships:** a Fuel Price shares its station's identifier; dashboards join the two per row.

## Known limitations

- **UK residential IP required** — the Fuel Finder API blocks datacenter and cloud IP addresses (including SquaredUp's cloud and UK cloud hosts), so the data source must run on a relay agent on a UK machine with an ordinary broadband connection.
- **One credential, one data source** — generating an access token revokes previously issued ones, so sharing a client ID/secret between data sources (or any other application) makes them break each other's authentication. Register separate credentials for each use.
- **Every UK station is imported** (~8,100 stations plus ~8,100 price objects) — the API has no location filter, so the full dataset is synced hourly and selection happens via scopes and stream parameters. Prices on dashboards are as fresh as the last import (up to an hour old).
- **Occasional import warnings self-heal** — a transient failure in the prices step is reported as a warning and the next hourly import fills any gap.
- **No price history** — the API returns current prices only. Trends build up over time via SquaredUp KPIs and monitors on the streams.
- **Rate limits** — 100 requests/minute and one concurrent request per client, set by the Fuel Finder service.
- **Read-only** — the plugin never writes anything to Fuel Finder.
