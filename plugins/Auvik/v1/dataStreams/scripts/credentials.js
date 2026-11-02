// The verify endpoint returns 200 with an empty body when the credentials are valid.
result = [{ verified: response.status >= 200 && response.status < 300 }];
