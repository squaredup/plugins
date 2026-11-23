// TeamCity returns the next page as `nextHref`, a path relative to the server root. Resolve it
// against this request's URL so `nextUrl` paging can follow it; no `nextHref` ends paging.
pagingContext = data && data.nextHref ? new URL(data.nextHref, response.url).href : undefined;

// Flatten each configuration's latest finished build (if it has one) into the row.
result = ((data && data.buildType) || []).map(bt => {
    const build = (bt.builds && bt.builds.build && bt.builds.build[0]) || {};
    return {
        id: bt.id,
        name: bt.name,
        projectName: bt.projectName,
        paused: bt.paused === true,
        webUrl: bt.webUrl,
        status: build.status || 'NONE',
        statusText: build.statusText,
        lastBuildNumber: build.number,
        lastBuildBranch: build.branchName,
        lastBuildFinished: build.finishDate,
        lastBuildUrl: build.webUrl
    };
});
