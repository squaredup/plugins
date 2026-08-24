// /v1/users/me returns a single user object (the integration's bot user),
// not an array — wrap it as one row and surface the workspace name.
result = [
    {
        id: data.id,
        name: data.name || (data.bot && data.bot.workspace_name) || "Notion bot",
        type: data.type,
        workspaceName: data.bot && data.bot.workspace_name
    }
];
