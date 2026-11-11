import { useAppContext } from "./context/AppContext.jsx";
import NavBar from "./components/NavBar.jsx";
import Logo from "./components/Logo.jsx";
import Home from "./components/tabs/Home.jsx";
import Maker from "./components/tabs/Maker.jsx";
import Calendar from "./components/tabs/Calendar.jsx";
import Settings from "./components/tabs/Settings.jsx";
import OnboardingQuiz from "./screens/OnboardingQuiz.jsx";

const TAB_COMPONENTS = {
  home: Home,
  maker: Maker,
  calendar: Calendar,
  settings: Settings,
};

const TAB_TITLES = {
  home: "Home",
  maker: "Maker",
  calendar: "Calendar",
  settings: "Settings",
};

export default function App() {
  const { activeTab, settings, settingsLoaded } = useAppContext();
  const ActiveTabComponent = TAB_COMPONENTS[activeTab] ?? Home;

  if (settingsLoaded && !settings.onboarding_completed) {
    return <OnboardingQuiz />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header
          className="sticky top-0 z-40 flex items-center justify-between border-b px-5 py-4 backdrop-blur"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "color-mix(in srgb, var(--bg-page) 92%, transparent)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
            >
              <Logo className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">SmartBite AI</p>
              <p className="mt-1 text-[11px] leading-none" style={{ color: "var(--text-secondary)" }}>
                {TAB_TITLES[activeTab]}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
          <ActiveTabComponent />
        </main>

        <NavBar />
      </div>
    </div>
  );
}
