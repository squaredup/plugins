// Resource Search returns one row per resource with no region, because each search
// only covers the region it was sent to. Add the region from the Region object this
// request was scoped to, map OCI's resourceType to this plugin's object types, and
// turn the tag maps into lists so they can be filtered and imported.

const SOURCE_TYPES = {
    instance: "Compute Instance",
    volume: "Block Volume",
    bootvolume: "Boot Volume",
    vcn: "VCN",
    subnet: "Subnet",
    loadbalancer: "Load Balancer",
    networkloadbalancer: "Network Load Balancer",
    autonomousdatabase: "Autonomous Database",
    dbsystem: "DB System",
    bucket: "Bucket",
    clusterscluster: "Kubernetes Cluster",
    filesystem: "File System",
    functionsapplication: "Functions Application",
    functionsfunction: "Function"
};

const region = context.objects?.[0]?.rawId;

const freeformTagList = (tags) =>
    Object.entries(tags || {}).map(([key, value]) => `${key}: ${value}`);

const definedTagList = (tags) =>
    Object.entries(tags || {}).flatMap(([namespace, keys]) =>
        Object.entries(keys || {}).map(([key, value]) => `${namespace}.${key}: ${value}`)
    );

result = (data?.items || [])
    .filter((item) => SOURCE_TYPES[String(item.resourceType).toLowerCase()])
    .map((item) => ({
        identifier: item.identifier,
        displayName: item.displayName || item.identifier,
        sourceType: SOURCE_TYPES[String(item.resourceType).toLowerCase()],
        resourceType: item.resourceType,
        region,
        compartmentId: item.compartmentId,
        availabilityDomain: item.availabilityDomain,
        lifecycleState: item.lifecycleState,
        timeCreated: item.timeCreated,
        freeformTags: freeformTagList(item.freeformTags),
        definedTags: definedTagList(item.definedTags)
    }));
