// Certificates expiring in fewer days than this are flagged as a warning.
const EXPIRING_SOON_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// An empty scope list means the certificate is available to every environment or tenant.
const inScope = (ids, scopedId) => !Array.isArray(ids) || ids.length === 0 || ids.includes(scopedId);

const scoped = context.objects[0].rawId;
const now = Date.now();

result = (data.Items || [])
    .filter((c) => !c.Archived)
    .filter((c) => (scoped.startsWith('Environments-') ? inScope(c.EnvironmentIds, scoped) : true))
    .filter((c) => (scoped.startsWith('Tenants-') ? inScope(c.TenantIds, scoped) : true))
    .map((c) => {
        const expiry = c.NotAfter ? new Date(c.NotAfter).getTime() : NaN;
        const daysUntilExpiry = Number.isNaN(expiry) ? null : Math.trunc((expiry - now) / MS_PER_DAY);
        const expired = c.IsExpired === true || (daysUntilExpiry !== null && daysUntilExpiry < 0);
        return {
            Id: c.Id,
            Name: c.Name,
            SubjectCommonName: c.SubjectCommonName || null,
            IssuerCommonName: c.IssuerCommonName || null,
            NotAfter: c.NotAfter || null,
            NotBefore: c.NotBefore || null,
            DaysUntilExpiry: daysUntilExpiry,
            ExpiryStatus: expired ? 'Expired' : daysUntilExpiry !== null && daysUntilExpiry < EXPIRING_SOON_DAYS ? 'Expiring soon' : 'Valid',
            EnvironmentIds: c.EnvironmentIds || [],
            SelfSigned: c.SelfSigned,
            HasPrivateKey: c.HasPrivateKey,
            Thumbprint: c.Thumbprint || null,
            SubjectAlternativeNames: c.SubjectAlternativeNames || []
        };
    });
