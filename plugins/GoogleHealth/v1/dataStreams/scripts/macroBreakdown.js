// dailyRollUp of nutrition-log, summed across the period into one row per macro.
// NutritionLogRollupValue: { energy:{kcalSum}, totalFat:{gramsSum}, totalCarbohydrate:{gramsSum},
//   nutrients:[{ nutrient:"PROTEIN"|..., quantity:{gramsSum} }] }
const points = data?.rollupDataPoints || [];

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const grams = (q) => (q ? N(q.gramsSum) : 0);

let carbs = 0;
let fat = 0;
let protein = 0;
let any = false;

for (const pt of points) {
    const n = pt.nutritionLog;
    if (!n) continue;
    any = true;
    carbs += grams(n.totalCarbohydrate);
    fat += grams(n.totalFat);
    for (const item of n.nutrients || []) {
        if (item && item.nutrient === "PROTEIN") protein += grams(item.quantity);
        if (item && item.nutrient === "CARBOHYDRATES" && !n.totalCarbohydrate) carbs += grams(item.quantity);
    }
}

if (!any) {
    result = [];
} else {
    // Atwater factors: carbs & protein 4 kcal/g, fat 9 kcal/g.
    const rows = [
        { macro: "Carbohydrate", grams: carbs, calories: carbs * 4 },
        { macro: "Fat", grams: fat, calories: fat * 9 },
        { macro: "Protein", grams: protein, calories: protein * 4 },
    ];
    const totalCal = rows.reduce((a, r) => a + r.calories, 0) || 1;
    result = rows.map((r) => ({
        macro: r.macro,
        grams: Math.round(r.grams),
        calories: Math.round(r.calories),
        percent: Math.round((r.calories / totalCal) * 100),
    }));
}
