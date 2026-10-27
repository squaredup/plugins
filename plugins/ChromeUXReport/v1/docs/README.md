# Before you start

Monitor the real-user Core Web Vitals of a website and every page in its sitemap using the [Chrome UX Report (CrUX) API](https://developer.chrome.com/docs/crux/api). CrUX is Google's public dataset of how real Chrome users experience a site, and it's the same field data that Search Console and PageSpeed Insights report.

## Prerequisites

- A Google Cloud Project
- A website with a public XML sitemap
- Optional: the Google Search Console plugin, to see search performance and Core Web Vitals together

## Enabling the Chrome UX Report API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)

2. Select the project you wish to use

3. Navigate to **APIs & Services** > **Library**

4. Search for **Chrome UX Report API**

5. Select it and click **Enable**

The API is free and doesn't need billing.

## Creating an API key

1. From the [Google Cloud Console](https://console.cloud.google.com/), navigate to **APIs & Services** > **Credentials**

2. Click **+ Create credentials** and select **API key**

3. Optional: click **Edit API key**, and under **API restrictions** select **Restrict key** and choose **Chrome UX Report API**

4. Copy the key and save it somewhere secure

## Finding your sitemap

Most sites list their sitemap in `robots.txt`, for example at `https://www.example.com/robots.txt`. Open that file, find the `Sitemap:` line and copy the URL after it, for example `https://www.example.com/sitemap.xml`. Don't use the `robots.txt` address itself. If the line points to a sitemap index, use the index, because every sitemap it lists is followed.

## Configuring the plugin

Populate the following fields when configuring the plugin:

| Field | Description |
|---------|---------|
| Google API key | The API key created in Google Cloud |
| Sitemap URL | The full URL of your website's XML sitemap or sitemap index. Every page it lists on your website is imported |
| Website | Optional. Your website's origin, for example `https://www.example.com`. Only needed when the sitemap is on a different host from your pages, such as a CDN, a `sitemaps.` subdomain, or the domain without `www` |
| Key pages | Optional. The full URL of each page to track closely, one per line, such as your home page, top landing pages and checkout. They appear on the **Key Pages** dashboard and don't count toward **Maximum pages** |
| Competitor websites | Optional. The origin of each competitor website to benchmark against, one per line, for example `https://www.competitor.com`. They appear on the **Competitors** dashboard |
| Maximum pages | Optional. The most pages to import from the sitemap, 5,000 by default. CrUX only has data for pages with enough Chrome traffic, so most sites don't need more |

On save, the plugin runs four checks:

- **API key:** a bad key or a disabled API stops setup.
- **Sitemap:** it must open and list at least one page on your website or a plain XML sitemap, or setup stops with the reason, such as a 404, a website that blocks cloud servers, or pages on another host that need the **Website** field.
- **Gzipped sitemaps:** if the sitemap itself lists `.xml.gz` sitemaps, you get a warning that their pages will be skipped. Gzipped files listed deeper, inside child sitemaps, are skipped without a warning.
- **Website data:** if CrUX holds no data for your website yet, you only get a warning, because new or quiet sites appear in CrUX once they have enough Chrome traffic.

## Example configuration

| Setting | Example |
|---------|---------|
| Google API key | The key copied from Google Cloud |
| Sitemap URL | `https://www.example.com/sitemap.xml` |
| Website | `https://www.example.com` |
| Key pages | `https://www.example.com/` and `https://www.example.com/pricing`, one per line |
| Competitor websites | `https://www.competitor.com` |
| Maximum pages | `5000` |

## Use with Google Search Console

If you also use the Google Search Console plugin, you can merge its pages with the pages this plugin imports, so each page has its search performance and its Core Web Vitals in one place. Add this rule once:

1. Go to **Settings** > **Correlation** and click **Add correlation rule**.
2. Select **Merge**.
3. Set both nodes' **Type** to `page`, then click **Next**.
4. Set both properties to `name`, then click **Preview** and **Save and run**.

Both plugins name a page by its full URL, so pages listed the same way in your sitemap and in Search Console merge. The CrUX dashboards and the Search Console dashboards then open the same page object.

## What this plugin monitors

- **Core Web Vitals:** Largest Contentful Paint (LCP), Interaction to Next Paint (INP) and Cumulative Layout Shift (CLS), the three metrics Google uses to assess page experience.
- **Supporting metrics:** First Contentful Paint (FCP) and Time to First Byte (TTFB), which usually explain a slow LCP.
- **For each metric:** the 75th percentile value Google rates, its good, needs improvement or poor rating, and the share of visits in each band, for all devices, phone, desktop or tablet.
- **Trends:** weekly values for up to the last 40 weeks.
- **Pages and the whole site:** any page from the sitemap, or every page on the website together.
- **Why LCP is slow:** how the Largest Contentful Paint splits into time to first byte, resource load delay, load duration and render delay for visits where the largest element is an image, and how often it's an image or text.
- **Audience and navigation:** the device mix, network round trip time, and how many visits use the back/forward cache or prerendering.
- **Competitors:** the same Core Web Vitals for any competitor websites you add.

The out-of-the-box dashboards are:

- **Overview:** the latest 28-day snapshot, with the Core Web Vitals pass or fail assessment and what changed since last month.
- **Page:** a perspective on any single page, against its whole website.
- **Trends:** 40 weeks of every metric.
- **LCP Diagnostics:** why LCP is slow and what to fix first.
- **Competitors:** your website against each competitor on phone, and who is improving on Largest Contentful Paint. It shows only your own website until you add competitor websites.
- **Key Pages:** a leaderboard of your key pages, showing which ones got better or worse since last month and which have too little traffic to report. It uses phone data, and stays empty until you add key pages.

## Data streams

- **Core Web Vitals:** each metric's 75th percentile, rating and good, needs improvement and poor shares over the last 28 days, for each selected website or page. Choose **Page** or **Whole site** and the device.
- **Core Web Vitals history:** the same values as a weekly time series, for up to the last 40 weeks. Set the timeframe to **None** for all 40 weeks.
- **Page experience diagnostics:** the LCP breakdown, the LCP element type, navigation types, device mix and round trip time over the last 28 days, for each selected website or page.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **origin** | The **Website** field, or otherwise the sitemap's own origin | The website, used by the whole-site tiles. |
| **page** | Each `<loc>` in the sitemap and every sitemap it links to, plus any **Key pages** | A page on the website. Key pages have the property `pageGroup` set to `Key page`. |
| **competitor** | **Competitor websites** | A competitor website. |

## Known limitations

- **Pages need Chrome traffic:** CrUX only reports pages and websites with enough real Chrome visits. Tiles for quieter pages show "No Chrome UX Report data for this page or website on this device", and a page can have phone data but no desktop data.
- **Data is a 28-day rolling window, not live:** current values cover the 28 days ending about two days ago, and history updates once a week. A fix shows fully after about four weeks, so pair this plugin with real-user monitoring or lab tests to see changes as they happen.
- **No country breakdown:** the CrUX API doesn't split data by country.
- **Up to 40 weeks of history:** the CrUX History API keeps 40 weekly periods, so longer timeframes aren't offered.
- **No all-pages leaderboard:** CrUX has no way to ask for every page at once, and it reports no traffic figures, so ranking thousands of pages would take thousands of requests. The **Key Pages** dashboard covers the pages you choose instead, and the **Page** dashboard opens any single page.
- **One request per page:** each page in a tile is one API request, and CrUX allows about 150 requests a minute for each API key, so avoid tiles that cover hundreds of pages at once. Results are cached for 6 hours (24 hours for history), because CrUX only publishes new data daily and weekly, so busy dashboards don't add requests.
- **Sitemaps:**
  - Only pages on your website, meaning the **Website** origin or otherwise the sitemap's own origin, are imported, up to **Maximum pages**. Pages on other subdomains, `http://` or the domain without `www` are left out, so a large blog or help site can't crowd out the main one. Add any of those pages you care about as **Key pages**, which don't count toward the limit and are imported whatever their address.
  - Child and nested sitemaps are followed when they're on the sitemap's own host or any subdomain of your website, such as `sitemaps.example.com`. Others are skipped, and each sitemap is read only once.
  - If your sitemap is on a different host from your pages, such as a CDN or the domain without `www`, set the **Website** field. Otherwise setup stops, because none of the listed pages are on your website.
  - Gzipped sitemaps (`.xml.gz`) can't be read and are skipped. If your index lists gzipped files, point **Sitemap URL** at a plain XML sitemap.
  - One import makes at most about 200 requests. Each sitemap file is one request, and so is every 5,000 pages of a large file. A site split into hundreds of small sitemaps is only partly imported, so point **Sitemap URL** at the sitemap that lists your most important pages instead.
  - If a sitemap the import reaches returns an error, such as a 404 for a child sitemap that no longer exists, that import fails. Pages from the last successful import are kept, along with any pages read before the error, and nothing is removed until an import succeeds. Fix or remove the broken sitemap, or point **Sitemap URL** at a working one.
- **Sites that block cloud servers:** some websites' bot protection refuses requests from cloud providers, so the sitemap fails with "Access Denied". Add the data source **Via relay agent** so requests come from your own network, which the website already trusts, or allowlist SquaredUp on the website's CDN.
- **Changing the sitemap:** pages from the previous sitemap can stay listed for a short time after the next import, until SquaredUp clears them.
- **Read-only:** the plugin only reads public CrUX data and your sitemap.

## Troubleshooting

### The API key check fails

Verify that:

- The Chrome UX Report API is enabled on the Google Cloud project that owns the key
- The key is copied in full, with no spaces
- If the key is restricted, **Chrome UX Report API** is one of the allowed APIs

### The sitemap can't be read

Verify that:

- The **Sitemap URL** opens in a browser and shows plain XML, not a gzipped file
- If the website refuses the request with **Access Denied** or an HTTP 403, its bot protection is probably blocking cloud servers. Add the data source **Via relay agent** so requests come from your own network, or allowlist SquaredUp on the website's CDN
- If the sitemap is on a different host from your pages, **Website** is set to the origin of your pages

### Tiles show no data

Verify that:

- The page or website has enough real Chrome traffic. CrUX doesn't report quiet pages, and a page can have phone data but no desktop data
- The data source finished indexing, so the page you selected exists
