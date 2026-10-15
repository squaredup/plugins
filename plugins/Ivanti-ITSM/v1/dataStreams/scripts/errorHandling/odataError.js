// Ivanti reports failures in several shapes depending on where the request is
// rejected: OData surfaces { error: { message } } (message is sometimes an
// object with a `value`), while the API gateway returns a bare { Message }.
const error = (data && data.error) || {};
const message = error.message && error.message.value ? error.message.value : error.message;
const apiMessage = message || (data && (data.Message || data.message));

let hint = "";
if (response.status === 401 || response.status === 403) {
    // An ISM REST API key is bound to the tenant and IP it was created for, and
    // inherits the role of its "On Behalf Of" account - so a key that works
    // elsewhere can still be rejected here.
    hint =
        " Check the REST API key belongs to this tenant, is activated, and that its role can read this business object.";
} else if (response.status === 404) {
    hint =
        " Check the tenant URL, and that the business object name is spelled as the API expects it (the object name with an 's' on the end).";
}

result = (apiMessage || "Ivanti returned HTTP " + response.status) + hint;
