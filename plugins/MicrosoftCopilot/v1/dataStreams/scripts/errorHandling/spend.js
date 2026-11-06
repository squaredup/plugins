const scope = "{{dataSource.costScope}}";
const apiMsg = data && data.error && data.error.message;

result = !scope || scope.trim() === ""
    ? "Set a Cost Management scope in the data source configuration to use this data stream."
    : apiMsg || "Request failed with HTTP " + response.status;
