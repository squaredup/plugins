# Stripe

Monitor a Stripe account: customers, subscriptions, and the product catalog are indexed as objects you can browse and drill into, while balance, payment, invoice, payout, dispute, and account-activity data are available as dashboard data streams.

## What gets indexed

| Object | What it represents |
| --- | --- |
| Customer | A billable customer in your Stripe account |
| Subscription | A recurring billing arrangement, linked to its Customer |
| Product | A catalog entry (not linked to pricing/inventory) |

Invoices, payments, payouts, and disputes are **not** indexed as objects — they're high-volume/transactional, so they're surfaced through dashboard data streams instead (see below) rather than the object graph.

## Prerequisites

You need a Stripe **secret key**. SquaredUp only needs read access, so a **restricted key** scoped to read-only permissions is recommended over your full secret key.

To create a restricted key:

1. In the [Stripe Dashboard](https://dashboard.stripe.com/apikeys), go to **Developers → API keys**.
2. Click **Create restricted key**.
3. Give it a name (e.g. "SquaredUp").
4. Set these resources to **Read**: Customers, Subscriptions, Products, Prices, Invoices, PaymentIntents, Charges, Payouts, Disputes, Balance, Events, Balance Transactions. Leave everything else **None**.
5. Create the key and copy it — Stripe only shows it once. It starts with `rk_live_` (live mode) or `rk_test_` (test mode).

A full secret key (`sk_live_...` / `sk_test_...`) also works, but grants read **and** write access, so a restricted key is safer.

**Test vs. live mode:** which data you see is determined entirely by the key you provide — a `_test_` key only sees test-mode data, a `_live_` key only sees live data. Add the plugin twice (once per key) if you want to monitor both.

## Configuration fields

| Field | Description | Required |
| --- | --- | --- |
| Secret API Key | Your Stripe restricted or secret key (`rk_...` / `sk_...`) from the dashboard steps above | Yes |

## What you get

- **Object graph:** Customers, Subscriptions (with status: `active`, `trialing`, `past_due`, `canceled`, etc.), and Products, with Subscriptions linked to their Customer for drilldown.
- **Data streams:**
    - **Balance** — current available/pending balance by currency.
    - **Money movement** — the balance-affecting transaction ledger (charges, refunds, payouts, fees, adjustments) over a chosen time range.
    - **Payments** — payment attempts (including failed ones), optionally filtered to a Customer.
    - **Payout activity** — payouts created within a time range.
    - **Dispute activity** — disputes (chargebacks) created within a time range.
    - **Invoice activity** — invoices created within a time range, optionally filtered to a Customer or Subscription.
    - **Account events** — a change feed of account activity (e.g. `invoice.payment_failed`, `charge.dispute.created`), limited to the last 30 days by Stripe.

## Known limitations

- **Account events retention is 30 days.** Stripe only retains Events for 30 days, so the "Account events" stream can't look back further — use the other activity streams (which query `created` directly on the underlying objects) for anything older.
- **Rate limits.** Stripe caps live-mode requests around 100 requests/second account-wide (test mode ~25/second), and separately allocates a longer-window read budget per month. Very frequent polling or many dashboards querying wide timeframes at once can hit these limits — Stripe returns HTTP 429 when you do.
- **No cross-mode visibility.** A single key only ever sees test-mode or live-mode data, never both.
- **Charges and refunds aren't indexed separately.** They're superseded by PaymentIntent for payments, and folded into the money-movement ledger for refunds — there's no standalone Charge or Refund object in the graph.
- **Response size.** Very wide timeframes on high-volume accounts (e.g. money movement over a year) can return a large number of rows; narrow the timeframe if a data stream times out or errors.
