// The docs show the product field both as a string (budget_product_sku) and an array (budget_product_skus)
const skusOf = (b) => [].concat(b.budget_product_skus || b.budget_product_sku || []).filter(Boolean);

// Budgets cover every metered product (Actions, Packages, ...); keep only those that cap Copilot spend
const isCopilot = (skus) => skus.some((s) => /copilot|ai_credit|premium_request/i.test(s));

result = (data?.budgets || [])
    .map((b) => ({ ...b, skus: skusOf(b) }))
    .filter((b) => isCopilot(b.skus))
    .map((b) => {
        const entity = b.budget_entity_name || b.user || '';

        return {
            budgetId: String(b.id),
            budgetName: [entity || b.budget_scope, b.skus.join(', ')].filter(Boolean).join(' – ') || String(b.id),
            budgetScope: b.budget_scope || null,
            budgetEntity: entity || null,
            budgetType: b.budget_type || null,
            skus: b.skus,
            budgetAmount: typeof b.budget_amount === 'number' ? b.budget_amount : null,
            preventFurtherUsage: typeof b.prevent_further_usage === 'boolean' ? b.prevent_further_usage : null,
            willAlert: typeof b.budget_alerting?.will_alert === 'boolean' ? b.budget_alerting.will_alert : null,
            alertRecipients: b.budget_alerting?.alert_recipients || [],
            expiresAt: b.expires_at || null
        };
    });
