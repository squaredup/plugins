result =
    '{{resultType || "list"}}' === 'count'
        ? [{ count: data.total_count }]
        : data.items.map((p) => {
              const urlParts = p.repository_url.split('/');
              const repo_name = urlParts[urlParts.length - 1];
              const repo_url = p.repository_url.replace('api.github.com/repos/', 'www.github.com/');
              return {
                  assignee: p.assignee?.login ?? null,
                  closed_at: p.closed_at,
                  created_at: p.created_at,
                  draft: p.draft,
                  html_url: p.html_url,
                  id: p.id,
                  labels: p.labels?.map((l) => l.name).join(', '),
                  number: p.number,
                  repo_id: '{{typeof repos !== "undefined" && repos.length > 0 ? repos[0].sourceId : ""}}',
                  repo_name,
                  repo_url,
                  reviewers: p.requested_reviewers?.map((r) => r.login).join(', '),
                  state: p.state,
                  title: p.title,
                  updated_at: p.updated_at,
                  user: p.user?.login ?? null,
              };
          });
