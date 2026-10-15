// GraphQL reports errors as HTTP 200 with an `errors` array, so errorHandling never fires; throw to surface the message.
if (data && data.errors && data.errors.length) {
    throw new Error(data.errors.map((e) => e.message).join("; "));
}

result = (data && data.data && data.data.power_feed_list) || [];
