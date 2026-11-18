const e = data && data.errors && data.errors[0];

result = (e && e.message) || (data && data.message) || ('Request failed with HTTP ' + response.status);
