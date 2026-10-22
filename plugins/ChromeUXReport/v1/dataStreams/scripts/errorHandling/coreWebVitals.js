// CrUX answers 404 when a page or origin has too little Chrome traffic to report
result = response.status === 404
    ? "No Chrome UX Report data for this page and device. CrUX only covers pages with enough real Chrome traffic."
    : data?.error?.message || "Request failed with HTTP " + response.status;
