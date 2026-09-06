import { useAppContext } from "./context/AppContext.jsx";
import NavBar from "./components/NavBar.jsx";
import Logo from "./components/Logo.jsx";
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
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white">
              <Logo className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Myteberi</p>
              <p className="text-[11px] leading-none text-black/40">{TAB_TITLES[activeTab]}</p>
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
