result = data.map((member) => {
    return {
        avatar_url: member.avatar_url,
        html_url: member.html_url,
        id: member.id,
        login: member.login,
        site_admin: member.site_admin,
        type: member.type,
    };
});
