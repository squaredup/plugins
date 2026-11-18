const apiMsg = data && (data.message || (data.error && data.error.message) || data.error);

if (response.status === 403) {
    result = "MCP usage metrics are not enabled for this CodeRabbit organization";
} else {
    result = apiMsg || "Request failed with HTTP " + response.status;
}
