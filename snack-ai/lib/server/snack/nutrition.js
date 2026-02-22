function toNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeIngredientName(name) {
  return String(name || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNinjaQuery(ingredient) {
  const explicit = String(ingredient?.ninja_query ?? "").trim();
  const normalize = (s) =>
    String(s || "")
      .replace(/(\d)([a-zA-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();
  if (explicit) return normalize(explicit);

  const quantity = String(ingredient?.quantity ?? "").trim();
  const unit = String(ingredient?.unit ?? "").trim();
  const name = normalizeIngredientName(ingredient?.name ?? "");

  return normalize([quantity, unit, name].filter(Boolean).join(" "));
}

function pickBestItem(items, ingredientName) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const needle = normalizeIngredientName(ingredientName).toLowerCase();
  if (!needle) return items[0];

  const matched = items.find((it) => {
    const n = String(it?.name || "").toLowerCase();
    return n.includes(needle) || needle.includes(n);
  });
  return matched || items[0];
}

function normalizeNinjaItem(item, ingredient) {
  return {
    name: String(ingredient?.name ?? item?.name ?? "").trim() || null,
    source_name: String(item?.name ?? "").trim() || null,
    calories: toNum(item?.calories),
    serving_size_g: toNum(item?.serving_size_g),
    fat_total_g: toNum(item?.fat_total_g),
    fat_saturated_g: toNum(item?.fat_saturated_g),
    protein_g: toNum(item?.protein_g),
    sodium_mg: toNum(item?.sodium_mg),
    potassium_mg: toNum(item?.potassium_mg),
    cholesterol_mg: toNum(item?.cholesterol_mg),
    carbohydrates_total_g: toNum(item?.carbohydrates_total_g),
    fiber_g: toNum(item?.fiber_g),
    sugar_g: toNum(item?.sugar_g),
  };
}

export async function fetchNutritionFromApi(ingredients) {
  const apiKey = process.env.NINJA_API_KEY || process.env.NUTRITION_API_KEY;
  const baseUrl = process.env.NUTRITION_API_URL || "https://api.api-ninjas.com/v1/nutrition";

  if (!apiKey) {
    return { ok: false, error: "Missing NINJA_API_KEY or NUTRITION_API_KEY", misses: [] };
  }

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let caloriesCount = 0;
  let proteinCount = 0;
  let carbsCount = 0;
  let fatCount = 0;
  let matched = 0;
  const misses = [];
  const nutritionItems = [];

  for (const ingredient of ingredients || []) {
    const query = buildNinjaQuery(ingredient);
    if (!query) continue;

    try {
      const url = `${baseUrl}?query=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        misses.push({ ingredient: String(ingredient?.name || query), status: res.status });
        continue;
      }

      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      if (items.length === 0) {
        misses.push({ ingredient: String(ingredient?.name || query), status: 204, query });
        continue;
      }

      const best = pickBestItem(items, ingredient?.name || query);
      if (!best) {
        misses.push({ ingredient: String(ingredient?.name || query), status: 204, query });
        continue;
      }

      const item = normalizeNinjaItem(best, ingredient);
      matched += 1;
      nutritionItems.push(item);

      const cals = toNum(item?.calories);
      const prot = toNum(item?.protein_g);
      const carb = toNum(item?.carbohydrates_total_g);
      const fatVal = toNum(item?.fat_total_g);

      if (cals !== null) {
        calories += cals;
        caloriesCount += 1;
      }
      if (prot !== null) {
        protein += prot;
        proteinCount += 1;
      }
      if (carb !== null) {
        carbs += carb;
        carbsCount += 1;
      }
      if (fatVal !== null) {
        fat += fatVal;
        fatCount += 1;
      }
    } catch (e) {
      misses.push({ ingredient: String(ingredient?.name || query), error: String(e), query });
    }
  }

  if (matched === 0) {
    return { ok: false, error: "Nutrition API returned no usable matches", misses };
  }

  return {
    ok: true,
    totals: {
      calories: caloriesCount > 0 ? String(Math.round(calories)) : null,
      protein: proteinCount > 0 ? String(Math.round(protein * 10) / 10) : null,
      carbs: carbsCount > 0 ? String(Math.round(carbs * 10) / 10) : null,
      fat: fatCount > 0 ? String(Math.round(fat * 10) / 10) : null,
    },
    items: nutritionItems,
    misses,
  };
}
