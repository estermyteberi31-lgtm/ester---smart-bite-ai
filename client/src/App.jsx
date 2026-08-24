import { useAppContext } from "./context/AppContext.jsx";
import NavBar from "./components/NavBar.jsx";
import Dashboard from "./components/tabs/Dashboard.jsx";
import Workouts from "./components/tabs/Workouts.jsx";
import Progress from "./components/tabs/Progress.jsx";
import Settings from "./components/tabs/Settings.jsx";

const TAB_COMPONENTS = {
  dashboard: Dashboard,
  workouts: Workouts,
  progress: Progress,
  settings: Settings,
};

const TAB_TITLES = {
  dashboard: "Dashboard",
  workouts: "Workouts",
  progress: "Progress",
  settings: "Settings",
};

export default function App() {
  const { activeTab } = useAppContext();
  const ActiveTabComponent = TAB_COMPONENTS[activeTab] ?? Dashboard;

  return (
    <div className="min-h-screen bg-[#0f0b1a] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0f0b1a]/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-sm font-bold">
              SB
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">SmartBite AI</p>
              <p className="text-[11px] leading-none text-white/40">{TAB_TITLES[activeTab]}</p>
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
