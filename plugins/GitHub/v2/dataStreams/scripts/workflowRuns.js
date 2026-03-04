const workflowFilter = '{{typeof workflow !== "undefined" ? workflow : ""}}';

result = data.workflow_runs
    .filter((run) => !workflowFilter || run.name === workflowFilter)
    .map((run) => ({
        actor_login: run.actor?.login ?? null,
        conclusion: run.conclusion,
        created_at: run.created_at,
        display_title: run.display_title,
        duration: Math.floor((new Date(run.updated_at) - new Date(run.run_started_at)) / 1000),
        event: run.event,
        head_branch: run.head_branch,
        html_url: run.html_url,
        name: run.name,
        repository_name: run.repository?.name ?? '',
        run_started_at: run.run_started_at,
        status: run.status,
        updated_at: run.updated_at,
    }));
