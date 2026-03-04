result = data.map((release) => ({
    author: release.author?.login ?? null,
    body: (release.body ?? '').replace(/<!--.*?-->\n*/s, '').replace(/\*\*Full Changelog\*\*: .*/, ''),
    created_at: release.created_at,
    draft: release.draft,
    html_url: release.html_url,
    name: release.name,
    prerelease: release.prerelease,
    published_at: release.published_at,
    tag_name: release.tag_name,
}));
