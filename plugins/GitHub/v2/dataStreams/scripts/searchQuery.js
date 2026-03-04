result =
    '{{resultType || "list"}}' === 'count'
        ? [{ count: data.total_count }]
        : data.items.map((item) => {
              const urlParts = item.repository_url.split('/');
              const repo_name = urlParts[urlParts.length - 1];
              const repo_url = item.repository_url.replace('api.github.com/repos/', 'www.github.com/');
              return {
                  assignee: item.assignee?.login ?? null,
                  closed_at: item.closed_at,
                  created_at: item.created_at,
                  html_url: item.html_url,
                  labels: item.labels?.map((l) => l.name).join(', '),
                  number: item.number,
                  repo_name,
                  repo_url,
                  state: item.state,
                  title: item.title,
                  type: item.pull_request ? 'pull_request' : 'issue',
                  updated_at: item.updated_at,
                  user: item.user?.login ?? null,
              };
          });
