# Before you start

To connect SquaredUp to Trading 212, you will need to generate an API key.

The Trading 212 public API is currently in **beta** and is only available for **Invest** and **Stocks ISA** accounts (not SIPP).

## Generate an API key

1. Log in to the Trading 212 web app or mobile app.
2. Open **Settings** and select **API (Beta)**.
3. Accept the risk warning for using third-party applications.
4. Click **Generate API key**.
5. Tick **every** permission checkbox shown (Account data, Portfolio, Orders, and each History item such as Orders/Dividends/Transactions if listed separately). The permission list is more granular than it first appears — a key missing even one of these returns a `403 Forbidden` on the matching part of this plugin rather than a clear error.
6. Give the key a name and, optionally, restrict it to specific IP addresses.
7. Copy the **API Key** and the **API Secret** — the secret is only shown once.

If you use a Trading 212 **practice/demo** account instead of a live account, generate the key from the demo app — a demo key only works against the Demo environment below.

## Configure the plugin

1. Add the **Trading 212** plugin in SquaredUp.
2. Enter the **API Key** and **API Secret** generated above.
3. Choose **Live** or **Demo** to match the account the key was generated against.
4. Save the configuration to begin importing your account, positions, and pies.

| Field | Description | Required |
| --- | --- | --- |
| API Key | The API key from Trading 212 Settings > API (Beta). | Yes |
| API Secret | The API secret shown once when the key was generated. | Yes |
| Environment | `Live` for a real account, `Demo` for a practice account. Must match the account the key belongs to. | Yes |

## What gets indexed

- **Trading212 Account** — your account's currency, cash, invested and total value. One object per connected account.
- **Trading212 Position** — each open holding (equity, ETF or crypto instrument) in your account, with quantity, average price, current price and profit/loss.
- **Trading212 Pie** — each investment "pie" (basket of instruments) in your account, with progress toward its goal and overall result.

## Known limitations

- The Trading 212 public API has no price-history or portfolio-value-over-time endpoint, so dashboards show current state and recent activity rather than long-term trend charts.
- The **Pies** part of the API is marked deprecated by Trading 212 (no further updates planned) but remains operational at the time of writing.
- Rate limits are strict and vary per endpoint (as low as 1 request per 30–50 seconds for some endpoints), so large accounts with many pies or a long history may take longer to fully sync.
- Placing, modifying, or cancelling orders is not supported by this plugin — it is read-only monitoring.
- Order, dividend and transaction history show only the **most recent 50** records. Trading 212's history endpoints paginate via a relative path that SquaredUp's data streams can't follow, so this plugin requests the maximum single page instead of walking further back.
