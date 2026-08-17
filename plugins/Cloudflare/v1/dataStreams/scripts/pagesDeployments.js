// Flattens the deployment's nested latest_stage and deployment_trigger.metadata
// (two levels deep, beyond what expandInnerObjects can reach in one pass).
result = ((data && data.result) || []).map((deployment) => {
    const stage = deployment.latest_stage || {};
    const trigger = deployment.deployment_trigger || {};
    const meta = trigger.metadata || {};

    return {
        short_id: deployment.short_id || deployment.id,
        environment: deployment.environment || "",
        status: stage.status || "",
        stage: stage.name || "",
        url: deployment.url || "",
        branch: meta.branch || "",
        commit: meta.commit_hash ? meta.commit_hash.substring(0, 7) : "",
        commitMessage: meta.commit_message || "",
        created_on: deployment.created_on,
    };
});
