result =
    response.status === 404
        ? "Cluster info is not available on this instance — this endpoint requires a clustered OpenObserve deployment."
        : (data && (data.message || data.error)) ||
          "Request failed with HTTP " + response.status;
