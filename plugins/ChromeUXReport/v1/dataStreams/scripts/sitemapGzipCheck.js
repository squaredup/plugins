// One row when the sitemap lists no gzipped sitemaps, none when it does, so setup can warn
const first = (value) => (Array.isArray(value) ? value[0] : value);
const gzipped = [].concat(data?.sitemapindex?.sitemap || [], data?.urlset?.url || [])
    .filter((entry) => {
        const loc = String(first(entry?.loc) || "");
        // Test the path alone, so a query string after .xml.gz still counts
        try {
            return /\.xml\.gz$/i.test(new URL(loc).pathname);
        } catch {
            return /\.xml\.gz$/i.test(loc);
        }
    }).length;

result = gzipped ? [] : [{ gzipped }];
