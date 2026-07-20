const total = Number(data?.['@search.count']) || 0;
const facets = data?.['@search.facets']?.classification || [];
const classified = facets.reduce((sum, f) => sum + (Number(f.count) || 0), 0);
const unclassified = Math.max(0, total - classified);

result = [
    { state: 'Classified', label: 'Classified', assets: classified },
    { state: 'Unclassified', label: 'Unclassified', assets: unclassified },
];
