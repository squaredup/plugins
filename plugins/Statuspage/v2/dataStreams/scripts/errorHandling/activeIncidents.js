result =
    response.status === 404
        ? "This status page doesn't publish unresolved incidents. Use the Incidents stream with the Active phase instead."
        : (data && (data.message || data.error)) || 'Request failed with HTTP ' + response.status;
