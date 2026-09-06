import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

let client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function isAnthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Pulls the first valid JSON object out of a Claude text response, tolerating
 * markdown code fences or stray prose the model may wrap the JSON in.
 */
export function extractJson(text) {
  if (!text) throw new Error("Empty response from model");
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Sends a food/grocery receipt photo to Claude and asks for a structured
 * nutrition + price-comparison breakdown.
 */
export async function analyzeFoodImage({ base64Image, mediaType, chatMessage, gymMode }) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server");
  }

  const gymContext =
    gymMode === "gym"
      ? "The user is in Gym Mode and training with full equipment access, so lean into higher protein targets and performance framing."
      : "The user is in Home Mode with bodyweight-only training, so keep recommendations practical for everyday home meals.";

  const userNote = chatMessage && chatMessage.trim().length > 0
    ? `The user added this note about the photo: "${chatMessage.trim()}"`
    : "The user did not add any extra note.";

  const systemPrompt = `You are the SmartBite AI vision engine. You analyze photos of meals, groceries, or
receipts and return ONLY a single JSON object (no prose, no markdown fences) matching exactly this shape:

{
  "items": [
    { "name": string, "quantity": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }
  ],
  "totals": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number },
  "nutrition_score": number,       // 0-100 overall healthiness score for what was scanned
  "macro_split": { "protein_pct": number, "carbs_pct": number, "fat_pct": number },
  "price_comparison": [
    { "item": string, "tesco_price": number, "aldi_price": number, "cheaper_store": "Tesco" | "Aldi", "savings": number }
  ],
  "estimated_total_savings": number,
  "insight": string,               // one short actionable sentence
  "currency": "GBP"
}

Base every number on what is actually visible in the image. Use realistic UK supermarket pricing in GBP for
Tesco and Aldi when estimating price_comparison. If the image is a meal (not a receipt), still populate
price_comparison with plausible per-ingredient UK grocery prices. Never return placeholder or zeroed-out
values unless the image truly shows nothing edible, in which case set items to an empty array and explain
why in "insight".`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image },
          },
          {
            type: "text",
            text: `${gymContext}\n${userNote}\nAnalyze this photo and return the JSON object described in your instructions.`,
          },
        ],
      },
    ],
  });

  const text = response.content.find((block) => block.type === "text")?.text ?? "";
  return extractJson(text);
}

/**
 * Asks Claude for a structured workout routine tailored to gym/home mode,
 * a target style, and the user's profile.
 */
export async function generateWorkout({ mode, style, profile }) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server");
  }

  const equipmentContext =
    mode === "gym"
      ? "Full commercial gym equipment is available: barbells, dumbbells, machines, cable stations, benches."
      : "No equipment is available. Bodyweight-only exercises, optionally using a chair, wall, or floor space at home.";

  const systemPrompt = `You are the SmartBite AI workout engine. Return ONLY a single JSON object (no prose,
no markdown fences) matching exactly this shape:

{
  "title": string,             // punchy workout title, e.g. "Home Bodyweight Power Circuit"
  "focus_phrase": string,      // one motivating sentence describing today's fitness focus
  "mode": "gym" | "home",
  "style": string,
  "estimated_duration_minutes": number,
  "estimated_calories_burned": number,
  "steps": [
    { "name": string, "sets": number, "reps": string, "form_tip": string }
  ]
}

"steps" must contain exactly 4 exercises appropriate for the given equipment mode and workout style.
"reps" can be a rep count ("12") or a duration ("30 sec"). Keep form_tip concise (one sentence, safety-focused).`;

  const userPrompt = `Equipment mode: ${mode === "gym" ? "Gym Mode (Full Equipment)" : "Home Mode (No Equipment / Bodyweight)"}
${equipmentContext}
Requested workout style: ${style}
User profile: ${JSON.stringify(profile ?? {})}

Generate today's workout as the JSON object described in your instructions.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content.find((block) => block.type === "text")?.text ?? "";
  return extractJson(text);
}
