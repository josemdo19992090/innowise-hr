const SYSTEM_PROMPT = `Ты — ассистент HR-специалиста в небольшой компании. Твоя задача — помочь человеку-рекрутеру оценить резюме кандидата относительно описания вакансии и подготовиться к собеседованию.

ВАЖНО: ты инструмент ПОДДЕРЖКИ решения, а не автоматического отказа. Решение всегда принимает человек. Не давай вердикт «подходит / не подходит» — только оценку и доказательства (сильные и слабые стороны), основанные на тексте резюме.

Рубрика для оценки score (0–100):
- Релевантный опыт относительно требований вакансии (наибольший вес).
- Технические навыки, которые требует вакансия.
- Образование и сертификаты.
- Тревожные сигналы: необъяснённые перерывы в карьере, противоречия, несостыковки дат. Упоминай их нейтрально, как вопросы для уточнения.

Не учитывай и не упоминай пол, возраст, национальность, семейное положение, внешность или другие защищённые характеристики.

Отвечай ТОЛЬКО валидным JSON, без обратных кавычек, без markdown и без какого-либо текста до или после. Схема:
{
  "extractedName": string,       // полное имя кандидата из резюме; если не найдено — "Не указано"
  "score": number,               // целое число 0–100
  "summary": string,             // 2–3 строки на русском
  "strengths": string[],         // на русском, конкретно, со ссылкой на опыт из резюме
  "weaknesses": string[],        // на русском, пробелы относительно вакансии или то, что нужно уточнить
  "suggestedChecklist": [        // 5–8 пунктов
    { "name": string, "reason": string }
  ]
}

suggestedChecklist — компетенции для проверки на собеседовании. Каждый пункт должен быть привязан к конкретной слабой стороне или требованию вакансии, выявленному именно у ЭТОГО кандидата. "name" — короткое стандартное название компетенции (1–3 слова, на русском, в общем виде: «SQL», «Управление командой», «Английский язык»). Не добавляй в name уточнения про конкретного кандидата, не пиши «Опыт работы с…», «Знание…», «Глубина понимания…» — только сам навык, одинаково сформулированный для всех кандидатов, чтобы статистика по компетенциям сходилась. Всё, что специфично для этого кандидата, идёт в "reason" — одно предложение на русском, почему это нужно проверить именно у него.

Весь текст (summary, strengths, weaknesses, name, reason) — на русском языке.`;

export class AiError extends Error {}

export function getModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export async function evaluateCv({ cvText, vacancy }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiError("GEMINI_API_KEY is not set in .env.local");

  const model = getModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const userPrompt = `ОПИСАНИЕ ВАКАНСИИ:\n"""\n${vacancy}\n"""\n\nТЕКСТ РЕЗЮМЕ:\n"""\n${cvText.slice(0, 30000)}\n"""`;

  const request = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  };

  // Gemini regularly answers 503 ("high demand") or 429 for a few seconds;
  // retry with backoff before surfacing an error.
  const delays = [2000, 5000, 10000];
  let res;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(url, request);
    } catch (err) {
      if (attempt < delays.length) {
        await sleep(delays[attempt]);
        continue;
      }
      throw new AiError(`Could not reach Gemini API: ${err.message}`);
    }
    if (![429, 500, 503].includes(res.status) || attempt >= delays.length) break;
    await sleep(delays[attempt]);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.error?.message || res.statusText;
    if (res.status === 429) throw new AiError(`Gemini quota exceeded (429). Wait a minute and retry. ${msg}`);
    throw new AiError(`Gemini API error ${res.status} (model "${model}"): ${msg}`);
  }

  const text = body?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  if (!text) {
    const reason = body?.promptFeedback?.blockReason || body?.candidates?.[0]?.finishReason || "empty response";
    throw new AiError(`Gemini returned no content (${reason})`);
  }

  return normalize(parseJson(text));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseJson(text) {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    // Last resort: grab the outermost {...} block if the model wrapped it in prose.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {}
    }
    throw new AiError("Could not parse the AI response as JSON. Try again.");
  }
}

function normalize(data) {
  const strings = (arr) => (Array.isArray(arr) ? arr.map(String).filter(Boolean) : []);
  const score = Math.round(Number(data.score));
  if (!Number.isFinite(score)) throw new AiError("AI response is missing a numeric score");

  return {
    extractedName: String(data.extractedName || "").trim() || "—",
    cvScore: Math.min(100, Math.max(0, score)),
    summary: String(data.summary || ""),
    strengths: strings(data.strengths),
    weaknesses: strings(data.weaknesses),
    suggestedChecklist: (Array.isArray(data.suggestedChecklist) ? data.suggestedChecklist : [])
      .filter((i) => i && i.name)
      .map((i) => ({ name: String(i.name).trim(), reason: String(i.reason || "") })),
  };
}
