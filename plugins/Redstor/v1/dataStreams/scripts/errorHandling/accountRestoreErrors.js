// The errors endpoint only recognises accounts that have a restore status record,
// and returns a 422 for any other account rather than an empty result.
result =
    response.status === 422
        ? "This account has no restore history in Redstor, so there are no error messages to report"
        : (data && (data.detail || data.title)) || "Request failed with HTTP " + response.status;
