// Shared by every stream. Checkmk answers API errors with an RFC 7807 problem body
// ({ title, status, detail, fields }); anything else (an HTML page, a proxy error) means the
// request never reached the REST API, which is almost always a wrong Site URL.
// A connection that fails outright (DNS, TLS, refused) has no response at all, so nothing here
// may assume `response` or `data` exists, or this script's own error hides the real one.
const status = response && response.status;
const problem = data && typeof data === 'object' && (data.title || data.detail) ? data : null;
const fields = problem && problem.fields ? ` ${JSON.stringify(problem.fields)}` : '';
const detail = problem ? [problem.title, problem.detail].filter(Boolean).join(': ') + fields : '';
const raw = data && typeof data === 'object' ? data.message || data.error || '' : typeof data === 'string' ? data.slice(0, 300) : '';

if (!status) {
    result =
        'Could not reach Checkmk (no HTTP response). Check the Site URL resolves and is reachable from the relay agent machine. ' +
        "If the server's certificate is issued by an internal certificate authority, turn on Ignore certificate errors." +
        (raw ? ` ${raw}` : '');
} else if (status === 401) {
    result = `Checkmk rejected the automation user or secret (HTTP 401). ${detail}`.trim();
} else if (status === 403) {
    result = `The Checkmk automation user doesn't have permission for this request (HTTP 403). ${detail}`.trim();
} else if (status === 414) {
    // The host filter travels in the URL (Checkmk's collections are GET only), so a selection the
    // picker's limit didn't stop, such as a dashboard variable, can still overflow the web server's cap.
    // Very long host names can also exceed it below the picker's limit, so the message names no number.
    result = 'The host selection is too long for one request (HTTP 414). Select fewer hosts, or leave Host(s) empty to include every host.';
} else if (detail.indexOf('No matching entries found') >= 0) {
    // Metric History: Checkmk reports a missing service as a raw livestatus query dump
    result = 'The host has no service with that name. Enter the service name exactly as Checkmk shows it.';
} else if (detail.indexOf('requested graph does not exist') >= 0) {
    result = "The service has no metric with that ID. Check the metric ID in the Service Metrics entry on the service's details page in Checkmk.";
} else if (status === 404 && !problem) {
    result =
        'Not found (HTTP 404). Check the Site URL ends with the Checkmk site name, for example https://checkmk.example.com/mysite.';
} else {
    result = detail || raw || `Checkmk request failed with HTTP ${status}.`;
}
