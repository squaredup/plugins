// CrUX answers 404 when a page or origin has too little Chrome traffic to report
result = response.status === 404
    ? "No Chrome UX Report data for this page or website on this device. CrUX only covers pages and websites with enough real Chrome traffic."
    : data?.error?.message || "Request failed with HTTP " + response.status;
