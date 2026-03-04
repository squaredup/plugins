result =
    '{{resultType || "list"}}' === 'count'
        ? [{ count: data.total_count }]
        : data.items.map((i) => {
              const urlParts = i.repository_url.split('/');
              const repo_name = urlParts[urlParts.length - 1];
              const repo_url = i.repository_url.replace('api.github.com/repos/', 'www.github.com/');
              return {
                  assignee: i.assignee?.login ?? null,
                  closed_at: i.closed_at,
                  created_at: i.created_at,
                  html_url: i.html_url,
                  labels: i.labels?.map((l) => l.name).join(', '),
                  number: i.number,
                  repo_id: '{{typeof repos !== "undefined" && repos.length > 0 ? repos[0].sourceId : ""}}',
                  repo_name,
                  repo_url,
                  state: i.state,
                  title: i.title,
                  updated_at: i.updated_at,
                  user: i.user?.login ?? null,
              };
          });
