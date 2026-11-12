// Bot protection usually answers 403 with an HTML page, so name the likely cause
result = response.status === 403
    ? "The website refused the request (HTTP 403). Its bot protection may block cloud servers; try adding the data source via a relay agent."
    : "Could not read the sitemap (HTTP " + response.status + "). Check the Sitemap URL opens in a browser.";
