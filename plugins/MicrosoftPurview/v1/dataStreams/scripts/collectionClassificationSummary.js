const assets = data?.value || [];
const total = Number(data?.['@search.count']) || 0;
const classified = assets.filter(a => (a.classification?.length ?? 0) > 0).length;
const unclassified = Math.max(0, total - classified);

result = [
    { state: 'Classified', label: 'Classified', assets: classified },
    { state: 'Unclassified', label: 'Unclassified', assets: unclassified },
];
