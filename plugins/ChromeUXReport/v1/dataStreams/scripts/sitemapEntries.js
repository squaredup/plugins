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

// Child sitemaps are only followed on the sitemap's own host or a subdomain of the site, so
// sitemaps.example.com counts but a neighbor on a shared host such as github.io does not
const siteHost = configured.hostname.replace(/^www\./, "");
const isOwnSitemap = (url) =>
    url.hostname === configured.hostname || url.hostname === siteHost || url.hostname.endsWith("." + siteHost);

const incoming = context.pagingContext ? String(context.pagingContext) : "";
// Defaults cover state written by an older version of this script during an upgrade
const state = {
    queue: [],
    visited: [],
    skip: 0,
    page: 0,
    imported: 0,
    origin: null,
    ...(incoming.includes("#crux=") ? JSON.parse(decodeURIComponent(incoming.split("#crux=")[1])) : {})
};
const current = incoming ? incoming.split("#")[0] : configured.href;
const page = state.page + 1;
const visited = new Set([...state.visited, configured.href, current]);

const isIndex = Boolean(data?.sitemapindex);
const entries = [...[].concat(data?.urlset?.url || []), ...[].concat(data?.sitemapindex?.sitemap || [])]
    .map((entry) => normalize(first(entry?.loc)))
    .filter(Boolean);

const children = [];
const pageUrls = [];
for (const url of entries) {
    if (isIndex || /\.xml(\.gz)?$/i.test(url.pathname)) {
        // Gzipped sitemaps can't be read here, so only plain XML sitemaps are followed
        const queued = state.queue.some((item) => item.u === url.href);
        if (isOwnSitemap(url) && !/\.gz$/i.test(url.pathname) && !visited.has(url.href) && !queued) {
            children.push(url.href);
            visited.add(url.href);
        }
    } else {
        pageUrls.push(url);
    }
}

// The website is the origin most listed pages use, preferring the sitemap's own on a tie, so a
// sitemap hosted on a CDN still points at the real site
let origin = state.origin;
const rows = new Map();
if (!origin && pageUrls.length) {
    const counts = _.countBy(pageUrls, (url) => url.origin);
    const most = _.max(Object.values(counts));
    origin = counts[configured.origin] === most ? configured.origin : _.findKey(counts, (count) => count === most);
    rows.set(origin, { url: origin, sourceType: "CrUX Origin" });
}

const keyPages = lines(config.keyPages).map(normalize).filter(Boolean);
if (page === 1) {
    for (const competitor of lines(config.competitors).map(normalize)) {
        if (competitor && competitor.origin !== (origin || configured.origin)) {
            rows.set(competitor.origin, { url: competitor.origin, sourceType: "CrUX Competitor" });
        }
    }
    // Key pages are imported even when the sitemap doesn't list them, and don't use up Maximum pages
    for (const keyPage of keyPages) {
        rows.set(keyPage.href, { url: keyPage.href, sourceType: "CrUX Page", pageGroup: "Key page" });
    }
}

const keyPageHrefs = new Set(keyPages.map((url) => url.href));
const sitePages = origin ? pageUrls.filter((url) => url.origin === origin) : [];
const room = Math.max(0, maxPages - state.imported);
const chunk = sitePages.slice(state.skip, state.skip + Math.min(PAGES_PER_CHUNK, room));
for (const url of chunk) {
    rows.set(url.href, { url: url.href, sourceType: "CrUX Page", pageGroup: keyPageHrefs.has(url.href) ? "Key page" : "Other page" });
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
    const nextState = { queue: rest, visited: [...visited], skip: next.skip, page, imported, origin };
    pagingContext = next.u + "#crux=" + encodeURIComponent(JSON.stringify(nextState));
} else {
    pagingContext = undefined;
    if (!origin) result.push({ url: configured.origin, sourceType: "CrUX Origin" });
}
