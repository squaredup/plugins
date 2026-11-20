const expiresAt = response.headers['github-authentication-token-expiration'];

if (expiresAt) {
    const daysToExpiry = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    if (daysToExpiry < 7) {
        api.report.error(
            'The personal access token expires within 7 days. Check its expiration date in GitHub token settings.'
        );
    }
}

result = [{ expiresAt: expiresAt || null }];
