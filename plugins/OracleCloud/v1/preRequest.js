// OCI authenticates every API call with its own HTTP Signature scheme
// (draft-cavage-http-signatures, rsa-sha256), which no standard authMode
// covers, so this script signs each request with the user's API key.
// https://docs.oracle.com/en-us/iaas/Content/API/Concepts/signingrequests.htm
//
// It also routes requests. OCI serves each service from its own regional
// host (telemetry.us-ashburn-1.oraclecloud.com, logging.eu-frankfurt-1.oci.
// oraclecloud.com, ...), but a plugin has one base URL. Data streams
// therefore use endpoint paths of the form
//
//     oci/<service>/<region>/<api version>/<resource path>
//
// and the script rewrites them to https://<service host for region>/<api
// version>/<resource path>. An empty or "home" region means the tenancy's
// home region. Paths without the "oci/" prefix go to the base URL (Identity
// in the home region) unchanged.
//
// Finally, it expands query macros that depend on the tile's timeframe,
// because only this script sees the request body together with it:
// Grafana-style time macros ($__timeFilter etc.) in SQL sent to the Database
// Tools Runtime executeSql action, and "[auto]" intervals in MQL queries.

const realmDomain = (secrets.realmDomain || "oraclecloud.com").trim();
const homeRegion = (secrets.homeRegion || "").trim();

// Host templates per service, from the OCI SDK endpoint definitions.
const SERVICE_HOSTS = {
    announcements: (r) => `announcements.${r}.${realmDomain}`,
    audit: (r) => `audit.${r}.${realmDomain}`,
    cloudguard: (r) => `cloudguard-cp-api.${r}.oci.${realmDomain}`,
    database: (r) => `database.${r}.${realmDomain}`,
    dbtools: (r) => `dbtools.${r}.oci.${realmDomain}`,
    iaas: (r) => `iaas.${r}.${realmDomain}`,
    identity: (r) => `identity.${r}.oci.${realmDomain}`,
    logging: (r) => `logging.${r}.oci.${realmDomain}`,
    query: (r) => `query.${r}.oci.${realmDomain}`,
    telemetry: (r) => `telemetry.${r}.${realmDomain}`,
    usageapi: (r) => `usageapi.${r}.oci.${realmDomain}`,
};

// --- routing ---------------------------------------------------------------------

const routed = url.pathname.match(/^\/+oci\/([a-z]+)\/([a-z0-9-]*)(\/.*)$/);
if (routed) {
    const [, service, regionSegment, rest] = routed;
    const hostFor = SERVICE_HOSTS[service];
    if (!hostFor) {
        api.report.error(`Unknown OCI service "${service}" in endpoint path.`);
    }
    const region = !regionSegment || regionSegment === "home" ? homeRegion : regionSegment;
    url.host = hostFor(region);
    url.pathname = rest;
}

// --- SQL time macros ------------------------------------------------------------

const isPost = String(method).toLowerCase() === "post";
let bodyText = "";
if (isPost) {
    bodyText = typeof body === "string" ? body : JSON.stringify(body ?? {});
    if (/\/actions\/executeSql$/.test(url.pathname) && bodyText.includes("$__")) {
        bodyText = expandSqlMacros(bodyText);
    }
    if (/\/metrics\/actions\/summarizeMetricsData$/.test(url.pathname) && bodyText.includes("[auto]")) {
        bodyText = expandAutoInterval(bodyText);
    }
    body = bodyText;
}

// "[auto]" in an MQL query picks the finest interval OCI allows for the
// tile's timeframe while keeping the number of datapoints reasonable.
function expandAutoInterval(text) {
    const payload = JSON.parse(text);
    const start = new Date(payload.startTime ?? context.timeframe?.start ?? Date.now() - 3600000);
    const end = new Date(payload.endTime ?? context.timeframe?.end ?? Date.now());
    const days = (end - start) / 86400000;
    const interval = days <= 1.05 ? "1m" : days <= 8 ? "5m" : days <= 32 ? "1h" : "1d";
    payload.query = String(payload.query).split("[auto]").join(`[${interval}]`);
    return JSON.stringify(payload);
}

function expandSqlMacros(text) {
    const payload = JSON.parse(text);
    const input = payload.input || {};
    if (typeof input.statementText !== "string") {
        return text;
    }
    const start = new Date(context.timeframe?.start ?? Date.now() - 3600000);
    const end = new Date(context.timeframe?.end ?? Date.now());
    // Oracle TIMESTAMP literals in UTC, comparable with DATE and TIMESTAMP columns.
    const literal = (d) => `TIMESTAMP '${d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "")}'`;
    const epochSeconds = (d) => Math.floor(d.getTime() / 1000);
    const intervalSeconds = (spec) => {
        const m = String(spec).trim().replace(/^'|'$/g, "").match(/^(\d+)\s*([smhd])$/);
        if (!m) {
            api.report.error(`Invalid $__timeGroup interval "${spec}". Use values such as '30s', '5m', '1h' or '1d'.`);
        }
        return Number(m[1]) * { s: 1, m: 60, h: 3600, d: 86400 }[m[2]];
    };

    input.statementText = input.statementText
        .replace(/\$__timeFilter\(\s*([^)]+?)\s*\)/g, (_, col) => `${col} BETWEEN ${literal(start)} AND ${literal(end)}`)
        .replace(/\$__timeGroup\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g, (_, col, spec) => {
            const n = intervalSeconds(spec);
            return `(TIMESTAMP '1970-01-01 00:00:00' + NUMTODSINTERVAL(FLOOR((CAST(${col} AS DATE) - DATE '1970-01-01') * 86400 / ${n}) * ${n}, 'SECOND'))`;
        })
        .replace(/\$__timeFrom\(\)|\$__timeFrom\b/g, literal(start))
        .replace(/\$__timeTo\(\)|\$__timeTo\b/g, literal(end))
        .replace(/\$__unixEpochFrom\(\)|\$__unixEpochFrom\b/g, String(epochSeconds(start)))
        .replace(/\$__unixEpochTo\(\)|\$__unixEpochTo\b/g, String(epochSeconds(end)));
    payload.input = input;
    return JSON.stringify(payload);
}

// --- signing ---------------------------------------------------------------------

function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function bytesToBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function derLength(length) {
    if (length < 0x80) {
        return [length];
    }
    const out = [];
    while (length > 0) {
        out.unshift(length & 0xff);
        length >>= 8;
    }
    return [0x80 | out.length, ...out];
}

function derWrap(tag, contentBytes) {
    return [tag, ...derLength(contentBytes.length), ...contentBytes];
}

// Web Crypto only imports PKCS#8, so wrap a PKCS#1 "RSA PRIVATE KEY" in a
// PrivateKeyInfo: SEQUENCE { INTEGER 0, AlgorithmIdentifier(rsaEncryption), OCTET STRING }.
function pkcs1ToPkcs8(pkcs1) {
    const version = [0x02, 0x01, 0x00];
    const rsaAlgorithm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
    const octetString = derWrap(0x04, Array.from(pkcs1));
    return new Uint8Array(derWrap(0x30, [...version, ...rsaAlgorithm, ...octetString]));
}

// Accepts the key as downloaded (including OCI's trailing "OCI_API_KEY" line),
// and keys pasted into a single-line field with newlines turned into spaces.
async function importPrivateKey(pem) {
    const text = String(pem || "");
    if (/ENCRYPTED PRIVATE KEY|Proc-Type:\s*4,ENCRYPTED/.test(text)) {
        api.report.error("The private key is passphrase protected. Use an unencrypted API key (as downloaded from the OCI Console).");
    }
    const block = text.match(/-----BEGIN (RSA )?PRIVATE KEY-----([\s\S]+?)-----END (RSA )?PRIVATE KEY-----/);
    if (!block) {
        api.report.error("The private key isn't a PEM key. Paste the whole .pem file, including the BEGIN and END lines.");
    }
    const der = base64ToBytes(block[2].replace(/[^A-Za-z0-9+/=]/g, ""));
    const pkcs8 = block[1] ? pkcs1ToPkcs8(der) : der;
    return crypto.subtle.importKey("pkcs8", pkcs8, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

const encoder = new TextEncoder();
const signedHeaders = { "x-date": new Date().toUTCString(), host: url.host };
const requestTarget = `${String(method).toLowerCase()} ${url.pathname}${url.search}`;
const headerOrder = ["x-date", "(request-target)", "host"];

if (isPost) {
    const bodyBytes = encoder.encode(bodyText);
    const digest = await crypto.subtle.digest("SHA-256", bodyBytes);
    signedHeaders["content-type"] = "application/json";
    signedHeaders["content-length"] = String(bodyBytes.length);
    signedHeaders["x-content-sha256"] = bytesToBase64(new Uint8Array(digest));
    headerOrder.push("content-length", "content-type", "x-content-sha256");
}

const signingString = headerOrder
    .map((name) => `${name}: ${name === "(request-target)" ? requestTarget : signedHeaders[name]}`)
    .join("\n");

const key = await importPrivateKey(secrets.privateKey);
const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(signingString));

const keyId = [secrets.tenancyOcid, secrets.userOcid, secrets.fingerprint].map((v) => String(v || "").trim()).join("/");

// Drop any differently-cased duplicates the platform set, so the values sent
// are exactly the values signed.
for (const name of Object.keys(headers)) {
    if (["x-date", "date", "host", "content-type", "content-length", "x-content-sha256", "authorization"].includes(name.toLowerCase())) {
        delete headers[name];
    }
}
Object.assign(headers, signedHeaders);
delete headers.host; // the HTTP client sets Host from the URL, which is the signed value
headers["authorization"] =
    `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",` +
    `headers="${headerOrder.join(" ")}",signature="${bytesToBase64(new Uint8Array(signature))}"`;
