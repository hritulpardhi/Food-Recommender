"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CookingLoader from "./components/ui/CookingLoader";

export default function Home() {
  const [goal, setGoal] = useState("high protein");
  const [time, setTime] = useState("5");
  const [cooking, setCooking] = useState("pan");
  const [hunger, setHunger] = useState("medium");
  const [recipe, setRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState<any[]>([]);

  const [typed, setTyped] = useState('')
  useEffect(() => {
    try {
      const raw = localStorage.getItem("snackai_recipes");
      if (raw) setCached(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  // typing effect for hero
  useEffect(() => {
    const text = 'AI Snack Coach'
    let i = 0
    const iv = setInterval(() => {
      i++
      setTyped(text.slice(0, i))
      if (i >= text.length) clearInterval(iv)
    }, 80)
    return () => clearInterval(iv)
  }, [])

  function saveRecipeToCache(r: any) {
    try {
      const list = [r, ...cached].slice(0, 12);
      setCached(list);
      localStorage.setItem("snackai_recipes", JSON.stringify(list));
    } catch (e) {}
  }

  const generate = async () => {
    setLoading(true);
    setRecipe(null);

    const res = await fetch("/api/snack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, time, cooking, hunger }),
    });

    const data = await res.json();
    setRecipe(data);
    saveRecipeToCache({ ...data, _params: { goal, time, cooking, hunger }, _ts: Date.now() });
    setLoading(false);
  };

  // Sanitize steps: remove spilled ingredient-field lines or short labels
  const sanitizeStep = (s: any) => {
    if (s == null) return null;
    if (typeof s === 'object') {
      const keys = Object.keys(s || {});
      if (keys.includes('name') && (keys.includes('quantity') || keys.includes('unit'))) return null;
      if (typeof s.step === 'string') return s.step.trim();
      return null;
    }
    const str = String(s).trim();
    if (!str) return null;
    const lower = str.toLowerCase();
    const fieldLabels = ['ingredients','name','quantity','unit','notes','price','ingredients_table'];
    if (fieldLabels.includes(lower)) return null;
    if (/^₹/.test(str)) return null;
    return str;
  }

  const getSanitizedSteps = (steps: any, ingredients: any[]) => {
    if (!Array.isArray(steps)) return []
    const names = new Set((ingredients || []).map((it: any) => String(it?.name || '').toLowerCase()).filter(Boolean))
    const units = new Set(['tsp','tbsp','cup','cups','slice','g','kg','ml','l','pinch','to taste','tablespoon','teaspoon','tspoon','tblsp','gram','grams','kilogram','milliliter','liter','oz','ounce','pound','pcs','pieces'])

    return steps
      .map(sanitizeStep)
      .filter(Boolean)
      .filter((txt: string) => {
        const low = String(txt).toLowerCase().trim()
        if (!low) return false
        
        // Reject ingredient names
        if (names.has(low)) return false
        
        // Reject pure units
        if (units.has(low)) return false
        
        // Reject pure numbers and fractions
        if (/^[\d.,\-+\/]+$/.test(low)) return false
        
        // Reject currency (₹ or INR patterns)
        if (/^[₹\s]*\d+\s*(inr|₹)?$/i.test(low)) return false
        if (/^(inr|\₹)/i.test(low)) return false
        
        // Reject quantity+unit patterns like "60 g", "1 tsp", "1/2 tsp"
        if (/^\d+(\.\d+)?(\s*)\/(\s*)?\d+(\s+)(g|kg|ml|l|tsp|tbsp|cup|slice|pinch|oz|gram|grams|ml|liter|milliliter)$/i.test(low)) return false // fractions like "1/2 tsp"
        if (/^\d+(\.\d+)?(\s+)(g|kg|ml|l|tsp|tbsp|cup|slice|pinch|to taste|oz|gram|grams|milliliter|liter)$/i.test(low)) return false // "60 g", "1 tsp"
        
        // Reject metadata labels
        const metaLabels = ['ingredients','name','quantity','unit','notes','price','ingredients_table','qty']
        if (metaLabels.includes(low)) return false
        
        // Reject if 100% whitespace/punctuation
        if (!/[a-z]/i.test(txt)) return false
        
        return true
      })
  }


  const ctaVariants = {
    idle: {
      scale: 1,
      y: 0,
      boxShadow: "0 0 0 rgba(51,255,0,0)",
    },
    hover: {
      scale: 1.02,
      y: -2,
      boxShadow: "0 0 20px rgba(51,255,0,0.45), 0 0 40px rgba(51,255,0,0.25)",
      transition: { type: "spring", stiffness: 280, damping: 16 },
    },
    tap: {
      scale: 0.985,
      y: 0,
      transition: { type: "spring", stiffness: 450, damping: 30 },
    },
    disabled: {
      opacity: 0.7,
      scale: 1,
      y: 0,
      boxShadow: "0 0 0 rgba(51,255,0,0)",
    },
  };

  return (
    <main className={`min-h-screen p-6 flex flex-col items-center transition-colors`}>
      <motion.section className="w-full max-w-4xl mx-auto py-12" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="ascii-logo text-4xl text-phosphor">{typed}<span className="cursor" style={{width:12, height:24, display: typed.length ? 'inline-block' : 'none'}}/></div>
          <p className="max-w-2xl text-center text-[var(--muted)]">Gym friendly & late-night safe recipes — fast, tasty, and tailored to you.</p>
        </div>

        <div className="terminal-card w-full max-w-xl mx-auto space-y-4">
          <Select
            label="Goal"
            value={goal}
            set={setGoal}
            options={[
              "high protein",
              "healthy",
              "comfort",
              "low calorie",
              "high fiber",
              "weight loss",
              "muscle gain",
              "energy boost",
              "post workout",
              "budget friendly",
              "quick and easy",
            ]}
          />
          <Select
            label="Time (minutes)"
            value={time}
            set={setTime}
            options={["2", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "60"]}
          />
          <Select
            label="Cooking"
            value={cooking}
            set={setCooking}
            options={["no cook", "pan", "microwave", "oven", "air fryer", "boil", "steam", "grill", "bake"]}
          />
          <Select label="Hunger" value={hunger} set={setHunger} options={["light","medium","heavy"]} />

          <motion.button
            onClick={generate}
            className="w-full btn-terminal text-center py-3 text-lg relative"
            animate={loading ? "disabled" : "idle"}
            variants={ctaVariants}
            whileTap={!loading ? "tap" : undefined}
            whileHover={!loading ? "hover" : undefined}
            disabled={loading}
            aria-live="polite"
          >
            <motion.span
              className="block"
              variants={{
                idle: { textShadow: "0 0 0px rgba(51,255,0,0)" },
                hover: { textShadow: "0 0 14px rgba(51,255,0,0.7)" },
                disabled: { textShadow: "0 0 0px rgba(51,255,0,0)" },
              }}
              transition={{ duration: 0.3 }}
            >
              {loading ? "Crafting your snack..." : "Generate Snack"}
            </motion.span>
          </motion.button>
        </div>
      </motion.section>

      <section className="w-full max-w-xl mt-8">
        <AnimatePresence>
          {loading && <CookingLoader />}
          {recipe && !loading && (
            <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="terminal-card p-6">
                <h2 className="text-xl ascii-logo text-phosphor">{recipe.name}</h2>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-3 flex-wrap text-sm">
                    <span className="px-2 py-1 text-[var(--fg)]">Calories: {recipe.macros?.calories ?? recipe.calories ?? '—'} {recipe.macros?.calories_unit ?? ''}</span>&nbsp;|&nbsp;
                    <span className="px-2 py-1 text-[var(--fg)]">Protein: {recipe.macros?.protein ?? recipe.protein ?? '—'} {recipe.macros?.protein_unit ?? ''}</span>&nbsp;|&nbsp;
                    <span className="px-2 py-1 text-[var(--fg)]">Carbs: {recipe.macros?.carbs ?? '—'} {recipe.macros?.carbs_unit ?? ''}</span>&nbsp;|&nbsp;
                    <span className="px-2 py-1 text-[var(--fg)]">Fat: {recipe.macros?.fat ?? '—'} {recipe.macros?.fat_unit ?? ''}</span>&nbsp;
                  </div>
                </div>

                {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
                  <div className="mb-4 overflow-auto text-sm">
                    <table className="w-full font-mono text-sm">
                      <thead>
                        <tr className="text-left text-[var(--muted)]">
                          <th>Ingredient</th>
                          <th className="text-right">Qty</th>
                          <th>Unit</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.ingredients.map((it: any, idx: number) => (
                          <tr key={idx} className="border-t" style={{ borderColor: 'var(--border)' }}>
                            <td className="py-2 pr-4">{it.name}</td>
                            <td className="py-2 text-right pr-4">{it.quantity}</td>
                            <td className="py-2 pr-4">{it.unit}</td>
                            <td className="py-2 text-[var(--muted)]">{it.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : recipe.ingredients_table ? (
                  <pre className="mb-4 whitespace-pre-wrap text-sm p-3">{recipe.ingredients_table}</pre>
                ) : null}

                {Array.isArray(recipe.nutrition_items) && recipe.nutrition_items.length > 0 && (
                  <div className="mb-4 overflow-auto text-sm">
                    <div className="text-sm font-semibold mb-2 text-[var(--muted)]">Nutrition API Breakdown</div>
                    {(() => {
                      const sum = (key: string) =>
                        recipe.nutrition_items.reduce((acc: number, it: any) => {
                          const n = Number(it?.[key]);
                          return Number.isFinite(n) ? acc + n : acc;
                        }, 0);
                      const fmt = (n: number) => (n > 0 ? (Math.round(n * 10) / 10).toString() : "—");
                      const totals = {
                        calories: sum("calories"),
                        serving_size_g: sum("serving_size_g"),
                        protein_g: sum("protein_g"),
                        carbohydrates_total_g: sum("carbohydrates_total_g"),
                        fat_total_g: sum("fat_total_g"),
                        fat_saturated_g: sum("fat_saturated_g"),
                        sodium_mg: sum("sodium_mg"),
                        potassium_mg: sum("potassium_mg"),
                        cholesterol_mg: sum("cholesterol_mg"),
                        fiber_g: sum("fiber_g"),
                        sugar_g: sum("sugar_g"),
                      };
                      return (
                    <table className="w-full font-mono text-xs">
                      <thead>
                        <tr className="text-left text-[var(--muted)]">
                          <th>Name</th>
                          <th>Calories</th>
                          <th>Serving (g)</th>
                          <th>Protein (g)</th>
                          <th>Carbs (g)</th>
                          <th>Fat (g)</th>
                          <th>Fat Sat (g)</th>
                          <th>Sodium (mg)</th>
                          <th>Potassium (mg)</th>
                          <th>Cholesterol (mg)</th>
                          <th>Fiber (g)</th>
                          <th>Sugar (g)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipe.nutrition_items.map((it: any, idx: number) => (
                          <tr key={`${it?.name ?? "item"}-${idx}`} className="border-t" style={{ borderColor: 'var(--border)' }}>
                            <td className="py-2 pr-4">{it?.name ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.calories ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.serving_size_g ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.protein_g ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.carbohydrates_total_g ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.fat_total_g ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.fat_saturated_g ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.sodium_mg ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.potassium_mg ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.cholesterol_mg ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.fiber_g ?? "—"}</td>
                            <td className="py-2 pr-4">{it?.sugar_g ?? "—"}</td>
                          </tr>
                        ))}
                        <tr className="border-t text-left" style={{ borderColor: 'var(--border)', color: '#ffffff' }}>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>Total</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.calories)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.serving_size_g)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.protein_g)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.carbohydrates_total_g)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.fat_total_g)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.fat_saturated_g)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.sodium_mg)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.potassium_mg)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.cholesterol_mg)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.fiber_g)}</th>
                          <th className="py-2 pr-4 font-semibold" style={{ color: '#ffffff' }}>{fmt(totals.sugar_g)}</th>
                        </tr>
                      </tbody>
                    </table>
                      );
                    })()}
                  </div>
                )}

                <ol className="list-decimal pl-5 space-y-2 font-mono text-[var(--fg)]">
                  {Array.isArray(recipe.steps) ? (
                      getSanitizedSteps(recipe.steps, recipe.ingredients).map((txt: string, i: number) => (
                        <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                          {txt}
                        </motion.li>
                      ))
                    ) : null}
                </ol>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {cached.length > 0 && (
        <section className="w-full max-w-4xl mt-10">
          <h3 className="text-lg font-semibold mb-3 ascii-logo">Recent recipes</h3>
          <div className="grid grid-cols-2 gap-4">
            {cached.map((c, idx) => {
              const isActive = recipe?._ts && c?._ts && recipe._ts === c._ts;
              return (
                <motion.button
                  key={c?._ts ?? idx}
                  onClick={() => setRecipe(c)}
                  whileHover={!isActive ? { backgroundColor: "rgba(51,255,0,0.04)" } : undefined}
                  className="text-left p-3 terminal-card transition-all"
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--fg)",
                          color: "var(--bg)",
                          border: "1px solid var(--fg)",
                        }
                      : undefined
                  }
                >
                  <div className="font-mono" style={isActive ? { color: "var(--bg)" } : undefined}>{c.name}</div>
                  <div
                    className="text-xs"
                    style={isActive ? { color: "var(--bg)" } : { color: "var(--muted)" }}
                  >
                    {new Date(c._ts).toLocaleString()}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      <footer className="w-full max-w-4xl mt-10 mb-4 text-xs text-[var(--muted)]">
        <p>
          Note: Recipes on this website are AI-generated and may occasionally be inaccurate.
          Please use your judgment, verify ingredients and cooking steps, and check for allergies,
          dietary restrictions, and food safety before consuming.
        </p>
      </footer>
    </main>
  );
}

function Select({label,value,set,options}) {
  const toTitle = (s:string) => s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return (
    <div>
      <label className="text-sm font-medium text-[var(--muted)]">{toTitle(label)}</label>
      <div className="mt-1 relative prompt">
        <span className="prompt-prefix">&gt;</span>
        <select
          value={value}
          onChange={e => set(e.target.value)}
          aria-label={label}
          className="bg-transparent w-full mt-0 p-2 pr-10 text-[var(--fg)]"
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-[#050505]">{toTitle(String(o))}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
