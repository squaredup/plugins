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

// The website is the domain of the Website field when it's set (for a sitemap kept on a CDN or
// another host), otherwise the sitemap's own domain. It covers www and every other subdomain.
const website = normalize(config.website);
const siteHost = bareHost((website || configured).hostname);
const onSite = (url) => url.hostname === siteHost || url.hostname.endsWith("." + siteHost);

const incoming = context.pagingContext ? String(context.pagingContext) : "";
// Defaults cover state written by an older version of this script during an upgrade
const state = {
    queue: [],
    seen: [],
    skip: 0,
    page: 0,
    imported: 0,
    origins: {},
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
        if (onSite(url)) sitePages.push(url);
        continue;
    }
    const key = fingerprint(url.href);
    // Gzipped sitemaps can't be read here, so only plain XML sitemaps are followed
    if ((url.hostname === configured.hostname || onSite(url)) && !/\.gz$/i.test(url.pathname) && !seen.has(key)) {
        children.push(url.href);
        seen.add(key);
    }
}

const rows = new Map();
const keyPages = lines(config.keyPages).map(normalize).filter(Boolean);
if (page === 1) {
    for (const competitor of lines(config.competitors).map(normalize)) {
        if (competitor && !onSite(competitor)) {
            rows.set(competitor.origin, { url: competitor.origin, sourceType: "CrUX Competitor" });
        }
    }
    // Key pages are imported even when the sitemap doesn't list them, and don't use up Maximum pages
    for (const keyPage of keyPages) {
        rows.set(keyPage.href, { url: keyPage.href, sourceType: "CrUX Page", pageGroup: "Key page" });
    }
}

const keyPageHrefs = new Set(keyPages.map((url) => url.href));
const room = Math.max(0, maxPages - state.imported);
const chunk = sitePages.slice(state.skip, state.skip + Math.min(PAGES_PER_CHUNK, room));
const origins = { ...state.origins };
for (const url of chunk) {
    rows.set(url.href, { url: url.href, sourceType: "CrUX Page", pageGroup: keyPageHrefs.has(url.href) ? "Key page" : "Other page" });
    origins[url.origin] = (origins[url.origin] || 0) + 1;
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
    const nextState = { queue: rest, seen: [...seen], skip: next.skip, page, imported, origins };
    pagingContext = next.u + "#crux=" + encodeURIComponent(JSON.stringify(nextState));
} else {
    pagingContext = undefined;
    // The whole-site figures use the origin most pages are on, so a sitemap on example.com that
    // lists www.example.com pages still reports on www.example.com
    const busiest = _.maxBy(Object.keys(origins), (key) => origins[key]);
    const origin = website ? website.origin : busiest || configured.origin;
    result.push({ url: origin, sourceType: "CrUX Origin" });
}
