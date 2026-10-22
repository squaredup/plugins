// One row describing the configured sitemap, or no rows when it lists nothing readable
const first = (value) => (Array.isArray(value) ? value[0] : value);
const pages = [].concat(data?.urlset?.url || []).length;
const sitemaps = [].concat(data?.sitemapindex?.sitemap || []).map((entry) => String(first(entry?.loc) || ""));
const readableSitemaps = sitemaps.filter((loc) => loc && !/\.gz$/i.test(loc)).length;

result = pages || readableSitemaps ? [{ pages, sitemaps: sitemaps.length, readableSitemaps }] : [];
