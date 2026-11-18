// Autocomplete values arrive as { value } objects in the tile editor, plain strings from the CLI.
const unwrap = (v) => (v && typeof v === 'object' ? v.value : v);
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const cloud = String(unwrap(asList(context.config.cloud)[0]) || '').split('|')[0];

const clouds = data && data.data && Array.isArray(data.data.clouds) ? data.data.clouds : [];
const match = clouds.find((c) => c.machine_name === cloud);
const flags = (match && match.cloud_status) || {};

// The portal's own flags for which Cloud Status tabs a cloud has. They mix "1"/"0" strings with
// 1/0 numbers, and "0" is truthy, so compare as strings. The flag name for premium data centers is
// singular, but the API's requestType is plural.
const TYPES = [
    { flag: 'datacenter', value: 'datacenter', label: 'Data centers' },
    { flag: 'core_cloud_services', value: 'core_cloud_services', label: 'Core cloud services' },
    { flag: 'premium_datacenter', value: 'premium_datacenters', label: 'Premium data centers' },
    {
        flag: 'business_continuity_datacenters',
        value: 'business_continuity_datacenters',
        label: 'Business continuity data centers'
    }
];

result = TYPES.filter((t) => String(flags[t.flag]) === '1').map(({ value, label }) => ({ label, value }));
