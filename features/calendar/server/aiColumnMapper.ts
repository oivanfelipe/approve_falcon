// AI-assisted column mapping for content-plan spreadsheet imports.
//
// This ONLY ever sees column header text, never cell content — the actual
// copy/caption text is always extracted verbatim from the spreadsheet by
// parseContentPlanSpreadsheet.ts, never generated or rewritten by the model.
// If the call fails for any reason, callers should treat it as "no mapping"
// and fall back to the deterministic header matcher's result.

export type ContentPlanField =
  | "planNumber"
  | "theme"
  | "format"
  | "product"
  | "weekHint"
  | "objective"
  | "artCopy"
  | "copyText";

const FIELD_DESCRIPTIONS: Record<ContentPlanField, string> = {
  planNumber: "a sequence/item number for the post (e.g. '01', '#5')",
  theme: "the post's topic/title/headline in a few words",
  format: "the content format, e.g. Carrossel, Estático, Reels, Stories",
  product: "which product or line this post is about",
  weekHint:
    "a fuzzy publish timing, e.g. 'week 1 of September' — NOT an exact calendar date",
  objective: "the marketing objective or funnel pillar for this post",
  artCopy:
    "the script/text that goes INSIDE the creative itself (capa, slide 2, slide 3...), written for a designer to execute",
  copyText:
    "the actual social caption and call-to-action text that accompanies the published post",
};

const SYSTEM_PROMPT = `You classify spreadsheet column headers for a social-media content-planning tool.
Given a list of column header strings, map each one to the single best-matching field key from this list, or null if none fit:
${Object.entries(FIELD_DESCRIPTIONS)
  .map(([k, d]) => `- "${k}": ${d}`)
  .join("\n")}

Rules:
- Respond with ONLY a JSON object: {"<header text exactly as given>": "<field key or null>", ...}
- Use each field key at most once. If two headers could match the same field, pick the better match and set the other to null.
- Never invent a field key that isn't in the list.`;

export interface AiColumnMapping {
  [headerText: string]: ContentPlanField | null;
}

export async function mapColumnsWithAI(
  headers: string[],
): Promise<AiColumnMapping | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || headers.length === 0) return null;

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const uniqueHeaders = Array.from(new Set(headers));

  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Headers:\n${JSON.stringify(uniqueHeaders)}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      console.error("Groq column-mapping request failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const validKeys = new Set(Object.keys(FIELD_DESCRIPTIONS));
    const usedKeys = new Set<string>();
    const mapping: AiColumnMapping = {};

    for (const header of uniqueHeaders) {
      const value = parsed[header];
      if (
        typeof value === "string" &&
        validKeys.has(value) &&
        !usedKeys.has(value)
      ) {
        mapping[header] = value as ContentPlanField;
        usedKeys.add(value);
      } else {
        mapping[header] = null;
      }
    }

    return mapping;
  } catch (err) {
    console.error("Groq column-mapping call failed:", err);
    return null;
  }
}
