// A wrong URL can still answer 200: PRTG Hosted sends any path it does not
// recognise through a redirect to its sign-in page, and many web servers return
// an HTML page for every path. Only a real PRTG status response carries
// `Version`, so treat anything else as a failure. Without this, the setup check
// passes for a URL that is not PRTG at all.
if (!data || typeof data !== 'object' || !data.Version) {
    throw new Error('The URL did not return a PRTG API response. Check it is the address of your PRTG web interface.');
}
result = [data];
