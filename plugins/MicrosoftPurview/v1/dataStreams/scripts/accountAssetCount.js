const isApproximate = data?.['@search.count.approximate'] === true;
const total = Number(data?.['@search.count']) || 0;
result = [{ label: isApproximate ? 'Total Assets (approx)' : 'Total Assets', totalAssets: total }];
