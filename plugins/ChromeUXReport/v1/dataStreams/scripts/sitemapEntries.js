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

const incoming = context.pagingContext ? String(context.pagingContext) : "";
// Defaults cover state written by an older version of this script during an upgrade
const state = {
    queue: [],
    seen: [],
    skip: 0,
    page: 0,
    imported: 0,
    siteHost: null,
    ...(incoming.includes("#crux=") ? JSON.parse(decodeURIComponent(incoming.split("#crux=")[1])) : {})
};
const current = incoming ? incoming.split("#")[0] : configured.href;
const page = state.page + 1;
const seen = new Set([...(state.seen || []), fingerprint(configured.href), fingerprint(current)]);

// The site is the sitemap's own domain and its subdomains, so a blog. or help. sitemap listed
// first still belongs to it, while a neighbor on a shared host such as github.io does not
const onSite = (url, host) => url.hostname === host || url.hostname.endsWith("." + host);

const isIndex = Boolean(data?.sitemapindex);
const entries = [...[].concat(data?.urlset?.url || []), ...[].concat(data?.sitemapindex?.sitemap || [])]
    .map((entry) => normalize(first(entry?.loc)))
    .filter(Boolean);

const sitemapUrls = [];
const pageUrls = [];
for (const url of entries) {
    // In a page list, only files named like sitemaps are sitemaps, so a feed.xml page stays a page
    const isSitemap = isIndex || /sitemap[^/]*\.xml(\.gz)?$/i.test(url.pathname);
    (isSitemap ? sitemapUrls : pageUrls).push(url);
}

// A sitemap hosted on a CDN lists none of its own pages, so the site comes from the pages instead
let siteHost = state.siteHost;
if (!siteHost && pageUrls.length) {
    const ownHost = bareHost(configured.hostname);
    siteHost = pageUrls.some((url) => onSite(url, ownHost))
        ? ownHost
        : bareHost(new URL(_.maxBy(Object.entries(_.countBy(pageUrls, (url) => url.origin)), ([, count]) => count)[0]).hostname);
}
const followHost = siteHost || bareHost(configured.hostname);

const children = [];
for (const url of sitemapUrls) {
    const key = fingerprint(url.href);
    // Gzipped sitemaps can't be read here, so only plain XML sitemaps are followed
    if ((url.hostname === configured.hostname || onSite(url, followHost)) && !/\.gz$/i.test(url.pathname) && !seen.has(key)) {
        children.push(url.href);
        seen.add(key);
    }
}

const rows = new Map();
const keyPages = lines(config.keyPages).map(normalize).filter(Boolean);
if (siteHost && !state.siteHost) {
    // The website is the sitemap's own origin when the sitemap is on the site, otherwise the busiest one
    const origins = _.countBy(pageUrls.filter((url) => onSite(url, siteHost)), (url) => url.origin);
    const origin = onSite(configured, siteHost) ? configured.origin : _.maxBy(Object.keys(origins), (key) => origins[key]);
    rows.set(origin, { url: origin, sourceType: "CrUX Origin" });
}
if (page === 1) {
    for (const competitor of lines(config.competitors).map(normalize)) {
        if (competitor && !onSite(competitor, followHost)) {
            rows.set(competitor.origin, { url: competitor.origin, sourceType: "CrUX Competitor" });
        }
    }
    // Key pages are imported even when the sitemap doesn't list them, and don't use up Maximum pages
    for (const keyPage of keyPages) {
        rows.set(keyPage.href, { url: keyPage.href, sourceType: "CrUX Page", pageGroup: "Key page" });
    }
}

const keyPageHrefs = new Set(keyPages.map((url) => url.href));
const sitePages = siteHost ? pageUrls.filter((url) => onSite(url, siteHost)) : [];
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
    const nextState = { queue: rest, seen: [...seen], skip: next.skip, page, imported, siteHost };
    pagingContext = next.u + "#crux=" + encodeURIComponent(JSON.stringify(nextState));
} else {
    pagingContext = undefined;
    if (!siteHost) result.push({ url: configured.origin, sourceType: "CrUX Origin" });
}
