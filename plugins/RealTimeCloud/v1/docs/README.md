Explore the sustainability metadata of AWS, Azure, Google Cloud and Oracle Cloud Infrastructure regions in SquaredUp — power and water usage effectiveness, carbon-free energy and grid carbon intensity — using the data published by the [Green Software Foundation (GSF) Real Time Cloud project](https://github.com/Green-Software-Foundation/real-time-cloud). The data belongs to GSF and is fetched live from GSF's repository, not stored or redistributed by this plugin.

> ⚠️ This is reference data published once a year by the cloud providers, not live telemetry. It does not report your own workloads' emissions.

## Setup

No account, API key or credentials are needed — the data is read from public CSV files on GitHub.

1. Add the **Sustainability Data (Real Time Cloud)** data source in SquaredUp.
2. Save the data source.

## Configuration fields

There are no configuration fields. The data is always read from the `main` branch of the Real Time Cloud repository.

On save, the plugin fetches the region metadata file; a failure means the Green Software Foundation data is unreachable.

## What this plugin monitors

- **Energy efficiency** — power usage effectiveness (PUE) and water usage effectiveness (WUE) per region.
- **Carbon-free energy** — each provider's hourly and annual carbon-free energy share.
- **Carbon intensity** — provider market-based and grid consumption, production and marginal carbon intensity (gCO₂eq/kWh).
- **Energy and water totals** — total water input where GSF publishes it. GSF's total ICT energy and renewable energy columns (required for EU Energy Efficiency Directive reporting) are currently empty, so the plugin hides them.

The out-of-the-box dashboards include an **Overview** (headline figures and a world map of regions by grid carbon intensity), **Carbon Intensity** (cleanest and highest-carbon regions, trends by provider), **Efficiency** (PUE and WUE by provider and region) and a perspective for each **Cloud Region**.

## Data streams

- **Region Metadata** — provider-disclosed annual metrics, one row per region per year; account-wide, or filtered to selected regions.
- **Region Estimates** — GSF's own estimates for the current year, trended from earlier disclosed data and published in GSF's estimate file. They are estimates, not measurements, and the years covered follow GSF's latest release. Account-wide, or filtered to selected regions.

## What gets indexed

| Object type      | API source                                               | Represents                                              |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| **Cloud Region** | `Cloud_Region_Metadata.csv` in the Real Time Cloud repo. | A cloud provider region, such as AWS `eu-west-1`.       |

## Known limitations

- **Annual data** — values are yearly averages, so the streams have no timeframe selector.
- **Gaps** — providers do not disclose every metric for every region and year; missing values are shown empty.
- **Disclosure lag** — providers publish about six months after year end, so the latest reported year is usually the previous one. Estimates cover the current year.
- **Providers covered** — AWS, Microsoft Azure, Google Cloud and Oracle Cloud Infrastructure. Oracle appears once GSF's published data includes it.
- **Provider granularity** — Azure PUE and WUE are set per continent rather than per region, and Google PUE is per datacenter mapped to a region. Oracle has no PUE or WUE for recent years.
- **Reporting periods** — Azure figures follow a July–June fiscal year and Oracle figures a June–May fiscal year, so they are not directly comparable with calendar-year values.
- **Third-party grid data** — grid carbon intensity and the Electricity Maps and WattTime zone IDs are third-party data carried forward by GSF.
- **Latest-year dashboards** — Overview, Carbon Intensity and Efficiency show each region's latest reported year, so averages can mix years where a region has not reported recently.
- **Read-only** — the plugin only reads public files.

## Attribution

Data is published by the [Green Software Foundation](https://greensoftware.foundation) in the [Real Time Cloud](https://github.com/Green-Software-Foundation/real-time-cloud) project. Grid carbon intensity includes data from Electricity Maps and WattTime. This plugin is not affiliated with or endorsed by the Green Software Foundation.
