const scans = data?.value || [];

result = scans.map((scan) => {
    const props = scan.properties || {};

    return {
        name: scan.name || '',
        dataSourceName: scan.dataSourceName || '',
        kind: scan.kind || '',
        creationType: scan.creationType || '',
        'properties.collection.referenceName': props.collection?.referenceName || '',
        'properties.scanRulesetName': props.scanRulesetName || '',
        'properties.scanRulesetType': props.scanRulesetType || '',
    };
});
