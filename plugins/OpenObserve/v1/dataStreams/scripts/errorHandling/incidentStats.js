result =
    response.status === 403
        ? "Incident statistics are not available on this instance — this endpoint may require a different OpenObserve edition or license."
        : (data && (data.message || data.error)) ||
          "Request failed with HTTP " + response.status;
