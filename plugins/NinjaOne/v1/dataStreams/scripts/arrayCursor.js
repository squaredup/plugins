/**
 * Generic script to handle pagination for NinjaOne array-based endpoints.
 * 
 * It takes the flat response array AND converts it into a "results" array
 * alongside a "next_page_token" which is the ID of the last element.
 */
const items = Array.isArray(data) ? data : [];
result = {
    results: items,
    next_page_token: items.length > 0 ? items[items.length - 1].id : null
};
