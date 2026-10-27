Monitor UK road fuel prices around a postcode in SquaredUp — find the cheapest petrol and diesel forecourts near you and track price changes — via the UK government's [Fuel Finder](https://www.gov.uk/government/collections/fuel-finder) open data service.

> ⚠️ The Fuel Finder API covers **Great Britain and Northern Ireland forecourts only**, and only accepts requests from **UK IP addresses** — if your SquaredUp tenant cannot reach it directly, run the data source on a relay agent hosted on a UK machine.

## Setup

You will need Fuel Finder API credentials (a **client ID** and **client secret**). Each user of this plugin registers for their own — registration is free and open to individuals and organisations.

1. Go to the [Fuel Finder developer portal](https://www.developer.fuel-finder.service.gov.uk/fuel-finder/public-api) and sign in with a **GOV.UK One Login** (create one if needed — guidance is on the [GOV.UK access page](https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email)).
2. Register as a data user and create **API credentials**. Copy the **client ID** and **client secret** it issues.
3. In SquaredUp, add the **Fuel Finder** data source and paste them into the **Client ID** and **Client secret** fields.
4. Enter the **Postcode** to search around and a **Search radius (miles)**.
5. Click **Add** — the plugin validates your credentials, then imports the fuel stations within your radius.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Client ID** | Identifies your Fuel Finder API registration. | [Fuel Finder developer portal](https://www.developer.fuel-finder.service.gov.uk/fuel-finder/public-api) → your API credentials. | Yes |
| **Client secret** | Authenticates the plugin, exchanged for a short-lived access token on each request. | Issued alongside the client ID on the developer portal. | Yes |
| **Postcode** | Full UK postcode at the centre of your search, e.g. `SW1A 1AA`. Geocoded via the free [postcodes.io](https://postcodes.io) service. | — | Yes |
| **Search radius (miles)** | Fuel stations within this distance of the postcode are imported (1–50 miles). | — | Yes |

On save, the plugin validates your credentials by requesting the first batch of fuel stations; a failure usually means a mistyped credential, a revoked registration, or a non-UK source IP.

## What this plugin monitors

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

<!-- finalized in Phase 9 -->
