import { useAppContext } from "../context/AppContext.jsx";

const TABS = [
  {
    id: "home",
    label: "Home",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9z"
          stroke={active ? "var(--accent)" : "currentColor"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "maker",
    label: "Maker",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M5 11a7 7 0 0 1 14 0v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7z"
          stroke={active ? "var(--accent)" : "currentColor"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M9 7V4m3 3V3m3 4V4" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <rect x="3.5" y="5" width="17" height="15" rx="2" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="1.8" />
        <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <circle cx="12" cy="12" r="3" stroke={active ? "var(--accent)" : "currentColor"} strokeWidth="1.8" />
        <path
          d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.5a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.5a1.7 1.7 0 0 0 1-1.55V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.5a1.7 1.7 0 0 0 1.55 1H19.5a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"
          stroke={active ? "var(--accent)" : "currentColor"}
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
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-stretch border-t pb-[env(safe-area-inset-bottom)] backdrop-blur"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "color-mix(in srgb, var(--bg-card) 95%, transparent)" }}
      aria-label="Primary"
    >
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-all active:scale-90"
            style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}
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
