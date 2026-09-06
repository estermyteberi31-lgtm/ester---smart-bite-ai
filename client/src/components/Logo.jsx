export default function Logo({ className = "h-6 w-6", color = "var(--accent)" }) {
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true">
      <path
        d="M73,85 C103,65 143,57 183,63 C198,65 208,70 211,77 C203,75 188,73 173,75 C133,79 98,87 75,97 Z"
        fill={color}
      />
      <path
        d="M58,125 Q125,93 193,120 Q125,153 58,125 Z"
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <circle cx="128" cy="123" r="18" fill={color} />
      <path d="M119,145 C119,160 123,175 128,183 C133,175 137,160 137,145 Z" fill={color} />
      <path
        d="M58,125 C41,135 31,143 31,153 C31,161 37,165 43,161"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
