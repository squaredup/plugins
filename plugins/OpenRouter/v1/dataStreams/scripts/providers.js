// Expands ISO country codes to names (US -> United States) and flattens the
// datacenters array into a comma-separated string, so both read well in tiles
// and can be indexed as Provider properties.
const countries = new Intl.DisplayNames(['en'], { type: 'region' });

// Falls back to the raw code if it isn't a valid region code
const country = (code) => {
    try {
        return code ? countries.of(code) : code;
    } catch {
        return code;
    }
};

result = (data?.data ?? []).map((p) => ({
    ...p,
    headquarters: country(p.headquarters),
    datacenters: (p.datacenters ?? []).map(country).join(', '),
}));
