// Copilot usage metrics reports are served as signed download links on a separate storage host. The
// signature in the link is the credential, and a second one (the GitHub token) makes storage hosts reject
// the request, so the token is only sent to the GitHub API host itself.
let apiHost;
try {
    apiHost = new URL(context.dataSources[0].baseUrl).host;
} catch {
    apiHost = undefined;
}

// Only GitHub API hosts ever get the token, so an edited API URL can't send it anywhere else
const isGitHubApiHost = /^api([.][a-z0-9-]+[.]ghe[.]com|[.]github[.]com)$/i.test(url.host);
const isApiHost = isGitHubApiHost && (!apiHost || url.host === apiHost);

if (isApiHost) {
    headers['Authorization'] = `Bearer ${secrets.accessToken}`;
} else {
    delete headers['Authorization'];
    delete headers['X-GitHub-Api-Version'];
}

// Report streams queue the remaining download links in the URL fragment (see the report scripts); it is
// bookkeeping for the next page only and is never part of the request.
url.hash = '';
