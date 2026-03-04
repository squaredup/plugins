result = data.map((deployment) => ({
    created_at: deployment.created_at,
    creator: deployment.creator?.login ?? null,
    description: deployment.description,
    environment: deployment.environment,
    id: deployment.id,
    production_environment: deployment.production_environment,
    ref: deployment.ref,
    sha: deployment.sha?.substring(0, 7) ?? null,
    task: deployment.task,
    transient_environment: deployment.transient_environment,
    updated_at: deployment.updated_at,
}));
