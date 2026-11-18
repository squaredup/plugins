Track daily foreign exchange rates and currency movements using the free [Frankfurter](https://frankfurter.dev) API, which republishes the [European Central Bank's reference rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html).

## Before you start

No account, API key or credentials are required. Add the data source and save it; the connection check confirms that the Frankfurter API can be reached.

Rates are published once per working day, so they suit reporting and cost conversion rather than live trading. Weekends and bank holidays have no rate of their own.

## Data streams

- **Latest Rates** - the most recent rate from a base currency to a target currency, with the previous working day's rate and the percentage change between them.
- **Historical Rates** - daily rates for the selected timeframe.

Both streams have the same parameters, each picked from the list of supported currencies:

| Parameter | Description |
| --- | --- |
| Base currency | The currency being converted from. Defaults to EUR. |
| Target currency | The currency being converted to. Leave blank to return every supported currency. |

The **Overview** dashboard shows GBP/USD (Cable), EUR/USD (Fiber) and EUR/GBP (Chunnel) with their daily change and trend, every currency against the US dollar, and the biggest movers against the US dollar.

## Using a rate in a SQL tile

Add **Latest Rates** as a table, for example named `fx`, with base currency `GBP` and target currency `USD`, then read the `rate` column: `SELECT rate FROM fx WHERE pair = 'GBP/USD'`.
