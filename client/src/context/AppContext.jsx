import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchSettings,
  updateSettings as apiUpdateSettings,
  fetchHydrationToday,
  logHydrationClick as apiLogHydration,
  fetchProgressSeries,
  fetchWorkoutHistory,
  fetchStreak,
} from "../lib/api.js";
import { applyAccentColor } from "../lib/colors.js";

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
  name: "SmartBite User",
  email: "",
  plan: "Free",
  dietary_preferences: [],
  calorie_goal: 2200,
  weekly_budget: 60,
  preferred_gym_mode: "home",
  accent_color: "purple",
};

const DEFAULT_STREAK = { currentStreak: 0, unlockAt: 7, colorsUnlocked: false };

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [gymMode, setGymMode] = useState("home");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrationToday, setHydrationToday] = useState(0);
  const [progressSeries, setProgressSeries] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [streak, setStreak] = useState(DEFAULT_STREAK);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
      setGymMode(data.preferred_gym_mode === "gym" ? "gym" : "home");
      applyAccentColor(data.accent_color);
    } catch {
      // Keep defaults if the backend/db isn't reachable yet.
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  const refreshStreak = useCallback(async () => {
    try {
      const data = await fetchStreak();
      setStreak(data);
    } catch {
      // ignore
    }
  }, []);

  const saveSettings = useCallback(async (payload) => {
    const updated = await apiUpdateSettings(payload);
    setSettings(updated);
    applyAccentColor(updated.accent_color);
    return updated;
  }, []);

  const refreshHydration = useCallback(async () => {
    try {
      const { todayCount } = await fetchHydrationToday();
      setHydrationToday(todayCount);
    } catch {
      // ignore
    }
  }, []);

  const logHydration = useCallback(async () => {
    const { todayCount } = await apiLogHydration();
    setHydrationToday(todayCount);
    return todayCount;
  }, []);

  const refreshProgressSeries = useCallback(async (days = 14) => {
    try {
      const { series } = await fetchProgressSeries(days);
      setProgressSeries(series);
    } catch {
      // ignore
    }
  }, []);

  const refreshWorkoutHistory = useCallback(async () => {
    try {
      const history = await fetchWorkoutHistory();
      setWorkoutHistory(history);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshHydration();
    refreshProgressSeries();
    refreshWorkoutHistory();
    refreshStreak();
  }, [refreshSettings, refreshHydration, refreshProgressSeries, refreshWorkoutHistory, refreshStreak]);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      gymMode,
      setGymMode,
      settings,
      settingsLoaded,
      saveSettings,
      refreshSettings,
      hydrationToday,
      logHydration,
      refreshHydration,
      progressSeries,
      refreshProgressSeries,
      workoutHistory,
      refreshWorkoutHistory,
      streak,
      refreshStreak,
    }),
    [
      activeTab,
      gymMode,
      settings,
      settingsLoaded,
      saveSettings,
      refreshSettings,
      hydrationToday,
      logHydration,
      refreshHydration,
      progressSeries,
      refreshProgressSeries,
      workoutHistory,
      refreshWorkoutHistory,
      streak,
      refreshStreak,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
}
