Monitor UK road fuel prices around a postcode in SquaredUp — find the cheapest petrol and diesel forecourts near you and track price changes — via the UK government's [Fuel Finder](https://www.gov.uk/government/collections/fuel-finder) open data service.

> ⚠️ The Fuel Finder API covers **Great Britain and Northern Ireland forecourts only**, and only accepts requests from **UK IP addresses** — if your SquaredUp tenant cannot reach it directly, run the data source on a relay agent hosted on a UK machine.

## Setup

You will need Fuel Finder API credentials (a **client ID** and **client secret**). Each user of this plugin registers for their own — registration is free and open to individuals and organisations.

1. Go to the [Fuel Finder developer portal](https://www.developer.fuel-finder.service.gov.uk/fuel-finder/public-api) and sign in with a **GOV.UK One Login** (create one if needed — guidance is on the [GOV.UK access page](https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email)).
2. Register as a data user and create **API credentials**. Copy the **client ID** and **client secret** it issues.
3. In SquaredUp, add the **Fuel Finder** data source and paste them into the **Client ID** and **Client secret** fields.
4. Enter the **Latitude** and **Longitude** to search around (right-click the spot in [Google Maps](https://maps.google.com) and copy the coordinates, or look your postcode up at [postcodes.io](https://postcodes.io)) and a **Search radius (miles)**.
5. Click **Add** — the plugin validates your credentials, then imports the fuel stations within your radius.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Client ID** | Identifies your Fuel Finder API registration. | [Fuel Finder developer portal](https://www.developer.fuel-finder.service.gov.uk/fuel-finder/public-api) → your API credentials. | Yes |
| **Client secret** | Authenticates the plugin, exchanged for a short-lived access token on each request. | Issued alongside the client ID on the developer portal. | Yes |
| **Latitude** | Latitude at the centre of your search, e.g. `51.5012`. | Right-click the spot in [Google Maps](https://maps.google.com), or look your postcode up at [postcodes.io](https://postcodes.io). | Yes |
| **Longitude** | Longitude at the centre of your search, e.g. `-0.1416`. | Copied alongside the latitude. | Yes |
| **Search radius (miles)** | Fuel stations within this distance of the location are imported (1–50 miles). | — | Yes |

On save, the plugin validates your credentials by requesting the first batch of fuel stations; a failure usually means a mistyped credential, a revoked registration, or a non-UK source IP.

## What this plugin monitors

- **Current fuel prices** — the live price per fuel type (petrol E10/E5, diesel B7, premium diesel) at every forecourt within your radius, with distance from your location.
- **Price changes** — which nearby stations changed their prices during a timeframe, and what they changed to.
- **Station details** — brand, address, distance, fuel types sold, amenities, and whether it's a motorway or supermarket forecourt.

The out-of-the-box content includes a **Fuel Prices** overview dashboard plus a perspective for each **Fuel Station**.

## Data streams

- **Fuel Prices** — current price per fuel type at each fuel station, with distance (per-station or across all stations in scope).
- **Price Changes** — fuel price changes at each fuel station during the chosen timeframe (last 24 hours to last 30 days).
- **Fuel Stations** and **Connection Test** are hidden streams used for importing objects and validating credentials.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Fuel Station** | `GET /api/v1/pfs` | A forecourt within the configured radius of your location. |

## Known limitations

- **UK residential IP required** — the Fuel Finder API blocks datacenter and cloud IP addresses (including SquaredUp's cloud and UK cloud hosts), so the data source must run on a relay agent on a UK machine with an ordinary broadband connection.
- **One credential, one data source** — generating an access token revokes previously issued ones, so sharing a client ID/secret between data sources (or any other application) makes them break each other's authentication. Register separate credentials for each use.
- **Queries page through the whole UK dataset** — the API has no per-station or location filter, so each query walks batches of 500 stations (~17 batches, a few seconds each via the relay agent). Price Changes timeframes are capped at last 30 days to keep queries manageable.
- **No price history** — the API returns current prices only. Trends build up over time from SquaredUp's own monitoring of the streams.
- **Location changes need a re-import** — stations are selected at import time, so after changing the latitude/longitude or radius the objects refresh on the next import (every 12 hours by default, or trigger one manually from the data source page).
- **Rate limits** — 100 requests/minute and one concurrent request per client, set by the Fuel Finder service.
- **Read-only** — the plugin never writes anything to Fuel Finder.
