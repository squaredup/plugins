// One row when the sitemap lists no gzipped sitemaps, none when it does, so setup can warn
const first = (value) => (Array.isArray(value) ? value[0] : value);
const gzipped = [].concat(data?.sitemapindex?.sitemap || [], data?.urlset?.url || [])
    .filter((entry) => /\.xml\.gz$/i.test(String(first(entry?.loc) || ""))).length;

result = gzipped ? [] : [{ gzipped }];
