// Shared by the Cloud Component Status and Cloud Component History streams, which call the same
// Cloud Status API. The portal's own messages are terse, so the two a user can cause are reworded.
const apiMsg = data && data.message;

if (apiMsg === 'Bad Request type!') {
    result =
        'The selected cloud does not publish this component type on the Trust portal. Pick one from the Component type list, which shows only the types this cloud publishes.';
} else if (apiMsg === 'Cloud bad request!') {
    result = 'The Trust portal does not recognize the selected cloud. Pick the cloud again from the Cloud list.';
} else {
    result = apiMsg || 'The Trust portal returned HTTP ' + response.status + '.';
}
