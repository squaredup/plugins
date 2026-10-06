// Builds the NetBox Authorization header from the token fields.
// This lives in a pre-request script, not a base header expression, because newer platform builds
// no longer evaluate JavaScript over secret fields in base headers (the header arrives empty).
const clean = (value) => (typeof value === 'string' && value !== 'undefined' ? value.trim() : '');

if (clean(secrets.tokenVersion) === 'v1') {
    headers['Authorization'] = 'Token ' + clean(secrets.v1Token).replace(/^token +/i, '');
} else {
    // NetBox displays v2 tokens as "Bearer nbt_<key>.<secret>"; accept that, the bare "nbt_..." form,
    // or just the secret with the key entered separately.
    let token = clean(secrets.v2Token).replace(/^bearer +/i, '');
    if (!token.startsWith('nbt_')) {
        token = 'nbt_' + clean(secrets.v2Key).replace(/^nbt_/i, '') + '.' + token;
    }
    headers['Authorization'] = 'Bearer ' + token;
}
