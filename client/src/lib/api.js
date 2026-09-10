const BASE_URL = "/api";

async function handleResponse(res) {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (isJson && body?.error) || res.statusText || "Request failed";
    const error = new Error(message);
    error.detail = isJson ? body?.detail : body;
    error.status = res.status;
    throw error;
  }
  return body;
}

export async function scanImage({ file, chatMessage, gymMode }) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("chatMessage", chatMessage ?? "");
  formData.append("gymMode", gymMode ?? "home");
  const res = await fetch(`${BASE_URL}/scan`, { method: "POST", body: formData });
  return handleResponse(res);
}

export async function generateWorkout({ mode, style, profile }) {
  const res = await fetch(`${BASE_URL}/workout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, style, profile }),
  });
  return handleResponse(res);
}

export async function completeWorkout(workout) {
  const res = await fetch(`${BASE_URL}/workout/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workout),
  });
  return handleResponse(res);
}

export async function fetchWorkoutHistory() {
  const res = await fetch(`${BASE_URL}/workout/history`);
  return handleResponse(res);
}

export async function logHydrationClick() {
  const res = await fetch(`${BASE_URL}/progress/hydration`, { method: "POST" });
  return handleResponse(res);
}

export async function fetchHydrationToday() {
  const res = await fetch(`${BASE_URL}/progress/hydration/today`);
  return handleResponse(res);
}

export async function fetchProgressSeries(days = 14) {
  const res = await fetch(`${BASE_URL}/progress/series?days=${days}`);
  return handleResponse(res);
}

export async function fetchBudget() {
  const res = await fetch(`${BASE_URL}/progress/budget`);
  return handleResponse(res);
}

export async function fetchStreak() {
  const res = await fetch(`${BASE_URL}/progress/streak`);
  return handleResponse(res);
}

export async function fetchSettings() {
  const res = await fetch(`${BASE_URL}/settings`);
  return handleResponse(res);
}

export async function updateSettings(payload) {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchMealPlan() {
  const res = await fetch(`${BASE_URL}/meal-plan`);
  return handleResponse(res);
}

export async function generateMealPlan({ calorieGoal, weeklyBudget, dietaryPreferences }) {
  const res = await fetch(`${BASE_URL}/meal-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calorieGoal, weeklyBudget, dietaryPreferences }),
  });
  return handleResponse(res);
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse(res);
}
