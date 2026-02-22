import { requestGroqWithFallback } from "@/lib/server/snack/groq";
import { fetchNutritionFromApi } from "@/lib/server/snack/nutrition";
import { buildSnackPrompt } from "@/lib/server/snack/prompt";
import { enforceRecipeSchema, escapePipe, normalizeMacroValue, parseRecipeResponse } from "@/lib/server/snack/parsing";

function buildIngredientsTable(ingredients) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return null;

  const header = "| Ingredient | Quantity | Unit | Notes |\n|---|---:|---|---|\n";
  const rows = ingredients
    .map((it) => `| ${escapePipe(it.name)} | ${escapePipe(it.quantity)} | ${escapePipe(it.unit)} | ${escapePipe(it.notes)} |`)
    .join("\n");
  return header + rows;
}

export async function POST(req) {
  try {
    const { goal, time, cooking, diet, hunger } = await req.json();
    const prompt = buildSnackPrompt({ goal, time, cooking, diet, hunger });

    const llm = await requestGroqWithFallback(prompt);
    if (!llm.ok) {
      return new Response(
        JSON.stringify({
          error: llm.error,
          status: llm.status,
          detail: llm.detail,
          lastError: llm.lastError,
          attempts: llm.attempts,
        }),
        { status: llm.status ?? 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const parsed = parseRecipeResponse(llm.text);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Invalid model response", raw: llm.text.slice(0, 500), attempts: llm.attempts }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const normalized = enforceRecipeSchema(parsed);
    if (!normalized) {
      return new Response(JSON.stringify({ error: "Failed to enforce schema" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
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
      calories_unit: "kcal",
      protein_unit: "g",
      carbs_unit: "g",
      fat_unit: "g",
    };
    normalized.nutrition_items = nutritionFailed ? [] : nutrition.items;

    if (!normalized.ingredients_table) {
      normalized.ingredients_table = buildIngredientsTable(normalized.ingredients);
    }

    return new Response(
      JSON.stringify({
        ...normalized,
        _warning: nutritionFailed ? "Nutrition API unavailable. Showing LLM-estimated macros." : undefined,
        _meta: {
          model: llm.model,
          attempts: llm.attempts,
          protein_source: nutritionFailed ? "llm_fallback" : normalized.protein === llmFallback.protein ? "llm_fallback" : "api_ninjas",
          nutrition_api: process.env.NUTRITION_API_URL || "https://api.api-ninjas.com/v1/nutrition",
        },
        _llmIngredientMacros: normalized.ingredient_macros ?? [],
        _nutritionMisses: nutrition.misses ?? [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
