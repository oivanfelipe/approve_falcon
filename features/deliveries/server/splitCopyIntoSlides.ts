// Splits a pasted block of "copy da arte" into labelled slides ("Slide 1:",
// "Slide 2:"…) in the format ArtCopyMockup already parses.
//
// Same rule as aiColumnMapper: the model only decides WHERE the slide breaks
// go. The words themselves are never rewritten — the result is validated
// against the original text and thrown away if a single word changed, in
// which case a deterministic paragraph-based split is used instead.

const SYSTEM_PROMPT = `You split the text of a social-media carousel into slides.
The text is written in Portuguese for a designer: the cover (capa) comes first, then each following slide.

Rules:
- Do NOT rewrite, translate, summarize, fix or reorder any word. Only decide where each slide starts and ends.
- Every word of the input must appear exactly once in the output, in the original order.
- Respond with ONLY a JSON object: {"slides": ["<text of slide 1>", "<text of slide 2>", ...]}
- Keep line breaks inside a slide as "\\n".
- If the text already has markers like "Slide 1:" or "Capa:", keep one slide per marker and drop the marker text from the slide body.`;

export type SplitSlidesResult = {
  text: string;
  /** "ai" when the model split it, "paragraphs" when the fallback did. */
  method: "ai" | "paragraphs";
};

const MARKER_PREFIX = /^\s*(slide\s*\d*|capa|cena\s*\d*)\s*[:—-]\s*/i;

function words(text: string): string[] {
  return text
    .replace(MARKER_PREFIX, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function formatSlides(slides: string[]): string {
  return slides
    .map((body, i) => `Slide ${i + 1}:\n${body.trim()}`)
    .join("\n\n");
}

/** Blank-line paragraphs become slides. Single block → single slide. */
function splitByParagraphs(input: string): string[] {
  return input
    .split(/\n\s*\n/)
    .map((block) => block.trim().replace(MARKER_PREFIX, "").trim())
    .filter(Boolean);
}

export async function splitCopyIntoSlides(
  input: string,
): Promise<SplitSlidesResult> {
  const clean = input.trim();
  const fallback = (): SplitSlidesResult => ({
    text: formatSlides(splitByParagraphs(clean)),
    method: "paragraphs",
  });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !clean) return fallback();

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: clean },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error("Groq slide-split request failed:", res.status);
      return fallback();
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return fallback();

    const parsed = JSON.parse(content) as { slides?: unknown };
    if (
      !Array.isArray(parsed.slides) ||
      parsed.slides.length === 0 ||
      !parsed.slides.every((s) => typeof s === "string" && s.trim())
    ) {
      return fallback();
    }

    const slides = (parsed.slides as string[]).map((s) =>
      s.trim().replace(MARKER_PREFIX, "").trim(),
    );

    // The model may only move breaks, never touch words.
    const before = words(clean.replace(/^\s*(slide\s*\d*|capa|cena\s*\d*)\s*[:—-]\s*/gim, ""));
    const after = slides.flatMap(words);
    if (
      before.length !== after.length ||
      before.some((w, i) => w !== after[i])
    ) {
      return fallback();
    }

    return { text: formatSlides(slides), method: "ai" };
  } catch (err) {
    console.error("Groq slide-split call failed:", err);
    return fallback();
  }
}
