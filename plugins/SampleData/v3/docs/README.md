Explore SquaredUp before connecting your own tools. This plugin creates a fictional software company with services, hosts, release pipelines and customers, and fills a set of ready-made dashboards with realistic data.

> ⚠️ All data is generated. Nothing here reflects a real system, and the plugin never connects to your environment.

## Setup

There is nothing to configure.

1. Add the **Sample Data** data source.
2. Leave the dashboards option selected so the out-of-the-box dashboards are installed.
3. Open the **Executive Overview** dashboard to start.

## Configuration fields

This plugin has no configuration fields.

## What this plugin monitors

The data tells one story. A release to **Payments API** went out about two and a half hours ago and caused an incident that is still recovering. You can follow it across every dashboard:

- **Service health and SLOs** — Payments API is in error, and **Checkout API** and **Orders Service** are degraded. Latency, error rates and error budgets show the impact.
- **DevOps** — the release that caused the incident appears as a change failure next to the DORA metrics.
- **Infrastructure** — host CPU rises during the incident. Separately, a disk on an analytics host is slowly filling up.
- **Service desk and customers** — three customers raised P1 tickets and are now breaching their SLAs.
- **Business metrics** — orders dip while payments fail.
- **Cloud cost** — **Search Service** compute spend is running over budget after an index rebuild.

The incident moves with the clock, so it is always recent. Historical data stays the same between refreshes.

The out-of-the-box dashboards are **Executive Overview**, **Service Health (NOC)**, **SLOs & Error Budgets**, **DevOps · DORA**, **Cloud Cost · FinOps**, **Service Desk**, **Customers & SLAs** and **Business Metrics**. There is also a perspective for each **Service**, **Host**, **Pipeline** and **Customer**.

## Data streams

- **Service Health** — current state, golden signals, 30-day availability and error budget for each service.
- **Service Metrics** — latency, requests per minute, error rate and state over time for each service.
- **Service Dependencies** — request flow between services and the health of each downstream service.
- **Host Health** — current CPU, memory and disk usage and state for each host.
- **Host Performance** — CPU, memory, disk and network usage over time for each host.
- **Deployments** — production deployments for each pipeline, with status, duration, lead time and change failures.
- **Cloud Cost** — daily spend and budget by service and cost category.
- **Tickets** — service desk tickets for each customer, with priority, status and SLA outcome.
- **Customer SLAs** — SLA attainment, satisfaction, revenue and renewal date for each customer.
- **Business Metrics** — visitors, signups, orders, order value, conversion rate and MRR over time. Not tied to any object.
- **Conversion Funnel** — signup-to-paid conversion stages for the selected timeframe. Not tied to any object.

## What gets indexed

| Object type  | Source                 | Represents                                   |
| ------------ | ---------------------- | -------------------------------------------- |
| **Service**  | The sample model (12)  | A microservice owned by an engineering team. |
| **Host**     | The sample model (19)  | A cloud virtual machine running a service.   |
| **Pipeline** | The sample model (6)   | A release pipeline that deploys a service.   |
| **Customer** | The sample model (20)  | A customer account with an SLA.              |

**Relationships:** each Host runs a Service, and each Pipeline deploys a Service.

## Known limitations

- **Generated data** — values come from a fixed model, not from real systems.
- **Cloud cost is daily** — its timeframes start at the last 7 days and go up to a quarter.
- **Read-only** — the plugin never writes anywhere.
