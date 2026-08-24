const facets = data?.['@search.facets']?.entityType || [];
result = facets.map((f) => ({ entityType: f.value, count: Number(f.count) }));
