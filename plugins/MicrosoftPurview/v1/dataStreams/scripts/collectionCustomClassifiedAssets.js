const assets = data?.value || [];
const rows = [];

for (const asset of assets) {
    const classifications = (asset.classification || []).filter(c => !c.startsWith('MICROSOFT.'));
    if (classifications.length === 0) continue;
    for (const cls of classifications) {
        rows.push({
            assetName: asset.name || '',
            entityType: asset.entityType || '',
            collectionId: asset.collectionId || '',
            classification: cls,
        });
    }
}

result = rows;
