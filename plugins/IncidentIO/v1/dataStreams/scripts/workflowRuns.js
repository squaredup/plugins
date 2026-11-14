// dataStreams/scripts/workflowRuns.js
// One row per workflow run. runState: error present -> error, cancelled -> unknown,
// a step still pending or suspended -> unknown, else success.
result = (data.workflow_runs || []).map((run) => {
    const progress = run.progress || [];
    const failedSteps = progress.filter((step) => step.error).length;
    let runState = 'success';
    if (run.error) {
        runState = 'error';
    } else if (run.cancelled_at || progress.some((step) => step.status === 'pending' || step.status === 'suspended')) {
        runState = 'unknown';
    }
    return {
        id: run.id,
        workflowName: run.workflow_name,
        workflowId: run.workflow_id,
        workflowVersion: run.workflow_version_number,
        incidentReference: run.incident_reference || null,
        incidentId: run.incident_id || null,
        createdAt: run.created_at,
        runState,
        error: run.error || null,
        stepCount: progress.length,
        failedStepCount: failedSteps,
    };
});
