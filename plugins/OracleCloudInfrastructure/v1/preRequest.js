// Oracle Cloud Infrastructure signs every API request with the caller's RSA API key
// (an HTTP Signature, draft-cavage-http-signatures-08). No built-in authMode can do
// this, so the signature is computed here, per request.
// https://docs.oracle.com/en-us/iaas/Content/API/Concepts/signingrequests.htm
//
// OCI also serves each service from its own regional host (telemetry.<region>...,
// query.<region>..., usageapi.<region>...), while a data source has a single base
// URL. Every data stream therefore starts its endpoint path with
// "<service>/<region>/", e.g. "telemetry/uk-london-1/20180401/alarms/status".
// This script moves those two segments into the host name, then signs the final
// URL. "home" in the region position means the configured home region, which the
// Usage, Budgets and Identity calls use.

const SERVICE_DOMAINS = {
    identity: "oci.oraclecloud.com",
    query: "oci.oraclecloud.com",
    usageapi: "oci.oraclecloud.com",
    usage: "oci.oraclecloud.com",
    telemetry: "oraclecloud.com",
    iaas: "oraclecloud.com",
    database: "oraclecloud.com",
};

const REGION_PATTERN = /^[a-z]+-[a-z]+-\d+$/;

// --- helpers -----------------------------------------------------------------------

function bytesToBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function concatBytes(...parts) {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}

function derLength(length) {
    if (length < 0x80) {
        return Uint8Array.of(length);
    }
    const bytes = [];
    for (let n = length; n > 0; n = Math.floor(n / 256)) {
        bytes.unshift(n & 0xff);
    }
    return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

// WebCrypto only imports PKCS#8. Keys made with older OpenSSL versions are PKCS#1
// ("BEGIN RSA PRIVATE KEY"), so wrap those in the PKCS#8 envelope:
// SEQUENCE { INTEGER 0, AlgorithmIdentifier rsaEncryption, OCTET STRING <pkcs1> }
function pkcs1ToPkcs8(pkcs1) {
    const version = Uint8Array.of(0x02, 0x01, 0x00);
    const rsaAlgorithm = Uint8Array.of(
        0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00
    );
    const key = concatBytes(Uint8Array.of(0x04), derLength(pkcs1.length), pkcs1);
    const inner = concatBytes(version, rsaAlgorithm, key);
    return concatBytes(Uint8Array.of(0x30), derLength(inner.length), inner);
}

// Returns PKCS#8 DER bytes, or a string describing why the key can't be used.
// Password fields are single-line, so the PEM may arrive with its line breaks
// removed; only the BEGIN/END markers are relied on. Text outside the markers,
// such as the "OCI_API_KEY" line Oracle suggests appending, is ignored.
function readPrivateKey(raw) {
    const text = String(raw || "");
    if (/ENCRYPTED/.test(text)) {
        return (
            "The private key is protected by a passphrase, which is not supported. " +
            "Export an unencrypted copy with: openssl pkcs8 -topk8 -nocrypt -in key.pem -out key-unencrypted.pem"
        );
    }
    const match = text.match(
        /-----BEGIN (RSA )?PRIVATE KEY-----([\s\S]*?)-----END (?:RSA )?PRIVATE KEY-----/
    );
    if (!match) {
        return (
            "The private key is not a PEM private key. Paste the whole file, including the " +
            "-----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY----- lines."
        );
    }
    let der;
    try {
        der = base64ToBytes(match[2].replace(/[^A-Za-z0-9+/=]/g, ""));
    } catch {
        return "The private key could not be decoded. Paste the PEM file contents exactly as downloaded.";
    }
    return match[1] ? pkcs1ToPkcs8(der) : der;
}

// --- route -------------------------------------------------------------------------

const homeRegion = String(secrets.homeRegion || "").trim().toLowerCase();
const segments = url.pathname.replace(/\/{2,}/g, "/").split("/");
const [, service, regionSegment, ...rest] = segments;

if (!Object.prototype.hasOwnProperty.call(SERVICE_DOMAINS, service)) {
    api.report.error(`Unknown OCI service "${service}" in request path ${url.pathname}.`);
    return;
}

const region = regionSegment === "home" ? homeRegion : String(regionSegment || "").toLowerCase();
if (!REGION_PATTERN.test(region)) {
    api.report.error(
        regionSegment === "home"
            ? `The home region "${homeRegion}" is not a valid OCI region identifier, e.g. us-ashburn-1.`
            : `"${regionSegment}" is not a valid OCI region identifier.`
    );
    return;
}

url.hostname = `${service}.${region}.${SERVICE_DOMAINS[service]}`;
url.pathname = `/${rest.join("/")}`;

// --- sign --------------------------------------------------------------------------

const pkcs8 = readPrivateKey(secrets.privateKey);
if (typeof pkcs8 === "string") {
    api.report.error(pkcs8);
    return;
}

let signingKey;
try {
    signingKey = await crypto.subtle.importKey(
        "pkcs8",
        pkcs8,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );
} catch (e) {
    api.report.error(`The private key could not be loaded. Check it is an RSA API signing key. ${e}`);
    return;
}

// Headers this script owns are cleared case-insensitively first, so a stale or
// differently-cased copy can't be sent alongside the signed value.
const OWNED_HEADERS = [
    "authorization",
    "date",
    "x-date",
    "host",
    "content-type",
    "content-length",
    "x-content-sha256",
];
for (const name of Object.keys(headers)) {
    if (OWNED_HEADERS.includes(name.toLowerCase())) {
        delete headers[name];
    }
}

const isPost = String(method).toLowerCase() === "post";
const signed = [
    ["x-date", new Date().toUTCString()],
    ["(request-target)", `${String(method).toLowerCase()} ${url.pathname}${url.search}`],
    ["host", url.host],
];

if (isPost) {
    // The platform sends a JSON postBody as compact JSON.stringify output, so hash
    // exactly that. Leave `body` itself untouched: reassigning it to a string makes
    // the platform encode it a second time, and the signature no longer matches.
    const bodyText = body == null ? "" : typeof body === "string" ? body : JSON.stringify(body);
    const bodyBytes = new TextEncoder().encode(bodyText);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bodyBytes));
    signed.push(
        ["content-length", String(bodyBytes.length)],
        ["content-type", "application/json"],
        ["x-content-sha256", bytesToBase64(digest)]
    );
}

const signingString = signed.map(([name, value]) => `${name}: ${value}`).join("\n");
const signature = new Uint8Array(
    await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        signingKey,
        new TextEncoder().encode(signingString)
    )
);

for (const [name, value] of signed) {
    if (name !== "(request-target)" && name !== "host") {
        headers[name] = value;
    }
}

const keyId = [secrets.tenancyOcid, secrets.userOcid, secrets.fingerprint]
    .map((part) => String(part || "").trim())
    .join("/");

headers["authorization"] =
    `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",` +
    `headers="${signed.map(([name]) => name).join(" ")}",` +
    `signature="${bytesToBase64(signature)}"`;
