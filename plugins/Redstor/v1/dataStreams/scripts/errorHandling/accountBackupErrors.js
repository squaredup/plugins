// The errors endpoint only recognises accounts that have a backup status record.
// Around a third of storage accounts have never run a backup and return a 422
// rather than an empty result, so explain that rather than surfacing the raw error.
result =
    response.status === 422
        ? "This account has no backup history in Redstor, so there are no error messages to report"
        : (data && (data.detail || data.title)) || "Request failed with HTTP " + response.status;
