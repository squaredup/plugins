const scans = data?.value || [];

result = scans.map((scan) => {
    const props = scan.properties || {};

    return {
        name: scan.name || '',
        dataSourceName: scan.dataSourceName || '',
        kind: scan.kind || '',
        collection: props.collection?.referenceName || '',
        creationType: scan.creationType || '',
        'properties.scanRulesetName': props.scanRulesetName || '',
        'properties.scanRulesetType': props.scanRulesetType || '',
        sourceType: 'Purview Scan',
    };
});
