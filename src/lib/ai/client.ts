/**
 * Multi-Provider AI LLM Client with Automatic Rate-Limit Failover Cascade
 * Strictly configured with 100% FREE active models:
 * 1. Google Gemini: gemini-3.5-flash (Free Tier)
 * 2. Groq Cloud: qwen/qwen3.6-27b (Free Tier)
 * 3. OpenRouter: nvidia/nemotron-3.5-lightning:free (100% Free Tier)
 *
 * If one provider is rate-limited (429) or errors, it instantly cascades to the next.
 */

interface GenerateJsonOptions {
  systemPrompt: string;
  userPrompt: string;
  fallbackData: any;
}

function cleanAndParseJson<T = any>(raw: string): T {
  // Strip out any <think> reasoning tags from models
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned) as T;
}

export async function generateStructuredAIJson<T = any>({
  systemPrompt,
  userPrompt,
  fallbackData,
}: GenerateJsonOptions): Promise<T> {
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    (process.env.AI_API_KEY?.startsWith('AIza') ? process.env.AI_API_KEY : '');

  const groqKey =
    process.env.GROQ_API_KEY ||
    (process.env.AI_API_KEY?.startsWith('gsk_') ? process.env.AI_API_KEY : '');

  const openRouterKey =
    process.env.OPENROUTER_API_KEY ||
    (process.env.AI_API_KEY?.startsWith('sk-or-') ? process.env.AI_API_KEY : '');

  const openAiKey =
    process.env.OPENAI_API_KEY ||
    (process.env.AI_API_KEY?.startsWith('sk-') && !process.env.AI_API_KEY.startsWith('sk-or-')
      ? process.env.AI_API_KEY
      : '');

  // ─── STAGE 1: GOOGLE GEMINI (gemini-3.5-flash - Free Tier) ───
  if (geminiKey) {
    const geminiModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    for (const model of geminiModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nStrict JSON Request:\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            return cleanAndParseJson<T>(rawText);
          }
        } else {
          console.warn(`[AI Failover] Gemini model ${model} status ${res.status}. Trying next...`);
        }
      } catch (err) {
        console.warn(`[AI Failover] Gemini ${model} error, trying next...`, err);
      }
    }
  }

  // ─── STAGE 2: GROQ CLOUD (qwen/qwen3.6-27b - Free Tier) ───
  if (groqKey) {
    const groqModels = ['qwen/qwen3.6-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
    for (const model of groqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: `${systemPrompt} Return strictly raw valid JSON.` },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            return cleanAndParseJson<T>(content);
          }
        } else {
          console.warn(`[AI Failover] Groq model ${model} status ${res.status}. Trying next...`);
        }
      } catch (err) {
        console.warn(`[AI Failover] Groq ${model} error, trying next...`, err);
      }
    }
  }

  // ─── STAGE 3: OPENROUTER (nvidia/nemotron-3.5-lightning:free - Free Tier) ───
  if (openRouterKey) {
    const openRouterModels = [
      'nvidia/nemotron-3.5-lightning:free',
      'inclusionai/ling-3.0-flash-fin:free',
      'liquid/lfm-2.5-2.6b:free',
    ];
    for (const model of openRouterModels) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://maina.audio',
            'X-Title': 'Maina Music Streaming',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: `${systemPrompt} Return strictly raw valid JSON.` },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            return cleanAndParseJson<T>(content);
          }
        } else {
          console.warn(`[AI Failover] OpenRouter model ${model} status ${res.status}. Trying next...`);
        }
      } catch (err) {
        console.warn(`[AI Failover] OpenRouter ${model} error, trying next...`, err);
      }
    }
  }

  // ─── STAGE 4: OPENAI (Optional if user provides it) ───
  if (openAiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `${systemPrompt} Output strictly valid JSON.` },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          return cleanAndParseJson<T>(content);
        }
      }
    } catch (err) {
      console.warn('[AI Failover] OpenAI call failed, using heuristic fallback...', err);
    }
  }

  // ─── STAGE 5: RESILIENT HEURISTIC FALLBACK ───
  return fallbackData as T;
}
