import { useAppContext } from "../context/AppContext.jsx";

const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 8l8-5 8 5v11a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8z"
          stroke={active ? "#000000" : "currentColor"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="16.5" cy="7.5" r="3.4" fill={active ? "#000000" : "#9ca3af"} stroke="#ffffff" strokeWidth="1" />
        <path
          d="M15.1 7.5l1 1 1.8-1.9"
          stroke="#fff"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "workouts",
    label: "Workouts",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 9v6M2 10.5v3M22 10.5v3M20 9v6M7 12h10"
          stroke={active ? "#000000" : "currentColor"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect x="5" y="8" width="2.5" height="8" rx="0.8" fill={active ? "#000000" : "currentColor"} />
        <rect x="16.5" y="8" width="2.5" height="8" rx="0.8" fill={active ? "#000000" : "currentColor"} />
      </svg>
    ),
  },
  {
    id: "progress",
    label: "Progress",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M3 17l5-6 4 3 5-7 4 5"
          stroke={active ? "#000000" : "currentColor"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M3 21h18" stroke={active ? "#a855f7" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <circle cx="12" cy="12" r="3" stroke={active ? "#a855f7" : "currentColor"} strokeWidth="1.8" />
        <path
          d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.5a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.5a1.7 1.7 0 0 0 1-1.55V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.5a1.7 1.7 0 0 0 1.55 1H19.5a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"
          stroke={active ? "#000000" : "currentColor"}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function NavBar() {
  const { activeTab, setActiveTab } = useAppContext();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-stretch border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Primary"
    >
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              active ? "text-black" : "text-black/40"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {tab.icon(active)}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
