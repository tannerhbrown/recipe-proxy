const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;

const FILTER_PARAMS = {
  "All": {
    tags: "healthy",
    minCalories: 150,
  },
  "Air Fryer": {
    tags: "healthy",
    query: "air fryer",
    minCalories: 150,
  },
  "Anti-Inflammatory": {
    tags: "healthy,anti-inflammatory",
    minFiber: 3,
    minCalories: 150,
  },
  "High Protein": {
    tags: "healthy",
    minProtein: 30,
    minCalories: 200,
  },
  "Instant Pot": {
    tags: "healthy",
    query: "instant pot",
    minCalories: 150,
  },
  "Low Carb": {
    tags: "healthy",
    maxCarbs: 20,
    maxSugar: 5,
    minCalories: 150,
  },
  "Mediterranean": {
    tags: "healthy",
    diet: "mediterranean",
    minCalories: 150,
  },
  "One-Pot/One-Pan": {
    tags: "healthy",
    query: "one pot",
    minCalories: 150,
  },
  "Paleo": {
    tags: "healthy",
    diet: "paleo",
    minCalories: 150,
  },
  "Quick & Easy": {
    tags: "healthy",
    maxReadyTime: 25,
    minCalories: 150,
  },
  "Sheet Pan Meals": {
    tags: "healthy",
    query: "sheet pan",
    minCalories: 150,
  },
  "Slow Cooker": {
    tags: "healthy",
    query: "slow cooker",
    minCalories: 150,
  },
  "Whole30": {
    tags: "healthy",
    diet: "whole30",
    minCalories: 150,
  },
};

const EXCLUDE_TAGS = [
  "dessert",
  "sweet",
  "cocktail",
  "beverage",
  "drink",
  "alcoholic-beverage",
  "smoothie",
  "juice",
  "cake",
  "cookie",
  "pastry",
  "candy",
  "ice-cream",
].join(",");

const PREFERRED_SOURCES = [
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

const BLOCKED_SOURCES = [
  "foodista.com",
  "afrolems.com",
];

function isPreferred(url) {
  if (!url) return false;
  return PREFERRED_SOURCES.some(s => url.includes(s));
}

function isBlocked(url) {
  if (!url) return false;
  return BLOCKED_SOURCES.some(s => url.includes(s));
}

function buildRecipe(r, i) {
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
    source: r.sourceName || (r.sourceUrl ? new URL(r.sourceUrl).hostname.replace("www.", "") : "Spoonacular"),
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
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const filter = req.query.filter || "All";
  const params = FILTER_PARAMS[filter] || FILTER_PARAMS["All"];

  try {
    // Fetch a large pool so we have enough to filter from
    const { tags, query, diet, ...rest } = params;
    const qs = new URLSearchParams({
      apiKey: SPOONACULAR_KEY,
      number: 100,
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
      instructionsRequired: true,
      sort: "random",
      excludeTags: EXCLUDE_TAGS,
      ...(tags && { tags }),
      ...(query && { query }),
      ...(diet && { diet }),
      ...rest,
    });

    const spoonResp = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${qs}`);
    if (!spoonResp.ok) {
      const err = await spoonResp.text();
      return res.status(502).json({ error: `Spoonacular error: ${err.slice(0, 200)}` });
    }

    const data = await spoonResp.json();
    if (!data.results?.length) {
      return res.status(404).json({ error: "No recipes returned" });
    }

    // Remove blocked sources
    const filtered = data.results.filter(r => !isBlocked(r.sourceUrl));

    // Split into preferred and everything else
    const preferred = filtered.filter(r => isPreferred(r.sourceUrl));
    const rest = filtered.filter(r => !isPreferred(r.sourceUrl));

    // Fill up to 5 with preferred first, then fall back to rest
    const selected = [...preferred, ...rest].slice(0, 5);

    if (!selected.length) {
      return res.status(404).json({ error: "No suitable recipes found" });
    }

    const recipes = selected.map((r, i) => buildRecipe(r, i));
    return res.status(200).json({ recipes });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
