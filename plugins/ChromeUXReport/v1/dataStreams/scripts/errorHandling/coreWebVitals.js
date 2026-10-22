// CrUX answers 400 when the object name isn't a web address (for example another plugin's object)
// and 404 when a page or website has too little Chrome traffic to report
result = response.status === 400
    ? "This object isn't a web page address, so the Chrome UX Report can't look it up."
    : response.status === 404
    ? "No Chrome UX Report data for this page or website on this device. CrUX only covers pages and websites with enough real Chrome traffic."
    : data?.error?.message || "Request failed with HTTP " + response.status;
