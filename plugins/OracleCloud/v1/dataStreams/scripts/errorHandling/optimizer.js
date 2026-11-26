// Cloud Advisor must be enabled for the tenancy before its API answers.
const message = data && data.message;
if (response.status === 404 || response.status === 401 || /not.*(enabled|opted)/i.test(message || "")) {
    result = `Cloud Advisor isn't available (HTTP ${response.status}). Enable it under Observability & Management → Cloud Advisor, and allow the user to read optimizer-api-family.`;
} else {
    result = `Cloud Advisor request failed with HTTP ${response.status}${message ? `: ${message}` : ""}`;
}
