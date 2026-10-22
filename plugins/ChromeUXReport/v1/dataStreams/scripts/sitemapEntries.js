// Walks the sitemap and its child sitemaps one import page at a time, so no single page
// passes the platform's response size limit. The queue of sitemaps still to read rides in
// the next URL's fragment, which is never sent to the website.
const PAGES_PER_CHUNK = 5000;
const MAX_IMPORT_PAGES = 200;

const config = context.dataSources[0];
const configured = new URL(config.sitemapUrl);
const origin = configured.origin;
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

const keyPages = new Set(lines(config.keyPages).map(normalize).filter((url) => url?.origin === origin).map((url) => url.href));

const incoming = context.pagingContext ? String(context.pagingContext) : "";
const state = incoming.includes("#crux=")
    ? JSON.parse(decodeURIComponent(incoming.split("#crux=")[1]))
    : { queue: [], skip: 0, page: 0, imported: 0 };
const current = incoming ? incoming.split("#")[0] : configured.href;
const page = state.page + 1;

const isIndex = Boolean(data?.sitemapindex);
const entries = [...[].concat(data?.urlset?.url || []), ...[].concat(data?.sitemapindex?.sitemap || [])]
    .map((entry) => normalize(first(entry?.loc)))
    .filter((url) => url?.origin === origin);

const children = [];
const pages = [];
for (const url of entries) {
    if (url.href === configured.href || url.href === current) continue;
    if (isIndex || /\.xml(\.gz)?$/i.test(url.pathname)) children.push(url.href);
    else pages.push(url);
}

const rows = new Map();
if (page === 1) {
    rows.set(origin, { url: origin, sourceType: "CrUX Origin" });
    for (const competitor of lines(config.competitors).map(normalize)) {
        if (competitor && competitor.origin !== origin) {
            rows.set(competitor.origin, { url: competitor.origin, sourceType: "CrUX Competitor" });
        }
    }
    // Key pages are imported even when the sitemap doesn't list them
    for (const href of keyPages) rows.set(href, { url: href, sourceType: "CrUX Page", pageGroup: "Key page" });
}
const room = Math.max(0, maxPages - state.imported);
for (const url of pages.slice(state.skip, state.skip + Math.min(PAGES_PER_CHUNK, room))) {
    rows.set(url.href, { url: url.href, sourceType: "CrUX Page", pageGroup: keyPages.has(url.href) ? "Key page" : "Other page" });
}
result = [...rows.values()];
const imported = state.imported + result.filter((row) => row.sourceType === "CrUX Page").length;

// Children are queued only on the first chunk of a sitemap, so a split sitemap adds them once
const queue = [...(state.skip === 0 ? children.map((u) => ({ u, skip: 0 })) : []), ...state.queue];
if (state.skip + PAGES_PER_CHUNK < pages.length) {
    queue.unshift({ u: current, skip: state.skip + PAGES_PER_CHUNK });
}

if (queue.length && page < MAX_IMPORT_PAGES && imported < maxPages) {
    const [next, ...rest] = queue;
    pagingContext = next.u + "#crux=" + encodeURIComponent(JSON.stringify({ queue: rest, skip: next.skip, page, imported }));
} else {
    pagingContext = undefined;
}
