// Environments without capacity licensing (such as developer and legacy environments) have no
// allocations resource and return 404
const apiMsg = data && data.error && data.error.message;

result = response.status === 404
    ? "This environment has no Copilot credit allocations."
    : apiMsg || "Request failed with HTTP " + response.status;
