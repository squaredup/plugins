result = data.map((team) => {
    return {
        description: team.description,
        html_url: team.html_url,
        id: team.id,
        name: team.name,
        notification_setting: team.notification_setting,
        permission: team.permission,
        privacy: team.privacy,
        slug: team.slug,
    };
});
