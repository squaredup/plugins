# Blog brief: "I monitor UK fuel prices with SquaredUp"

Raw material for a blog post, written during the build session. Facts below are
verified from the session; pick an angle and style per the writing skills.
Author: Dave Clarke (@clarkd), Product Manager at SquaredUp. The plugin was
built almost entirely by an AI agent (Claude) driving the squaredup CLI,
with Dave supplying credentials, a relay agent, and product judgment.

## The hook

- Wanted: a weekly email with the cheapest petrol near home. Ended up: a
  SquaredUp plugin importing every UK fuel station hourly, league tables of
  brands and regions, a price map of the country, and a pile of platform bug
  reports.
- Time: roughly two working days of elapsed chat, most of it spent discovering
  API and platform constraints, not writing code.

## The data source: gov.uk Fuel Finder

- The CMA's interim open-data scheme (per-retailer JSON feeds) closed 1 May
  2026; the statutory replacement is Fuel Finder (Motor Fuel Price (Open
  Data) Regulations 2025, run by DESNZ, operated by VE3 Global). Retailers
  must report price changes within 30 minutes.
- Anyone can register as a data user (GOV.UK One Login) and get OAuth client
  credentials. Each plugin user registers their own.
- API quirks discovered the hard way:
  - Geo-fenced: only UK IP addresses get past CloudFront; everything else
    gets an empty 403 on every path (even nonsense paths). SquaredUp's cloud
    backend (US and EU) is blocked; a UK-hosted relay agent works - verified
    on both a home Mac and an ECS service in AWS London (eu-west-2).
  - The token endpoint is not standard OAuth2: JSON body of snake_case
    credentials, token nested in a data wrapper. The documented form-encoded
    flow exists but the SDK-style JSON flow is what we verified live.
  - Minting a token revokes previously issued ones - one credential can
    serve exactly one consumer; sharing credentials between configs makes
    them revoke each other's tokens. Diagnosed via "Token revoked or
    expired" loops.
  - No filters at all: the only way to read the data is batches of 500
    stations by batch-number (about 17 batches, ~8,146 stations), and
    requesting one batch past the end is a 404, not an empty page.
  - The stations endpoint and the prices endpoint do not align their
    batches: batch N of one shares only ~4-9% of its stations with batch N
    of the other, so joining requires both datasets in full.
  - Rate limits: 100 requests/minute, one concurrent request.
  - Data quality: brand_name is free text - trailing spaces, case
    variations, and Asda puts the full site name in it ("ASDA BRISTOL
    WHITCHURCH SUPERSTORE"), which exploded the brand league until the
    import normalised brands (113 distinct "brands" in one 500-station
    sample before cleaning).

## The architecture (final)

- Two object types sharing the same source id: Fuel Station (details,
  coordinates, postcodeArea derived from the postcode outward code) and
  Fuel Price (per-fuel price + change timestamp). Two import steps, 34 paged
  requests, ~2m40s, hourly. Two types because a second import step writing
  the same object replaces its whole property bag (SAAS-10488).
- Dashboards join the two types per row at shaping time with
  objectPropertyPath lookups - no API calls at view time. Tile streams call
  /favicon.ico (an unauthenticated 200) because a stream must call
  something; every row is built from indexed graph objects. Tile queries
  dropped from ~50s (timing out) to ~3s.
- Streams: "Fuel Prices" (wide: one row per station, optional
  latitude/longitude/radius tile parameters compute distance and filter;
  optional minimum-stations-per-brand parameter for league tables) and
  "Price Changes" (one row per change in the timeframe).
- Dashboards: Fuel Prices (cheapest petrol/diesel scalars + tables, recent
  changes), UK Fuel Market (postcode-area league, brand league, motorway
  premium, supermarket effect, SmartViz geoMap of every forecourt), and a
  per-station perspective. All tiles carry SmartViz vizSpecs (validated via
  the platform's visualization validator), with traffic-light thresholds on
  league averages and relative dates.
- The weekly email is just a SquaredUp scheduled report on the overview
  dashboard - no plugin code involved.

## War stories worth telling (pick 2-3)

1. Four layers of 403: geo-fence (CloudFront), app-level 403 for missing
   tokens, "Token revoked or expired" from credential sharing, and the test
   path that turned out to be the wrong tenant. Each looked identical at
   first glance.
2. The join problem: no filters + misaligned batches + a 6MB response cap +
   a 20s script budget + no working sleep in the sandbox (setTimeout never
   fires; the clock freezes in sync loops - we briefly used favicon fetches
   as a timer). Final answer: don't join at import at all; join in the graph
   at view time.
3. The brand league that listed every Asda superstore as its own brand.
4. Discovering the relay agent cached stale plugin bundles keyed by version
   (SAAS-10490) - the CLI test showed new code while imports ran old code.
5. The import truncation mystery: a scoped step received 1,901 then 500 of
   8,146 objects on consecutive runs, reporting success both times
   (SAAS-10489).

## Honest limitations (include at least one)

- UK-wide league tables and the map draw from a ~500-object tile scope (as
  designed), so national aggregates are a sample unless pre-aggregated at
  import - a possible follow-up post.
- Prices are as fresh as the last hourly import; no price history from the
  API (SquaredUp KPIs accumulate trends instead).

## Artefacts

- Plugin source: squaredup/plugins branch work/dc/fuel-finder-plugin
  (plugins/FuelFinder/v1), v1.0.7, not yet a community PR.
- Jiras raised during the build: SAAS-10481 (number fields reject decimals),
  SAAS-10488 (merge import properties), SAAS-10489 (scope truncation),
  SAAS-10490 (stale agent bundle), SAAS-10491 (no sleep in script sandbox).
- Screenshot candidates: UK Fuel Market dashboard (geomap + brand league),
  Fuel Prices overview, a station perspective, the config form (two fields!),
  the agent log of the relay doing a 34-page import.

## Angles to choose from

- "From idea to live dashboard with an AI pair" (the agent-built-it angle).
- "What it actually takes to consume a government open-data API" (the API
  quirks angle).
- "Monitor anything: fuel prices edition" (the SquaredUp product angle -
  scheduled reports, KPIs, geomap).
