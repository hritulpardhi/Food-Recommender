const META_LABELS = ["ingredients", "name", "quantity", "unit", "notes", "price", "ingredients_table"];

function stripCodeFences(s) {
  return s.replace(/```\s*json\s*/gi, "").replace(/```/g, "").trim();
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = String(text || "").match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

export function normalizeMacroValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? String(n) : null;
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
    ingredient_macros: [],
    ingredients_table: null,
    macros: null,
  };

  const raw = String(text || "");

  const nameM = raw.match(/"name"\s*:\s*"([^"]{1,200})"/i);
  if (nameM) out.name = nameM[1];

  const stepsBlock = raw.match(/"steps"\s*:\s*\[([\s\S]{0,6000})\]/i)?.[1];
  if (stepsBlock) {
    const strRe = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let m;
    while ((m = strRe.exec(stepsBlock)) !== null) out.steps.push(m[1]);
  }

  const ingBlock = raw.match(/"ingredients"\s*:\s*\[([\s\S]{0,10000})/i)?.[1] || "";
  const objRe = /\{([\s\S]*?)\}/g;
  let o;
  while ((o = objRe.exec(ingBlock)) !== null) {
    const objText = o[1];
    const name = objText.match(/"name"\s*:\s*"([^"]*)"/i)?.[1] ?? "";
    const quantity = objText.match(/"quantity"\s*:\s*"([^"]*)"/i)?.[1] ?? "";
    const unit = objText.match(/"unit"\s*:\s*"([^"]*)"/i)?.[1] ?? "";
    const notes = objText.match(/"notes"\s*:\s*"([^"]*)"/i)?.[1] ?? "";
    if (name.trim()) {
      out.ingredients.push({
        name: name.trim(),
        quantity: quantity.trim(),
        unit: unit.trim(),
        notes: notes.trim(),
        ninja_query: "",
      });
    }
  }

  const macroFrom = (field) => {
    const m =
      raw.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`, "i")) ||
      raw.match(new RegExp(`"${field}"\\s*:\\s*([0-9.]+)`, "i"));
    if (!m) return null;
    return normalizeMacroValue(m[1]);
  };

  out.calories = macroFrom("calories");
  out.protein = macroFrom("protein");
  out.carbs = macroFrom("carbs");
  out.fat = macroFrom("fat");
  out.macros = {
    calories: out.calories,
    protein: out.protein,
    carbs: out.carbs,
    fat: out.fat,
  };

  if (!out.name && out.ingredients.length === 0 && out.steps.length === 0) return null;
  return out;
}

export function parseRecipeResponse(text) {
  const cleaned = stripCodeFences(String(text || ""));
  return safeParseJson(cleaned) || extractBestEffortRecipe(cleaned);
}

export function enforceRecipeSchema(obj) {
  if (!obj || typeof obj !== "object") return null;

  const cleanSteps = Array.isArray(obj.steps)
    ? obj.steps
        .filter((s) => typeof s === "string" && !META_LABELS.includes(s.trim().toLowerCase()) && !/^[\d.\s-]+$/.test(s.trim()))
        .map((s) => s.trim())
    : [];

  return {
    name: String(obj.name ?? "").trim() || "Untitled Recipe",
    calories: obj.calories == null ? null : String(obj.calories),
    protein: obj.protein == null ? null : String(obj.protein),
    carbs: obj.carbs == null ? null : String(obj.carbs),
    fat: obj.fat == null ? null : String(obj.fat),
    steps: cleanSteps,
    ingredients: Array.isArray(obj.ingredients)
      ? obj.ingredients
          .map((it) => ({
            name: String(it?.name ?? "").trim(),
            quantity: String(it?.quantity ?? "").trim(),
            unit: String(it?.unit ?? "").trim(),
            notes: String(it?.notes ?? "").trim(),
            ninja_query: String(it?.ninja_query ?? "").trim(),
          }))
          .filter((it) => it.name)
      : [],
    ingredient_macros: Array.isArray(obj.ingredient_macros)
      ? obj.ingredient_macros
          .map((it) => ({
            name: String(it?.name ?? "").trim(),
            calories: normalizeMacroValue(it?.calories),
            protein: normalizeMacroValue(it?.protein),
            carbs: normalizeMacroValue(it?.carbs),
            fat: normalizeMacroValue(it?.fat),
          }))
          .filter((it) => it.name)
      : [],
    ingredients_table: obj.ingredients_table ?? null,
    macros: obj.macros ?? null,
  };
}

export function escapePipe(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\|/g, "\\|").replace(/\n/g, " ");
}
