// Flattens each certificate pack's nested certificates[] array into one row
// per certificate, since the expiry date lives on the inner certificate, not
// the pack.
result = ((data && data.result) || []).flatMap((pack) =>
    (pack.certificates || []).map((cert) => ({
        id: cert.id,
        hosts: (cert.hosts || pack.hosts || []).join(", "),
        status: cert.status,
        certificateAuthority: pack.certificate_authority,
        type: pack.type,
        validationMethod: pack.validation_method,
        expiresOn: cert.expires_on,
        issuer: cert.issuer,
    })),
);
