const apiMsg = data && (data.message || (data.error && (data.error.message || data.error)));

if (response.status === 403) {
    result = 'AI Deep Scan findings need an API key with the security read permission' + (apiMsg ? ' (' + apiMsg + ')' : '');
} else {
    result = apiMsg || ('Request failed with HTTP ' + response.status);
}
