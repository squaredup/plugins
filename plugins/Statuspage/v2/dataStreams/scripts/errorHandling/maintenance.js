const apiMsg = data && (data.message || data.error);

result =
    response.status === 404
        ? "This status page doesn't publish scheduled maintenance, so it may not run on Atlassian Statuspage. Component status and incidents still work."
        : apiMsg || 'Request failed with HTTP ' + response.status;
