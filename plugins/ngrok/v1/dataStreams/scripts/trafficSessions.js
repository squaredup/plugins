// Browser details are nested two levels deep (browser_session.user_agent / .location).
result = (data?.application_sessions || []).map((s) => {
    const browser = s.browser_session || {};
    const ua = browser.user_agent || {};
    return {
        id: s.id,
        publicUrl: s.public_url || null,
        userId: s.application_user?.id || null,
        ipAddress: browser.ip_address || null,
        countryCode: browser.location?.country_code || null,
        browser: [ua.browser_name, ua.browser_version].filter(Boolean).join(' ') || null,
        os: [ua.os_name, ua.os_version].filter(Boolean).join(' ') || null,
        deviceType: ua.device_type || null,
        created_at: s.created_at,
        last_active: s.last_active || null,
        expires_at: s.expires_at || null,
    };
});
