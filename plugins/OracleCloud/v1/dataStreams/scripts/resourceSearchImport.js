// Map OCI Resource Search resource types to SquaredUp object types. Rows of
// a type not listed here are dropped, so a type picked in the configuration
// but missing from this map is never imported with an unknown sourceType.
const TYPES = {
    instance: "OCI Compute Instance",
    autonomousdatabase: "OCI Autonomous Database",
    dbsystem: "OCI DB System",
    database: "OCI Database",
    mysqldbsystem: "OCI MySQL DB System",
    bucket: "OCI Bucket",
    loadbalancer: "OCI Load Balancer",
    networkloadbalancer: "OCI Network Load Balancer",
    vcn: "OCI VCN",
    subnet: "OCI Subnet",
    volume: "OCI Block Volume",
    bootvolume: "OCI Boot Volume",
    clusterscluster: "OCI OKE Cluster",
    functionsapplication: "OCI Functions Application",
    functionsfunction: "OCI Function",
    apigateway: "OCI API Gateway",
    stream: "OCI Stream",
    loggroup: "OCI Log Group",
    alarm: "OCI Alarm",
    databasetoolsconnection: "OCI Database Tools Connection",
};

const region = context.objects[0].rawId;

result = (data?.items || [])
    .map((item) => ({
        identifier: item.identifier,
        displayName: item.displayName || item.identifier,
        sourceType: TYPES[String(item.resourceType || "").toLowerCase()],
        resourceType: item.resourceType,
        region,
        compartmentId: item.compartmentId,
        lifecycleState: item.lifecycleState,
        availabilityDomain: item.availabilityDomain || null,
        timeCreated: item.timeCreated,
        freeformTags: Object.entries(item.freeformTags || {}).map(([k, v]) => (v ? `${k}: ${v}` : k)),
    }))
    .filter((row) => row.sourceType);
