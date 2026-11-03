// Apps keep their name under spec.name and their live deployment phase under active_deployment
result = (data.apps || []).map((a) => ({
    id: a.id,
    name: a.spec?.name || a.id,
    region: a.region?.slug || null,
    tier: a.tier_slug || null,
    liveUrl: a.live_url || null,
    defaultIngress: a.default_ingress || null,
    activeDeploymentId: a.active_deployment?.id || null,
    activeDeploymentPhase: a.active_deployment?.phase || null,
    inProgressDeploymentPhase: a.in_progress_deployment?.phase || null,
    lastDeploymentAt: a.last_deployment_created_at || null,
    projectId: a.project_id || null,
    createdAt: a.created_at,
    updatedAt: a.updated_at
}));

