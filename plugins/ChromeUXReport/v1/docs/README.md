Monitor the real-user Core Web Vitals of a website and every page in its sitemap in SquaredUp, using the [Chrome UX Report (CrUX) API](https://developer.chrome.com/docs/crux/api). CrUX is Google's public dataset of how real Chrome users experience a site, and it's the same field data that Search Console and PageSpeed Insights report.

## Setup

You will need a **Google API key** from a Google Cloud project with the Chrome UX Report API enabled. The API is free and doesn't need billing.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and select the project you want to use, or create one.
2. Go to **APIs & Services** > **Library**, search for **Chrome UX Report API**, and click **Enable**.
3. Go to **APIs & Services** > **Credentials**, click **+ Create credentials** and select **API key**.
4. Optional: click **Edit API key**, and under **API restrictions** select **Restrict key** and choose **Chrome UX Report API**.
5. Copy the key and paste it into the **Google API key** field.
6. Enter your website's sitemap in the **Sitemap URL** field. Most sites list it in `robots.txt`, for example `https://www.example.com/robots.txt`.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Sitemap URL** | The full URL of your website's XML sitemap or sitemap index. Every page it lists is imported, and the website is taken from its host. | The `Sitemap:` line in your site's `robots.txt`. | Yes |
| **Maximum pages** | The most pages to import, 50,000 by default. CrUX only has data for pages with enough Chrome traffic, so most sites don't need more. | Your choice. | Yes |
| **Key pages** | The full URL of each page to track closely, one per line, such as your home page, top landing pages and checkout. They appear on the **Key pages** dashboard and don't count toward **Maximum pages**. | Your analytics or Search Console's top pages. | No |
| **Competitor websites** | The origin of each competitor to benchmark against, one per line, for example `https://www.competitor.com`. | Your choice. | No |
| **Google API key** | Authenticates every request to the Chrome UX Report API. | Google Cloud Console > **APIs & Services** > **Credentials**. | Yes |

On save, the plugin checks the API key, then checks that CrUX holds data for your website. A bad key or a disabled API stops setup. A website with no CrUX data yet only shows a warning, because new or quiet sites appear in CrUX once they have enough Chrome traffic.

## Use with Google Search Console

If you also use the Google Search Console plugin, you can merge its pages with the pages this plugin imports, so each page has its search performance and its Core Web Vitals in one place. Add this rule once:

1. Go to **Settings** > **Correlation** and click **Add correlation rule**.
2. Select **Merge**.
3. Set the left node's **Type** to `CrUX Page` and the right node's **Type** to `page`, then click **Next**.
4. Set both properties to `name`, then click **Preview** and **Save and run**.

Both plugins name a page by its full URL, so pages listed the same way in your sitemap and in Search Console merge. The Core Web Vitals data streams then work on Search Console pages too. Without the rule, Search Console pages can still be picked in a tile, but they return no Core Web Vitals.

## What this plugin monitors

- **Core Web Vitals:** Largest Contentful Paint (LCP), Interaction to Next Paint (INP) and Cumulative Layout Shift (CLS), the three metrics Google uses to assess page experience.
- **Supporting metrics:** First Contentful Paint (FCP) and Time to First Byte (TTFB), which usually explain a slow LCP.
- **For each metric:** the 75th percentile value Google rates, its good, needs improvement or poor rating, and the share of visits in each band, for all devices, phone, desktop or tablet.
- **Trends:** weekly values for up to the last 40 weeks.
- **Pages and the whole site:** any page from the sitemap, or every page on the website together.
- **Why LCP is slow:** how the Largest Contentful Paint splits into time to first byte, resource load delay, load duration and render delay, and whether the largest element is an image or text.
- **Audience and navigation:** the device mix, network round trip time, and how many visits use the back/forward cache or prerendering.
- **Competitors:** the same Core Web Vitals for any competitor websites you add.

The out-of-the-box dashboards are:

- **Overview:** the latest 28-day snapshot, with the Core Web Vitals pass or fail assessment and what changed since last month.
- **Trends:** 40 weeks of every metric.
- **LCP diagnostics:** why LCP is slow and what to fix first.
- **Competitors:** your website against each competitor, and who is improving.
- **Key pages:** a leaderboard of your key pages, showing which ones have too little traffic to report.
- **Page:** a perspective on any single page, against its whole website.

## Data streams

- **Core Web Vitals:** each metric's 75th percentile, rating and good, needs improvement and poor shares over the last 28 days, for each selected website or page. Choose **Page** or **Whole site** and the device.
- **Core Web Vitals history:** the same values as a weekly time series, for up to the last 40 weeks. Set the timeframe to **None** for all 40 weeks.
- **Page experience diagnostics:** the LCP breakdown, the LCP element type, navigation types, device mix and round trip time over the last 28 days, for each selected website or page.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **CrUX Origin** | The host of the configured sitemap | The website. |
| **CrUX Page** | Each `<loc>` in the sitemap and every sitemap it links to, plus any **Key pages** | A page on the website. Key pages have the property `pageGroup` set to `Key page`. |
| **CrUX Competitor** | **Competitor websites** | A competitor website. |

## Known limitations

- **Pages need Chrome traffic:** CrUX only reports pages and websites with enough real Chrome visits. Tiles for quieter pages show "No Chrome UX Report data for this page and device", and a page can have phone data but no desktop data.
- **Data is a 28-day rolling window, not live:** current values cover the 28 days ending about two days ago, and history updates once a week. A fix shows fully after about four weeks, so pair this plugin with real-user monitoring or lab tests to see changes as they happen.
- **No country breakdown:** the CrUX API doesn't split data by country.
- **Up to 40 weeks of history:** the CrUX History API keeps 40 weekly periods, so longer timeframes aren't offered.
- **One request per page:** each page in a tile is one API request, and CrUX allows about 150 requests a minute for each API key, so avoid tiles that cover hundreds of pages at once. Results are cached for 6 hours (24 hours for history), because CrUX only publishes new data daily and weekly, so busy dashboards don't add requests.
- **Sitemaps:**
  - Only pages on your website are imported, up to **Maximum pages**. Key pages don't count toward that limit.
  - Child and nested sitemaps are followed when they're on your website's domain, including a CDN or `sitemaps.` subdomain. Sitemaps from other domains are skipped. If the sitemap itself is on a CDN, the website is taken from the pages it lists.
  - Gzipped sitemaps (`.xml.gz`) can't be read and are skipped. If your index lists only gzipped files, point **Sitemap URL** at a plain XML sitemap.
  - One import makes at most about 200 requests. Each sitemap file is one request, and so is every 5,000 pages of a large file. A site split into hundreds of small sitemaps is only partly imported, so point **Sitemap URL** at the sitemap that lists your most important pages instead.
- **Sites that block cloud servers:** some websites' bot protection refuses requests from cloud providers, so the sitemap fails with "Access Denied". Add the data source **Via relay agent** so requests come from your own network, which the website already trusts, or allowlist SquaredUp on the website's CDN.
- **Changing the sitemap:** pages from the previous sitemap can stay listed for a short time after the next import, until SquaredUp clears them.
- **Read-only:** the plugin only reads public CrUX data and your sitemap.
