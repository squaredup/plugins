// A 2xx alone doesn't prove the feed is usable - an HTML error or maintenance page would also
// arrive as 200 and reach this script as `data === undefined`. Check it actually parsed as RSS.
const channel = data && data.rss && data.rss.channel ? data.rss.channel[0] : undefined;

if (!channel) {
    api.report.error('The Trust portal did not return an RSS document.');
}

const items = channel.item || [];

if (items.length === 0) {
    api.report.error('The Trust portal feed returned RSS but contained no posts.');
}

result = [
    {
        feedTitle: channel.title ? channel.title[0] : undefined,
        posts: items.length
    }
];
