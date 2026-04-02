const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;

const FILTER_PARAMS = {
  "All":               { tags: "healthy", minCalories: 100 },
  "Quick & Easy":      { tags: "healthy", maxReadyTime: 30 },
  "High Protein":      { tags: "healthy", minProtein: 25 },
  "Low Carb":          { tags: "healthy", maxCarbs: 20 },
  "Meal Prep":         { tags: "healthy" },
  "Anti-Inflammatory": { tags: "healthy", minFiber: 3 },
};

const ALLOWED_SOURCES = [
  "cooking.nytimes.com",
  "minimalistbaker.com",
  "skinnytaste.com",
  "cookieandkate.com",
  "seriouseats.com",
  "eatingwell.com",
  "bonappetit.com",
  "bbcgoodfood.com",
  "budgetbytes.com",
  "theproteinchef.co",
];

export default async function handler(req, res) {
  // CORS headers so the artifact iframe can call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const filter = req.query.filter || "All";
  const params = FILTER_PARAMS[filter] || FILTER_PARAMS["All"];

  try {
    const qs = new URLSearchParams({
      apiKey: SPOONACULAR_KEY,
      number: 20, // fetch more so we can filter down to allowed sources
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
      instructionsRequired: true,
      sort: "random",
      ...params,
    });

    const spoonResp = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?${qs}`
    );
    if (!spoonResp.ok) {
      const err = await spoonResp.text();
      return res.status(502).json({ error: `Spoonacular error: ${err.slice(0, 200)}` });
    }

    const data = await spoonResp.json();
    if (!data.results?.length) {
      return res.status(404).json({ error: "No recipes returned" });
    }

    // Prefer recipes from our allowed sources, fall back to all results
    const preferred = data.results.filter(r =>
      ALLOWED_SOURCES.some(s => r.sourceUrl?.includes(s))
    );
    const pool = preferred.length >= 5 ? preferred : data.results;
    const selected = pool.slice(0, 5);

    const recipes = selected.map((r, i) => {
      const nutrients = r.nutrition?.nutrients || [];
      const get = name => Math.round(nutrients.find(n => n.name === name)?.amount || 0);

      const tags = [];
      if ((r.readyInMinutes || 99) <= 30) tags.push("Quick & Easy");
      if (get("Protein") >= 20) tags.push("High Protein");
      if (get("Carbohydrates") <= 25) tags.push("Low Carb");
      if (get("Fiber") >= 4 || r.title?.toLowerCase().match(/turmeric|ginger|salmon|kale|spinach|walnut/)) tags.push("Anti-Inflammatory");
      if (tags.length === 0) tags.push("Healthy");

      const steps = (r.analyzedInstructions?.[0]?.steps || []).map(s => s.step);
      const description = r.summary
        ? r.summary.replace(/<[^>]+>/g, "").split(".").slice(0, 2).join(".").trim() + "."
        : "A delicious healthy recipe.";

      return {
        id: `r${i + 1}`,
        title: r.title,
        source: r.sourceName || new URL(r.sourceUrl || "https://spoonacular.com").hostname.replace("www.", ""),
        url: r.sourceUrl || null,
        image: r.image || null,
        time: r.readyInMinutes ? `${r.readyInMinutes} min` : "N/A",
        servings: r.servings || 2,
        tags: tags.slice(0, 3),
        description,
        ingredients: (r.extendedIngredients || []).map(ing => ing.original),
        steps: steps.length ? steps : ["See full recipe at source."],
        nutrition: {
          calories: get("Calories"),
          protein: get("Protein"),
          carbs: get("Carbohydrates"),
          fat: get("Fat"),
        },
      };
    });

    return res.status(200).json({ recipes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
