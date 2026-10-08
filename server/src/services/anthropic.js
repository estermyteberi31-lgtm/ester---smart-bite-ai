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
  "estimated_prices": [
    { "item": string, "price_low": number, "price_high": number }
  ],
  "estimated_total_low": number,
  "estimated_total_high": number,
  "insight": string,               // one short actionable sentence
  "currency": "GBP"
}

Base every number on what is actually visible in the image. Use realistic UK grocery pricing in GBP when
estimating estimated_prices — a plausible low-high range per item (price_high should be realistically
higher than price_low, not identical), not a comparison between specific supermarkets (you don't have
real-time pricing, so never claim one named store is cheaper than another). If the image is a meal (not
a receipt), still populate estimated_prices with plausible per-ingredient UK grocery price ranges. Never
return placeholder or zeroed-out values unless the image truly shows nothing edible, in which case set
items to an empty array and explain why in "insight".`;

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

/**
 * Builds a 7-day meal plan that fits both the user's calorie goal and their
 * weekly grocery budget, using UK Tesco/Aldi pricing like the scan engine.
 */
export async function generateMealPlan({ calorieGoal, weeklyBudget, dietaryPreferences, weeklyNotes }) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server");
  }

  const systemPrompt = `You are the SmartBite AI meal planning engine. Return ONLY a single JSON object
(no prose, no markdown fences) matching exactly this shape:

{
  "days": [
    {
      "day": string,              // e.g. "Monday"
      "meals": [
        { "type": "Breakfast" | "Lunch" | "Dinner", "name": string, "calories": number, "cost_low": number, "cost_high": number }
      ]
    }
  ],
  "shopping_list": [
    { "item": string, "quantity": string, "price_low": number, "price_high": number }
  ],
  "total_estimated_low": number,    // sum of shopping_list price_low, in GBP
  "total_estimated_high": number,   // sum of shopping_list price_high, in GBP
  "average_daily_calories": number,
  "insight": string,                // one short sentence on how well this plan fits the goal + budget
  "currency": "GBP"
}

"days" must contain exactly 7 entries (Monday through Sunday), each with exactly 3 meals
(Breakfast, Lunch, Dinner). "shopping_list" must consolidate the actual ingredients needed across the
whole week into one buyable grocery list (e.g. "Chicken breast" with quantity "1kg", not repeated per
meal) — combine duplicate ingredients across meals into a single line with a total quantity. Use
realistic UK grocery pricing in GBP as a plausible low-high range per item (price_high meaningfully
higher than price_low), not a comparison between named supermarkets (you don't have real-time pricing,
so never claim one store is cheaper than another). Every day's total calories should land close
to the user's daily calorie goal, and total_estimated_high should stay at or under their weekly budget
whenever realistically possible — if it truly can't be done, get as close as possible and say so plainly
in "insight". Respect every listed dietary preference strictly (never suggest a non-vegetarian meal for
a vegetarian, etc). Vary meals across the week rather than repeating the same dishes.`;

  const userPrompt = `Daily calorie goal: ${calorieGoal} kcal
Weekly grocery budget: £${weeklyBudget}
Dietary preferences: ${
    Array.isArray(dietaryPreferences) && dietaryPreferences.length > 0
      ? dietaryPreferences.join(", ")
      : "None specified"
  }
${weeklyNotes && weeklyNotes.trim() ? `What the user said about this week: "${weeklyNotes.trim()}" — factor this in (e.g. travel, events, cravings, how much time they have to cook).` : ""}

Generate this week's meal plan as the JSON object described in your instructions.`;

  const mealPlanResponse = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4800,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const mealPlanText = mealPlanResponse.content.find((block) => block.type === "text")?.text ?? "";
  return extractJson(mealPlanText);
}

const buildNutritionSystemPrompt = (userProfile) => `You are a nutrition assistant inside SmartBite AI.
You only discuss food, diet, nutrition, meal planning, and calories.
If asked about anything unrelated to food or nutrition, politely say
you only know about nutrition and redirect the conversation.

Keep replies short — a few sentences at most, not a wall of text. If you greet the user, keep it
generic ("Hi!", "Hope you're having a good one") — never guess the time of day ("good morning",
"good evening"), since you don't actually know what time it is for them. Words like breakfast, lunch,
and dinner are fine when talking about meals specifically — that's not a time-of-day guess.

Here is what the user has told you about themselves:
${userProfile || "The user hasn't added any personal info yet."}

Use this to personalise every response. Be conversational but accurate.`;

/**
 * Plain-text conversational reply from the nutrition-only chat assistant.
 * `messages` is the full running conversation, oldest first, each
 * { role: "user" | "assistant", content: string }.
 */
export async function chatWithNutritionAssistant({ messages, userProfile }) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server");
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: buildNutritionSystemPrompt(userProfile),
    messages: messages.map((message) => ({ role: message.role, content: message.content })),
  });

  return response.content.find((block) => block.type === "text")?.text ?? "";
}

/**
 * Vision-capable reply from the same nutrition-only chat assistant: the user
 * sends a food photo (optionally with a caption) and gets a conversational
 * answer, personalised the same way as the text-only chat. `history` is the
 * prior plain-text turns; the new image turn is appended after it.
 */
export async function chatWithNutritionAssistantAboutImage({
  base64Image,
  mediaType,
  caption,
  history,
  userProfile,
}) {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server");
  }

  const imageMessage = {
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
      {
        type: "text",
        text: caption && caption.trim().length > 0 ? caption.trim() : "What is this food, and what are the rough calories and macros?",
      },
    ],
  };

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: buildNutritionSystemPrompt(userProfile),
    messages: [...(history ?? []).map((message) => ({ role: message.role, content: message.content })), imageMessage],
  });

  return response.content.find((block) => block.type === "text")?.text ?? "";
}
