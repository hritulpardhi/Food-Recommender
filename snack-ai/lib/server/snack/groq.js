function isRetryableModelError(status, rawText) {
  if (status === 429) return true;
  if (status !== 400 && status !== 404) return false;

  try {
    const errJson = JSON.parse(rawText);
    const code = errJson?.error?.code;
    return code === "model_decommissioned" || code === "model_not_found";
  } catch {
    return false;
  }
}

export async function requestGroqWithFallback(prompt) {
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, status: 500, error: "Missing GROQ_API_KEY", attempts: [] };
  }

  const primary = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const fallbackEnv = process.env.GROQ_MODEL_FALLBACKS || "groq/compound,openai/gpt-oss-20b";
  const candidates = [primary, ...fallbackEnv.split(",").map((s) => s.trim()).filter(Boolean)];

  const attempts = [];
  let lastError = null;

  for (const modelName of candidates) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 900,
        }),
      });

      const rawText = await res.text();
      attempts.push({ model: modelName, status: res.status, raw: rawText.slice(0, 800) });

      if (!res.ok) {
        if (isRetryableModelError(res.status, rawText)) {
          lastError = { status: res.status, detail: rawText };
          continue;
        }
        return { ok: false, status: 502, error: "Upstream API error", detail: rawText, attempts };
      }

      let data = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        lastError = { status: res.status, detail: rawText };
        continue;
      }

      const text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";
      if (!text) {
        lastError = { status: res.status, detail: "Missing text response" };
        continue;
      }

      return { ok: true, text, model: modelName, attempts };
    } catch (e) {
      attempts.push({ model: modelName, error: String(e) });
      lastError = { error: String(e) };
    }
  }

  return { ok: false, status: 502, error: "All model candidates failed", lastError, attempts };
}
