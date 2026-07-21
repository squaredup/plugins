// list of nutrition-log dataPoints. Each: { nutritionLog: {
//   interval:{startTime}, foodDisplayName, mealType, energy:{kcal},
//   totalCarbohydrate:{grams}, totalFat:{grams}, nutrients:[{nutrient, quantity:{grams}}] } }
const pts = data?.dataPoints || [];

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const r1 = (v) => (v === undefined ? undefined : Math.round(v * 10) / 10);
const grams = (q) => (q ? N(q.grams) : undefined);
const titleCase = (t) =>
    typeof t === "string" && t !== "MEAL_TYPE_UNSPECIFIED"
        ? t.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : undefined;

result = pts
    .map((pt) => {
        const n = pt.nutritionLog;
        if (!n) return null;
        const iv = n.interval || {};
        const byNutrient = {};
        for (const item of n.nutrients || []) {
            if (item && item.nutrient) byNutrient[item.nutrient] = grams(item.quantity);
        }
        return {
            time: iv.startTime ? new Date(iv.startTime) : undefined,
            food: n.foodDisplayName || "Food",
            meal: titleCase(n.mealType),
            calories: n.energy ? r1(N(n.energy.kcal)) : undefined,
            carbsG: r1(grams(n.totalCarbohydrate) ?? byNutrient.CARBOHYDRATES),
            fatG: r1(grams(n.totalFat)),
            proteinG: r1(byNutrient.PROTEIN),
            sugarG: r1(byNutrient.SUGAR),
            fibreG: r1(byNutrient.DIETARY_FIBER),
        };
    })
    .filter((r) => r && r.time);
