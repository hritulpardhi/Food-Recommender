// Sanitizer helper functions for robust JSON parsing
function stripCodeFences(s) {
  return s.replace(/```\s*json\s*/gi, '').replace(/```/g, '').trim();
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const m = String(text || '').match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch (e2) {
      return null;
    }
  }
}

function extractBestEffortRecipe(text) {
  const out = {
    name: null,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    steps: [],
    ingredients: [],
    ingredients_table: null,
    macros: null,
  };

  const raw = String(text || '');

  const nameM = raw.match(/"name"\s*:\s*"([^"]{1,200})"/i);
  if (nameM) out.name = nameM[1];

  const stepsBlock = raw.match(/"steps"\s*:\s*\[([\s\S]{0,6000})\]/i)?.[1];
  if (stepsBlock) {
    const strRe = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let m;
    while ((m = strRe.exec(stepsBlock)) !== null) out.steps.push(m[1]);
  }

  const ingBlock = raw.match(/"ingredients"\s*:\s*\[([\s\S]{0,10000})/i)?.[1] || '';
  const objRe = /\{([\s\S]*?)\}/g;
  let o;
  while ((o = objRe.exec(ingBlock)) !== null) {
    const objText = o[1];
    const n = objText.match(/"name"\s*:\s*"([^"]*)"/i)?.[1] ?? '';
    const q = objText.match(/"quantity"\s*:\s*"([^"]*)"/i)?.[1] ?? '';
    const u = objText.match(/"unit"\s*:\s*"([^"]*)"/i)?.[1] ?? '';
    const notes = objText.match(/"notes"\s*:\s*"([^"]*)"/i)?.[1] ?? '';
    if (n.trim()) out.ingredients.push({ name: n.trim(), quantity: q.trim(), unit: u.trim(), notes: notes.trim() });
  }

  const macroFrom = (field) => {
    const m = raw.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`, 'i')) || raw.match(new RegExp(`"${field}"\\s*:\\s*([0-9.]+)`, 'i'));
    if (!m) return null;
    const candidate = m[1];
    const n = normalizeMacroValue(candidate);
    return n;
  };

  out.calories = macroFrom('calories');
  out.protein = macroFrom('protein');
  out.carbs = macroFrom('carbs');
  out.fat = macroFrom('fat');
  out.macros = {
    calories: out.calories,
    protein: out.protein,
    carbs: out.carbs,
    fat: out.fat,
  };

  if (!out.name && out.ingredients.length === 0 && out.steps.length === 0) return null;
  return out;
}

function enforceSchema(obj) {
  if (!obj || typeof obj !== 'object') return null;

  const metaLabels = ['ingredients', 'name', 'quantity', 'unit', 'notes', 'price', 'ingredients_table'];
  const cleanSteps = Array.isArray(obj.steps)
    ? obj.steps
        .filter((s) => typeof s === 'string' && !metaLabels.includes(s.trim().toLowerCase()) && !/^[\d.\s-]+$/.test(s.trim()))
        .map((s) => s.trim())
    : [];

  return {
    name: String(obj.name ?? '').trim() || 'Untitled Recipe',
    calories: obj.calories == null ? null : String(obj.calories),
    protein: obj.protein == null ? null : String(obj.protein),
    carbs: obj.carbs == null ? null : String(obj.carbs),
    fat: obj.fat == null ? null : String(obj.fat),
    steps: cleanSteps,
    ingredients: Array.isArray(obj.ingredients)
      ? obj.ingredients
          .map((it) => ({
            name: String(it?.name ?? '').trim(),
            quantity: String(it?.quantity ?? '').trim(),
            unit: String(it?.unit ?? '').trim(),
            notes: String(it?.notes ?? '').trim(),
          }))
          .filter((it) => it.name)
      : [],
    ingredients_table: obj.ingredients_table ?? null,
    macros: obj.macros ?? null,
  };
}

function toNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeMacroValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? String(n) : null;
}

function escapePipe(v) {
  try {
    if (v === null || v === undefined) return '';
    return String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  } catch (e) {
    return '';
  }
}

function formatNutritionQuery(ingredient) {
  const name = String(ingredient?.name ?? '').trim();
  return name;
}

function parseQuantity(q) {
  const s = String(q ?? '').trim().toLowerCase();
  if (!s) return 1;
  if (s === 'a' || s === 'an') return 1;
  if (s.includes('few')) return 3;

  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);

  const n = s.match(/-?\d+(\.\d+)?/);
  return n ? Number(n[0]) : 1;
}

function parseQuantityAndUnit(quantityRaw, unitRaw) {
  const quantityText = String(quantityRaw ?? '').trim().toLowerCase();
  const explicitUnit = String(unitRaw ?? '').trim().toLowerCase();
  const qty = parseQuantity(quantityRaw);

  const unitFromQuantity =
    quantityText.match(
      /\b(kg|kilogram|kilograms|g|gram|grams|mg|ml|l|liter|litre|tsp|teaspoon|tbsp|tablespoon|cup|cups|piece|pieces|clove|cloves|pinch|dollop)\b/
    )?.[1] ?? '';

  return {
    qty,
    unit: explicitUnit || unitFromQuantity || '',
  };
}

function tokenize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeIngredientName(name) {
  return String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function chooseBestUsdaFood(foods, ingredientName) {
  if (!Array.isArray(foods) || foods.length === 0) return null;
  const queryTokens = new Set(tokenize(ingredientName));

  let best = null;
  let bestScore = -Infinity;

  for (const food of foods) {
    const desc = String(food?.description || '');
    const tokens = tokenize(desc);
    const tokenSet = new Set(tokens);
    let score = 0;

    for (const t of queryTokens) {
      if (tokenSet.has(t)) score += 3;
    }

    if (desc.toLowerCase().includes(normalizeIngredientName(ingredientName).toLowerCase())) score += 2;
    if (String(food?.dataType || '').toLowerCase().includes('branded')) score -= 1;

    if (score > bestScore) {
      bestScore = score;
      best = food;
    }
  }

  return best || foods[0];
}

function gramsFromUsdaPortions(food, unit, quantity) {
  const u = String(unit || '').trim().toLowerCase();
  const q = Number.isFinite(quantity) ? quantity : 1;
  const portions = Array.isArray(food?.foodPortions) ? food.foodPortions : [];
  if (!portions.length || !u) return null;

  const candidates = portions.filter((p) => {
    const modifier = String(p?.modifier || '').toLowerCase();
    const measure = String(p?.measureUnit?.name || '').toLowerCase();
    return modifier.includes(u) || measure.includes(u);
  });

  const picked = candidates.find((p) => toNum(p?.gramWeight) !== null);
  if (!picked) return null;
  const gramWeight = toNum(picked?.gramWeight);
  if (gramWeight === null) return null;
  const amount = toNum(picked?.amount) || 1;
  return (q * gramWeight) / amount;
}

function sameUnit(a, b) {
  const x = String(a || '').trim().toLowerCase();
  const y = String(b || '').trim().toLowerCase();
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
}

async function fetchUsdaFoodDetails(fdcId, apiKey) {
  if (!fdcId) return null;
  try {
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(String(fdcId))}?api_key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function quantityToGrams(ingredient, food) {
  const parsed = parseQuantityAndUnit(ingredient?.quantity, ingredient?.unit);
  const qty = parsed.qty;
  const unit = parsed.unit;

  // Metric units are deterministic.
  if (unit === 'g' || unit === 'gram' || unit === 'grams') return qty;
  if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') return qty * 1000;
  if (unit === 'mg') return qty / 1000;
  if (unit === 'ml') return qty;
  if (unit === 'l' || unit === 'liter' || unit === 'litre') return qty * 1000;

  // Prefer USDA portion metadata when available.
  const portionBased = gramsFromUsdaPortions(food, unit, qty);
  if (portionBased !== null) return portionBased;

  // Next fallback: USDA servingSize, if unit aligns or no unit is provided.
  const servingSize = toNum(food?.servingSize);
  const servingUnit = String(food?.servingSizeUnit || '').trim().toLowerCase();
  if (servingSize !== null) {
    if (!unit) return qty * servingSize;
    if (sameUnit(unit, servingUnit)) return qty * servingSize;
    if (servingUnit === 'g' || servingUnit === 'gram' || servingUnit === 'grams') return qty * servingSize;
  }

  // Last resort: assume label nutrients are per 100g.
  return 100 * qty;
}

function pickNutrient(nutrients, names) {
  if (!Array.isArray(nutrients) || !names?.length) return null;
  const lower = names.map((x) => x.toLowerCase());
  for (const n of nutrients) {
    const name = String(n?.nutrientName ?? '').toLowerCase();
    if (lower.some((k) => name.includes(k))) {
      const v = toNum(n?.value);
      if (v !== null) return v;
    }
  }
  return null;
}

function normalizeUsdaItem(food, ingredient, grams, scale) {
  const nutrients = Array.isArray(food?.foodNutrients) ? food.foodNutrients : [];
  const energy = pickNutrient(nutrients, ['energy']);
  const protein = pickNutrient(nutrients, ['protein']);
  const fatTotal = pickNutrient(nutrients, ['total lipid (fat)', 'fat, total']);
  const fatSat = pickNutrient(nutrients, ['fatty acids, total saturated', 'saturated']);
  const carbs = pickNutrient(nutrients, ['carbohydrate, by difference', 'carbohydrate']);
  const fiber = pickNutrient(nutrients, ['fiber, total dietary', 'fiber']);
  const sugar = pickNutrient(nutrients, ['sugars, total']);
  const sodium = pickNutrient(nutrients, ['sodium']);
  const potassium = pickNutrient(nutrients, ['potassium']);
  const cholesterol = pickNutrient(nutrients, ['cholesterol']);

  const scaled = (v) => (v === null ? null : Math.round(v * scale * 10) / 10);

  return {
    name: String(food?.description ?? ingredient?.name ?? '').trim() || null,
    calories: scaled(energy),
    serving_size_g: Math.round(grams * 10) / 10,
    fat_total_g: scaled(fatTotal),
    fat_saturated_g: scaled(fatSat),
    protein_g: scaled(protein),
    sodium_mg: scaled(sodium),
    potassium_mg: scaled(potassium),
    cholesterol_mg: scaled(cholesterol),
    carbohydrates_total_g: scaled(carbs),
    fiber_g: scaled(fiber),
    sugar_g: scaled(sugar),
  };
}

async function fetchNutritionFromApi(ingredients) {
  const apiKey = process.env.USDA_API_KEY || process.env.NUTRITION_API_KEY;
  const baseUrl = process.env.NUTRITION_API_URL || 'https://api.nal.usda.gov/fdc/v1/foods/search';

  if (!apiKey) {
    return { ok: false, error: 'Missing USDA_API_KEY or NUTRITION_API_KEY' };
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
    const cleanName = normalizeIngredientName(ingredient?.name || '');
    const query = cleanName || formatNutritionQuery(ingredient);
    if (!query) continue;

    try {
      const res = await fetch(`${baseUrl}?api_key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          pageSize: 12,
          sortBy: 'dataType.keyword',
          sortOrder: 'asc',
          dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
        }),
      });

      if (!res.ok) {
        misses.push({ ingredient: query, status: res.status });
        continue;
      }

      const data = await res.json();
      const foods = Array.isArray(data?.foods) ? data.foods : [];
      if (!foods.length) {
        misses.push({ ingredient: query, status: 204 });
        continue;
      }

      const selected = chooseBestUsdaFood(foods, cleanName || query);
      const detail = await fetchUsdaFoodDetails(selected?.fdcId, apiKey);
      const food = detail || selected;
      const grams = quantityToGrams(ingredient, food);
      const scale = grams / 100;
      const item = normalizeUsdaItem(food, ingredient, grams, scale);

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
      misses.push({ ingredient: query, error: String(e) });
    }
  }

  if (matched === 0) {
    const all403 = misses.length > 0 && misses.every((m) => Number(m?.status) === 403);
    if (all403) {
      return { ok: false, error: 'USDA request unauthorized (403). Check USDA_API_KEY.', misses };
    }
    return { ok: false, error: 'Nutrition API returned no usable matches', misses };
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

export async function POST(req) {
  try {
    const { goal, time, cooking, hunger } = await req.json();

    const prompt = `You are a snack recipe generator for users in India.
Create exactly one practical snack recipe from user preferences.
Use ingredient names and cooking style common in India.
Use Indian kitchen-friendly units: g, kg, ml, l, tsp, tbsp, cup, piece.
Estimate macros if possible, especially protein in grams.
Return strict JSON only.

Goal: ${goal}
Time: ${time} minutes
Cooking: ${cooking}
Hunger: ${hunger}

JSON schema:
{
  "name": string,
  "calories": string or null,
  "protein": string or null,
  "carbs": string or null,
  "fat": string or null,
  "steps": [string],
  "ingredients": [{ "name": string, "quantity": string, "unit": string, "notes": string }],
  "ingredients_table": null,
  "macros": {
    "calories": string or null,
    "protein": string or null,
    "carbs": string or null,
    "fat": string or null
  } or null
}

No markdown. No explanation. JSON only.`;

    const primary = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const fallbackEnv = process.env.GROQ_MODEL_FALLBACKS || 'groq/compound,openai/gpt-oss-20b';
    const candidates = [primary, ...fallbackEnv.split(',').map((s) => s.trim()).filter(Boolean)];

    const attempts = [];
    let lastError = null;

    for (const modelName of candidates) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            max_tokens: 900,
          }),
        });

        const rawText = await res.text();
        attempts.push({ model: modelName, status: res.status, raw: rawText.slice(0, 800) });

        if (res.status === 429 || res.status === 404 || res.status === 400) {
          try {
            const errJson = JSON.parse(rawText);
            const code = errJson?.error?.code;
            if (res.status === 429 || code === 'model_decommissioned' || code === 'model_not_found') {
              lastError = { status: res.status, detail: errJson };
              continue;
            }
          } catch (e) {
            if (res.status === 429) {
              lastError = { status: res.status, detail: rawText };
              continue;
            }
          }
          return new Response(JSON.stringify({ error: 'Upstream API error', status: res.status, detail: rawText, attempts }), { status: 502 });
        }

        if (!res.ok) {
          lastError = { status: res.status, detail: rawText };
          continue;
        }

        let data = null;
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          lastError = { status: res.status, detail: rawText };
          continue;
        }

        const text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
        const cleaned = stripCodeFences(text);
        let parsed = safeParseJson(cleaned);

        if (!parsed) {
          parsed = extractBestEffortRecipe(cleaned);
        }

        if (!parsed) {
          return new Response(JSON.stringify({ error: 'Invalid model response', raw: text.slice(0, 500), attempts }), { status: 502 });
        }

        const normalized = enforceSchema(parsed);
        if (!normalized) {
          return new Response(JSON.stringify({ error: 'Failed to enforce schema', raw: text.slice(0, 500) }), { status: 502 });
        }

        const llmFallback = {
          calories: normalizeMacroValue(normalized?.macros?.calories ?? normalized.calories),
          protein: normalizeMacroValue(normalized?.macros?.protein ?? normalized.protein),
          carbs: normalizeMacroValue(normalized?.macros?.carbs ?? normalized.carbs),
          fat: normalizeMacroValue(normalized?.macros?.fat ?? normalized.fat),
        };

        const nutrition = await fetchNutritionFromApi(normalized.ingredients);
        const nutritionFailed = !nutrition.ok;

        normalized.calories = nutritionFailed ? (llmFallback.calories ?? null) : (nutrition.totals.calories ?? llmFallback.calories ?? null);
        normalized.protein = nutritionFailed ? (llmFallback.protein ?? null) : (nutrition.totals.protein ?? llmFallback.protein ?? null);
        normalized.carbs = nutritionFailed ? (llmFallback.carbs ?? null) : (nutrition.totals.carbs ?? llmFallback.carbs ?? null);
        normalized.fat = nutritionFailed ? (llmFallback.fat ?? null) : (nutrition.totals.fat ?? llmFallback.fat ?? null);
        normalized.macros = {
          calories: normalized.calories,
          protein: normalized.protein,
          carbs: normalized.carbs,
          fat: normalized.fat,
          calories_unit: 'kcal',
          protein_unit: 'g',
          carbs_unit: 'g',
          fat_unit: 'g',
        };
        normalized.nutrition_items = nutritionFailed ? [] : nutrition.items;

        if (!normalized.ingredients_table && Array.isArray(normalized.ingredients) && normalized.ingredients.length) {
          const header = '| Ingredient | Quantity | Unit | Notes |\n|---|---:|---|---|\n';
          const rows = normalized.ingredients
            .map((it) => `| ${escapePipe(it.name)} | ${escapePipe(it.quantity)} | ${escapePipe(it.unit)} | ${escapePipe(it.notes)} |`)
            .join('\n');
          normalized.ingredients_table = header + rows;
        }

        return new Response(
          JSON.stringify({
            ...normalized,
            _warning: nutritionFailed ? 'Nutrition API unavailable. Showing LLM-estimated macros.' : undefined,
            _meta: {
              model: modelName,
              attempts,
              nutrition_api: process.env.NUTRITION_API_URL || 'https://api.nal.usda.gov/fdc/v1/foods/search',
            },
            _nutritionMisses: nutrition.misses ?? [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        attempts.push({ model: modelName, error: String(e) });
        lastError = { error: String(e) };
        continue;
      }
    }

    return new Response(JSON.stringify({ error: 'All model candidates failed', lastError, attempts }), { status: 502 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
