import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchSettings,
  updateSettings as apiUpdateSettings,
  fetchHydrationToday,
  logHydrationClick as apiLogHydration,
  fetchProgressSeries,
  fetchWorkoutHistory,
} from "../lib/api.js";

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
  name: "Myteberi User",
  email: "",
  plan: "Free",
  dietary_preferences: [],
  calorie_goal: 2200,
  weekly_budget: 60,
  preferred_gym_mode: "home",
};

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [gymMode, setGymMode] = useState("home");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrationToday, setHydrationToday] = useState(0);
  const [progressSeries, setProgressSeries] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
      setGymMode(data.preferred_gym_mode === "gym" ? "gym" : "home");
    } catch {
      // Keep defaults if the backend/db isn't reachable yet.
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  const saveSettings = useCallback(async (payload) => {
    const updated = await apiUpdateSettings(payload);
    setSettings(updated);
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
  }, [refreshSettings, refreshHydration, refreshProgressSeries, refreshWorkoutHistory]);

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
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within an AppProvider");
  return ctx;
}
