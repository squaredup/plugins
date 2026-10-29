const apiMsg = data && ((data.error && data.error.message) || data.message);

if (response.status === 404) {
    result = "No spend limit is set for this project";
} else if (response.status === 400 && /paid plan/i.test(apiMsg || "")) {
    result = "Spend limits need a paid OpenAI API plan";
} else {
    result = apiMsg || "Request failed with HTTP " + response.status;
}
