// Flattens the deeply-nested latest_deployment.latest_stage structure and
// stamps the account id from the scoped object onto every row.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((project) => {
    const latest = project.latest_deployment || {};
    const stage = latest.latest_stage || {};
    return {
        sourceId: project.id,
        projectName: project.name,
        accountId: accountId,
        subdomain: project.subdomain || "",
        // A readable list for display only. Array properties are JSON-stringified
        // on import (SAAS-9816), so the Pages Project -> Zone rule correlates on
        // primaryDomain below rather than on this column.
        domains: (project.domains || []).join(", "),
        primaryDomain: (project.domains || [])[0] || "",
        productionBranch: project.production_branch || "",
        latestDeploymentStatus: stage.status || "",
        latestDeploymentOn: latest.modified_on || latest.created_on,
        createdOn: project.created_on,
    };
});
