export function buildSnackPrompt({ goal, time, cooking, hunger }) {
  return `You are a snack recipe generator for users in India.
Create exactly one practical snack recipe from user preferences.
Use ingredient names and cooking style common in India.
Use Indian kitchen-friendly units: g, kg, ml, l, tsp, tbsp, cup, piece.
For each ingredient, provide a "ninja_query" field in the format API Ninjas expects:
"<quantity> <unit> <ingredient name>" (example: "1/2 cup paneer").
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
  "ingredients": [{ "name": string, "quantity": string, "unit": string, "notes": string, "ninja_query": string }],
  "ingredient_macros": [
    {
      "name": string,
      "calories": string or null,
      "protein": string or null,
      "carbs": string or null,
      "fat": string or null
    }
  ],
  "ingredients_table": null,
  "macros": {
    "calories": string or null,
    "protein": string or null,
    "carbs": string or null,
    "fat": string or null
  } or null
}

No markdown. No explanation. JSON only.`;
}
