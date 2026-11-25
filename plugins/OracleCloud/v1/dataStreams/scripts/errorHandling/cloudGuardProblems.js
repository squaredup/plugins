// Cloud Guard answers 404 when it isn't enabled for the tenancy, when the
// region isn't its reporting region, or when policies don't allow reading it.
if (response.status === 404) {
    result = "Cloud Guard returned no access (404). Check Cloud Guard is enabled for the tenancy, that Region is set to its reporting region, and that the user can read cloud-guard-family.";
} else {
    const message = data && data.message;
    result = `Cloud Guard request failed with HTTP ${response.status}${message ? `: ${message}` : ""}`;
}
