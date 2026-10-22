// One row describing the configured sitemap, or no rows when it lists nothing that can be imported
const config = context.dataSources[0];
const first = (value) => (Array.isArray(value) ? value[0] : value);
const toUrl = (text) => {
    try {
        return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : "https://" + text);
    } catch {
        return null;
    }
};
const siteHost = (toUrl(String(config.website || "").trim()) || new URL(config.sitemapUrl)).hostname.replace(/^www\./, "");
const onSite = (url) => url && (url.hostname === siteHost || url.hostname.endsWith("." + siteHost));

const pageUrls = [].concat(data?.urlset?.url || []).map((entry) => toUrl(String(first(entry?.loc) || "")));
const sitemaps = [].concat(data?.sitemapindex?.sitemap || []).map((entry) => String(first(entry?.loc) || ""));
const readableSitemaps = sitemaps.filter((loc) => loc && !/\.gz$/i.test(loc)).length;
// Pages on another domain usually mean the sitemap is on a CDN and the Website field is needed
const sitePages = pageUrls.filter(onSite).length;

result = sitePages || readableSitemaps ? [{ pages: sitePages, sitemaps: sitemaps.length, readableSitemaps }] : [];
