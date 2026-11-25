// Certificate health is spread across two levels of nested objects
// (certificate_management_status.provisioning_job), so derive it here.
const statusOf = (d) => {
    const status = d.certificate_management_status || {};
    const job = status.provisioning_job;
    if (job && job.error_code === 'DNS_ERROR') return 'DNS error';
    if (job && job.error_code) return 'Provisioning error';
    if (job) return 'Provisioning';
    if (status.renews_at && new Date(status.renews_at).getTime() < Date.now()) return 'Renewal overdue';
    // A custom (CNAME) domain with neither automatic nor uploaded certificate cannot serve TLS.
    if (d.cname_target && !d.certificate_management_policy && !d.certificate) return 'No certificate';
    return 'OK';
};

const sourceOf = (d) => {
    if (d.certificate_management_policy) return `Automatic (${d.certificate_management_policy.authority || 'letsencrypt'})`;
    if (d.certificate) return 'Uploaded';
    return d.cname_target ? 'None' : 'ngrok';
};

result = (data?.reserved_domains || []).map((d) => {
    const job = d.certificate_management_status?.provisioning_job;
    return {
        id: d.id,
        domain: d.domain,
        description: d.description || null,
        isDev: !!d.is_dev,
        cnameTarget: d.cname_target || null,
        certificateSource: sourceOf(d),
        certificateId: d.certificate?.id || null,
        renewsAt: d.certificate_management_status?.renews_at || null,
        certificateStatus: statusOf(d),
        provisioningError: job?.msg || job?.error_code || null,
        provisioningRetriesAt: job?.retries_at || null,
        created_at: d.created_at,
    };
});
