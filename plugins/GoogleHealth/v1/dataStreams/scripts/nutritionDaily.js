// dailyRollUp of nutrition-log. NutritionLogRollupValue:
//   { energy:{kcalSum}, totalFat:{gramsSum}, totalCarbohydrate:{gramsSum},
//     nutrients:[{ nutrient:"PROTEIN"|"SUGAR"|"SODIUM"|..., quantity:{gramsSum} }] }
const points = data?.rollupDataPoints || [];

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const round = (v) => (v === undefined ? undefined : Math.round(v));

const civilToDate = (c) =>
    c && c.date && c.date.year
        ? new Date(Date.UTC(c.date.year, (c.date.month || 1) - 1, c.date.day || 1))
        : undefined;

const grams = (q) => (q ? N(q.gramsSum) : undefined);

// Goals from plugin config (settings screen), with defaults.
const cfg = (context && context.dataSources && context.dataSources[0]) || {};
const goalNum = (k, d) => {
    const n = Number(cfg[k]);
    return Number.isFinite(n) && n > 0 ? n : d;
};
const calorieGoal = goalNum("calorieBudget", 2500);
const proteinGoal = goalNum("proteinGoal", 130);
const carbGoal = goalNum("carbBudget", 250);
const fatGoal = goalNum("fatBudget", 70);
const pct = (v, g) => (g && v !== undefined ? Math.round((v / g) * 100) : undefined);

result = points
    .map((pt) => {
        const n = pt.nutritionLog;
        if (!n) return null;
        const byNutrient = {};
        for (const item of n.nutrients || []) {
            if (item && item.nutrient) byNutrient[item.nutrient] = grams(item.quantity);
        }
        const sodiumG = byNutrient.SODIUM;
        const calories = round(n.energy ? N(n.energy.kcalSum) : undefined);
        const carbsG = round(grams(n.totalCarbohydrate) ?? byNutrient.CARBOHYDRATES);
        const fatG = round(grams(n.totalFat));
        const proteinG = round(byNutrient.PROTEIN);
        return {
            date: civilToDate(pt.civilStartTime),
            calories,
            carbsG,
            fatG,
            proteinG,
            sugarG: round(byNutrient.SUGAR),
            fibreG: round(byNutrient.DIETARY_FIBER),
            sodiumMg: sodiumG === undefined ? undefined : round(sodiumG * 1000),
            calorieGoalCol: calorieGoal,
            proteinGoalCol: proteinGoal,
            carbGoalCol: carbGoal,
            fatGoalCol: fatGoal,
            caloriesPct: pct(calories, calorieGoal),
            proteinPct: pct(proteinG, proteinGoal),
            carbsPct: pct(carbsG, carbGoal),
            fatPct: pct(fatG, fatGoal),
        };
    })
    .filter((r) => r && r.date);
