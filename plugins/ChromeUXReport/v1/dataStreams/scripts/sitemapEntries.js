// Walks the sitemap and its child sitemaps one import page at a time, so no single page
// passes the platform's response size limit. The queue of sitemaps still to read rides in
// the next URL's fragment, which is never sent to the website.
const PAGES_PER_CHUNK = 5000;
const MAX_IMPORT_PAGES = 200;

const config = context.dataSources[0];
const configured = new URL(config.sitemapUrl);
const maxPages = Number(config.maxPages) || 50000;
const first = (value) => (Array.isArray(value) ? value[0] : value);
const lines = (text) => String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const normalize = (text) => {
    let url;
    try {
        url = new URL(String(text || "").trim());
    } catch {
        return null;
    }
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    url.hash = "";
    return url;
};

// The registrable domain, so sitemaps on cdn.example.com or sitemaps.example.com still count as
// the site's own, while a link to another company's sitemap is skipped
const siteDomain = (hostname) => {
    const labels = hostname.split(".");
    const twoPartSuffix = labels.length > 2 && labels[labels.length - 1].length === 2 && labels[labels.length - 2].length <= 3;
    return labels.slice(twoPartSuffix ? -3 : -2).join(".");
};
const domain = siteDomain(configured.hostname);
const onSiteDomain = (url) => url.hostname === domain || url.hostname.endsWith("." + domain);

const incoming = context.pagingContext ? String(context.pagingContext) : "";
const state = incoming.includes("#crux=")
    ? JSON.parse(decodeURIComponent(incoming.split("#crux=")[1]))
    : { queue: [], skip: 0, page: 0, imported: 0, origin: null };
const current = incoming ? incoming.split("#")[0] : configured.href;
const page = state.page + 1;

const isIndex = Boolean(data?.sitemapindex);
const entries = [...[].concat(data?.urlset?.url || []), ...[].concat(data?.sitemapindex?.sitemap || [])]
    .map((entry) => normalize(first(entry?.loc)))
    .filter((url) => url && onSiteDomain(url));

const children = [];
const pageUrls = [];
for (const url of entries) {
    if (url.href === configured.href || url.href === current) continue;
    if (isIndex || /\.xml(\.gz)?$/i.test(url.pathname)) {
        // Gzipped sitemaps can't be read here, so only plain XML sitemaps are followed
        if (!/\.gz$/i.test(url.pathname)) children.push(url.href);
    } else {
        pageUrls.push(url);
    }
}

// The website is usually the sitemap's own origin, but a sitemap hosted on a CDN lists pages
// on the real site, so take the origin most of the first pages use (the sitemap's own on a tie)
let origin = state.origin;
const rows = new Map();
if (!origin && pageUrls.length) {
    const counts = _.countBy(pageUrls, (url) => url.origin);
    const most = _.max(Object.values(counts));
    origin = counts[configured.origin] === most ? configured.origin : _.findKey(counts, (count) => count === most);
    rows.set(origin, { url: origin, sourceType: "CrUX Origin" });
}

if (page === 1) {
    for (const competitor of lines(config.competitors).map(normalize)) {
        if (competitor && competitor.origin !== (origin || configured.origin)) {
            rows.set(competitor.origin, { url: competitor.origin, sourceType: "CrUX Competitor" });
        }
    }
    // Key pages are imported even when the sitemap doesn't list them, and don't use up Maximum pages
    for (const keyPage of lines(config.keyPages).map(normalize).filter(Boolean)) {
        rows.set(keyPage.href, { url: keyPage.href, sourceType: "CrUX Page", pageGroup: "Key page" });
    }
}

const keyPages = new Set(lines(config.keyPages).map(normalize).filter(Boolean).map((url) => url.href));
const sitePages = origin ? pageUrls.filter((url) => url.origin === origin) : [];
const room = Math.max(0, maxPages - state.imported);
const chunk = sitePages.slice(state.skip, state.skip + Math.min(PAGES_PER_CHUNK, room));
for (const url of chunk) {
    rows.set(url.href, { url: url.href, sourceType: "CrUX Page", pageGroup: keyPages.has(url.href) ? "Key page" : "Other page" });
}
result = [...rows.values()];
const imported = state.imported + chunk.length;

// Children are queued only on the first chunk of a sitemap, so a split sitemap adds them once
const queue = [...(state.skip === 0 ? children.map((u) => ({ u, skip: 0 })) : []), ...state.queue];
if (state.skip + PAGES_PER_CHUNK < sitePages.length) {
    queue.unshift({ u: current, skip: state.skip + PAGES_PER_CHUNK });
}

if (queue.length && page < MAX_IMPORT_PAGES && imported < maxPages) {
    const [next, ...rest] = queue;
    pagingContext = next.u + "#crux=" + encodeURIComponent(JSON.stringify({ queue: rest, skip: next.skip, page, imported, origin }));
} else {
    pagingContext = undefined;
    if (!origin) result.push({ url: configured.origin, sourceType: "CrUX Origin" });
}
