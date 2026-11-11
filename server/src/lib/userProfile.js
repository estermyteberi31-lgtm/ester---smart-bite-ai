export function buildUserProfile(account) {
  const dietaryPreferences = JSON.parse(account.dietary_preferences || "[]");
  const parts = [
    account.name ? `Name: ${account.name}` : null,
    account.goal ? `Main goal: ${account.goal}` : null,
    account.eating_habits ? `Eating habits: ${account.eating_habits}` : null,
    account.obstacles ? `Biggest obstacle: ${account.obstacles}` : null,
    dietaryPreferences.length > 0 ? `Dietary preferences: ${dietaryPreferences.join(", ")}` : null,
    account.calorie_goal ? `Daily calorie goal: ${account.calorie_goal} kcal` : null,
    account.weekly_budget ? `Weekly grocery budget: £${account.weekly_budget}` : null,
    account.custom_notes && account.custom_notes.trim() ? `In their own words: "${account.custom_notes.trim()}"` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(". ") : null;
}
