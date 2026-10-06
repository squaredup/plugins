// Builds the NetBox Authorization header from the token fields.
// This lives in a pre-request script, not a base header expression, because newer platform builds
// no longer evaluate JavaScript over secret fields in base headers (the header arrives empty).
const clean = (value) => (typeof value === 'string' && value !== 'undefined' ? value.trim() : '');

// The header is only set when the selected token field has a value, so a key on its own never
// produces a malformed "Bearer nbt_<key>." header.
if (clean(secrets.tokenVersion) === 'v1') {
    const token = clean(secrets.v1Token).replace(/^token(\s+|$)/i, '');
    if (token) {
        headers['Authorization'] = 'Token ' + token;
    }
} else {
    // NetBox displays v2 tokens as "Bearer nbt_<key>.<secret>"; accept that, the bare "nbt_..." form,
    // or just the secret with the key entered separately.
    let token = clean(secrets.v2Token).replace(/^bearer(\s+|$)/i, '');
    const key = clean(secrets.v2Key).replace(/^nbt_/i, '');
    if (token && !token.startsWith('nbt_') && !key) {
        // A bare secret can't authenticate without its key; don't send a malformed "nbt_.<secret>" header.
        if (typeof api !== 'undefined' && api.report) {
            api.report.error('The v2 token has no key. Paste the full "Bearer nbt_<key>.<secret>" token, or enter the Key field.');
        }
    } else if (token) {
        if (!token.startsWith('nbt_')) {
            token = 'nbt_' + key + '.' + token;
        }
        headers['Authorization'] = 'Bearer ' + token;
    }
}
