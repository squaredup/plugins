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
const bareHost = (hostname) => hostname.replace(/^www\./, "");
// A short fingerprint keeps the list of visited sitemaps small enough to carry in the URL
const fingerprint = (text) => {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
    return hash.toString(36);
};

const normalize = (text) => {
    let value = String(text || "").trim();
    // People often type www.example.com without the scheme
    if (value && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = "https://" + value;
    let url;
    try {
        url = new URL(value);
    } catch {
        return null;
    }
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    url.hash = "";
    return url;
};

// The website is the Website field when it's set (for a sitemap kept on a CDN or another host),
// otherwise the sitemap's own origin. Only its pages are imported, so no subdomain can crowd it out.
const origin = (normalize(config.website) || configured).origin;
// Child sitemaps may sit on any subdomain of the site, such as sitemaps.example.com
const siteHost = bareHost(new URL(origin).hostname);
const onSiteDomain = (url) => url.hostname === siteHost || url.hostname.endsWith("." + siteHost);

const incoming = context.pagingContext ? String(context.pagingContext) : "";
// Defaults cover state written by an older version of this script during an upgrade
const state = {
    queue: [],
    seen: [],
    skip: 0,
    page: 0,
    imported: 0,
    ...(incoming.includes("#crux=") ? JSON.parse(decodeURIComponent(incoming.split("#crux=")[1])) : {})
};
const current = incoming ? incoming.split("#")[0] : configured.href;
const page = state.page + 1;
const seen = new Set([...(state.seen || []), fingerprint(configured.href), fingerprint(current)]);

const isIndex = Boolean(data?.sitemapindex);
const entries = [...[].concat(data?.urlset?.url || []), ...[].concat(data?.sitemapindex?.sitemap || [])]
    .map((entry) => normalize(first(entry?.loc)))
    .filter(Boolean);

const children = [];
const sitePages = [];
for (const url of entries) {
    // In a page list, only files named like sitemaps are sitemaps, so a feed.xml page stays a page
    const isSitemap = isIndex || /sitemap[^/]*\.xml(\.gz)?$/i.test(url.pathname);
    if (!isSitemap) {
        if (url.origin === origin) sitePages.push(url);
        continue;
    }
    const key = fingerprint(url.href);
    // Gzipped sitemaps can't be read here, so only plain XML sitemaps are followed
    if ((url.hostname === configured.hostname || onSiteDomain(url)) && !/\.gz$/i.test(url.pathname) && !seen.has(key)) {
        children.push(url.href);
        seen.add(key);
    }
}

const rows = new Map();
const keyPages = lines(config.keyPages).map(normalize).filter(Boolean);
if (page === 1) {
    rows.set(origin, { url: origin, sourceType: "origin" });
    for (const competitor of lines(config.competitors).map(normalize)) {
        if (competitor && competitor.origin !== origin) {
            rows.set(competitor.origin, { url: competitor.origin, sourceType: "competitor" });
        }
    }
    // Key pages are imported even when the sitemap doesn't list them, and don't use up Maximum pages
    for (const keyPage of keyPages) {
        rows.set(keyPage.href, { url: keyPage.href, sourceType: "page", pageGroup: "Key page" });
    }
}

// Key pages were imported on the first page, so the sitemap's copy is skipped, with or without
// a trailing slash, rather than becoming a second object for the same page
const withoutSlash = (href) => href.replace(/\/(?=$|\?)/, "");
const keyPageHrefs = new Set(keyPages.map((url) => withoutSlash(url.href)));
const room = Math.max(0, maxPages - state.imported);
const chunk = sitePages.slice(state.skip, state.skip + Math.min(PAGES_PER_CHUNK, room));
for (const url of chunk.filter((url) => !keyPageHrefs.has(withoutSlash(url.href)))) {
    rows.set(url.href, { url: url.href, sourceType: "page", pageGroup: "Other page" });
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
    // Only MAX_IMPORT_PAGES sitemaps are ever read, so a longer queue would only bloat the state
    const nextState = { queue: rest.slice(0, MAX_IMPORT_PAGES - page), seen: [...seen], skip: next.skip, page, imported };
    pagingContext = next.u + "#crux=" + encodeURIComponent(JSON.stringify(nextState));
} else {
    pagingContext = undefined;
}
