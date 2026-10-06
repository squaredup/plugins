// Parsing rules below are shared with cloudStatus.js - keep the two in step.
const channel = data && data.rss && data.rss.channel ? data.rss.channel[0] : undefined;

if (!channel) {
    api.report.error('The Trust portal did not return an RSS document.');
}

// The XML parser wraps every child element in an array, and elements that carry attributes
// (category, guid) become objects with the text under `_`.
const text = (el) => {
    const v = Array.isArray(el) ? el[0] : el;
    const s = v && typeof v === 'object' ? v._ : v;
    return s === undefined || s === null || String(s).trim() === '' ? undefined : String(s).trim();
};

const toDate = (s) => {
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
};

const iso = (d) => (d ? d.toISOString() : undefined);

const stripHtml = (html) => {
    if (!html) return undefined;
    const s = String(html)
        .replace(/<(br|\/p|\/li|\/div)[^>]*>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
    return s || undefined;
};

const truncate = (s, max) => (s && s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

const minutesBetween = (from, to) => {
    if (!from || !to) return undefined;
    const m = Math.round((to - from) / 60000);
    return m >= 0 ? m : undefined;
};

// Filter values arrive as plain strings (--ui) or as { value } objects (autocomplete in the tile editor).
const listParam = (v) =>
    (Array.isArray(v) ? v : v ? [v] : [])
        .map((x) => (x && typeof x === 'object' ? x.value : x))
        .map((x) => String(x || '').trim().toLowerCase())
        .filter(Boolean);

const productOf = (cloud) => {
    if (/^zpa|^private\.zscaler/.test(cloud)) return 'ZPA';
    if (/^zdx/.test(cloud)) return 'ZDX';
    if (/^zidentity/.test(cloud)) return 'ZIdentity';
    if (/^ztb-/.test(cloud)) return 'Zero Trust Branch';
    if (/^zscaler|^zscloud/.test(cloud)) return 'ZIA';
    return 'Other';
};

const TYPES = { 'Recent incident': 'Incident', 'Scheduled maintenance': 'Maintenance', Advisory: 'Advisory' };

// Titles end with " - <cloud> (<FedRAMP level>), <cloud> (<level>)", but the headline can contain " - " too,
// so only the text after the LAST one is treated as the cloud list.
const parseTitle = (rawTitle, link) => {
    const title = (rawTitle || '').trim();
    const cut = title.lastIndexOf(' - ');
    const clouds = [];

    if (cut >= 0) {
        for (const entry of title.slice(cut + 3).split(',')) {
            const m = entry.trim().match(/^([^(]*?)\s*(?:\(([^)]*)\))?$/);
            const cloud = m ? m[1].trim().toLowerCase() : '';
            if (/^[a-z0-9.-]+$/.test(cloud) && (cloud.includes('.') || /^ztb-/.test(cloud))) {
                clouds.push({ cloud, level: m[2] ? m[2].replace(/^FedRAMP\s+/i, '').trim() : undefined });
            }
        }
    }

    if (clouds.length > 0) {
        return { headline: title.slice(0, cut).trim(), clouds };
    }

    const segment = (link || '').replace(/^https?:\/\/[^/]+\//, '').split('/')[0].toLowerCase();
    return { headline: title, clouds: segment ? [{ cloud: segment, level: undefined }] : [] };
};

const parseDescription = (html) => {
    const raw = html || '';
    const cut = raw.search(/<div[^>]*class="post-updates"/);
    const body = cut >= 0 ? raw.slice(0, cut) : raw;
    const updates = [];

    if (cut >= 0) {
        for (const chunk of raw.slice(cut).split('<p class="zs-update">').slice(1)) {
            const time = chunk.match(/class="report-time">([^<]*)</);
            const afterHeader = chunk.slice(chunk.indexOf('</p>') + 4);
            updates.push({ time: toDate(time ? time[1].trim() : undefined), text: stripHtml(afterHeader) });
        }
    }

    const para = body.match(/<p[^>]*class="post_body"[^>]*>([\s\S]*?)<\/p>/) || body.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    return { firstParagraph: stripHtml(para ? para[1] : body), updates };
};

const now = new Date();
const config = context.config || {};
const dataSource = (context.dataSources && context.dataSources[0]) || {};

const sourceClouds = listParam((dataSource.clouds || '').split(','));
const wantedTypes = listParam(config.type);
const wantedClouds = listParam(config.cloud);
const oneRowPerCloud = config.oneRowPerCloud === true || config.oneRowPerCloud === 'true';
const dateField = config.dateField === 'eventWindow' ? 'eventWindow' : 'published';

// A tile set to None still receives a (24 hour) start/end - the enum is the only reliable signal.
const tf = context.timeframe;
const windowStart = tf && tf.enum !== 'none' ? toDate(tf.start) : undefined;
const windowEnd = tf && tf.enum !== 'none' ? toDate(tf.end) : undefined;

const rows = [];

for (const item of channel.item || []) {
    const link = text(item.link);
    const { headline, clouds } = parseTitle(text(item.title), link);
    const cloudNames = clouds.map((c) => c.cloud);

    if (sourceClouds.length > 0 && !cloudNames.some((c) => sourceClouds.includes(c))) continue;

    const type = TYPES[text(item.category)] || text(item.category);
    if (wantedTypes.length > 0 && !wantedTypes.includes(String(type).toLowerCase())) continue;
    if (wantedClouds.length > 0 && !cloudNames.some((c) => wantedClouds.includes(c))) continue;

    const published = toDate(text(item.pubDate));
    const startTime = toDate(text(item.startTime));
    const endTime = toDate(text(item.endTime));
    const resolved = toDate(text(item.ResolvedDate));
    const status = text(item.Status);

    let phase;
    if (type === 'Maintenance') {
        if (status === 'Upcoming') phase = 'Upcoming';
        else if (status === 'In Progress') phase = 'Active';
        else if (status === 'Completed' || status === 'Cancelled') phase = 'Closed';
        else if (startTime && startTime > now) phase = 'Upcoming';
        else if (endTime && endTime > now) phase = 'Active';
        else phase = 'Closed';
    } else if (type === 'Incident') {
        phase = ['Resolved', 'Remediated', 'Cancelled'].includes(status) || resolved ? 'Closed' : 'Active';
    } else {
        phase = resolved ? 'Closed' : 'Active';
    }

    let state = 'success';
    if (phase === 'Active') {
        // Matches cloudStatus.js: only an outage is an error; degradations and monitoring are warnings.
        const isOutage = text(item.eventType) === 'Service Disruption' && status !== 'Monitoring';
        if (type === 'Incident') state = isOutage ? 'error' : 'warning';
        else if (type === 'Maintenance') state = 'warning';
        else state = 'unknown';
    } else if (phase === 'Upcoming') {
        state = 'unknown';
    }

    if (windowStart && windowEnd) {
        if (dateField === 'published') {
            if (!published || published < windowStart || published > windowEnd) continue;
        } else {
            const from = startTime || published;
            const to = endTime || resolved || (phase === 'Closed' ? from : now);
            if (!from || from > windowEnd || to < windowStart) continue;
        }
    }

    const { firstParagraph, updates } = parseDescription(text(item.description));
    const dated = updates.filter((u) => u.time);
    const newest = dated.length > 0 ? dated.reduce((a, b) => (b.time > a.time ? b : a)) : undefined;
    const latest = newest || updates[0];
    const guid = text(item.guid);
    const levels = [...new Set(clouds.map((c) => c.level).filter(Boolean))];

    const base = {
        id: guid ? guid.split(' ')[0] : (link || '').split('/').pop(),
        title: headline,
        type,
        eventType: text(item.eventType),
        status,
        phase,
        state,
        clouds: cloudNames.join(', '),
        published: iso(published),
        startTime: iso(startTime),
        endTime: iso(endTime),
        resolvedTime: iso(resolved),
        lastUpdated: iso(newest ? newest.time : published),
        durationMinutes: minutesBetween(startTime, endTime),
        timeToResolveMinutes: type === 'Incident' ? minutesBetween(startTime, resolved) : undefined,
        howFound: text(item.HowFound),
        nextUpdate: text(item.nextUpdate),
        customerImpact: stripHtml(text(item.customerImpact)),
        workaround: stripHtml(text(item.availableWorkaround)),
        summary: truncate(stripHtml(text(item.summary)) || firstParagraph, 400),
        updateCount: updates.length,
        latestUpdate: truncate(latest ? latest.text : undefined, 400),
        link
    };

    if (oneRowPerCloud) {
        for (const c of clouds) {
            rows.push({
                ...base,
                id: `${base.id}-${c.cloud}`,
                cloud: c.cloud,
                product: productOf(c.cloud),
                fedrampLevel: c.level
            });
        }
    } else {
        rows.push({
            ...base,
            cloud: cloudNames[0],
            product: cloudNames.length > 0 ? productOf(cloudNames[0]) : 'Other',
            fedrampLevel: levels.length > 0 ? levels.join(', ') : undefined
        });
    }
}

result = rows;
