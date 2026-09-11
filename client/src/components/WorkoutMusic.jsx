import { useEffect, useState } from "react";

const STORAGE_KEY = "smartbite_spotify_link";
const SPOTIFY_URL_PATTERN = /open\.spotify\.com\/(playlist|album|track|artist|show|episode)\/([a-zA-Z0-9]+)/;

function parseSpotifyLink(link) {
  const match = link.match(SPOTIFY_URL_PATTERN);
  if (!match) return null;
  const [, type, id] = match;
  return { type, id };
}

const EMBED_HEIGHT = { track: 152, episode: 152, playlist: 152, album: 152, artist: 352, show: 352 };

export default function WorkoutMusic() {
  const [link, setLink] = useState("");
  const [embed, setEmbed] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseSpotifyLink(saved);
      if (parsed) {
        setLink(saved);
        setEmbed(parsed);
      }
    }
  }, []);

  function handleSave() {
    const trimmed = link.trim();
    const parsed = parseSpotifyLink(trimmed);
    if (!parsed) {
      setError("That doesn't look like a Spotify link. Copy one via Share > Copy Link in Spotify.");
      return;
    }
    setError(null);
    setEmbed(parsed);
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // localStorage may be unavailable (private browsing) — embed still works this session.
    }
  }

  function handleClear() {
    setLink("");
    setEmbed(null);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <section className="card-enter rounded-2xl border border-white/10 bg-white/[0.03] p-4" style={{ "--delay": "40ms" }}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Workout music</h2>
        {embed && (
          <button type="button" onClick={handleClear} className="text-xs text-white/40 underline underline-offset-2">
            Change
          </button>
        )}
      </div>

      {!embed && (
        <>
          <p className="mt-1 text-xs text-white/40">Paste a Spotify playlist, album, or track link.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="input flex-1"
            />
            <button
              type="button"
              onClick={handleSave}
              className="glow-accent shrink-0 rounded-xl px-4 text-sm font-semibold transition-all active:scale-95"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              Add
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </>
      )}

      {embed && (
        <div className="mt-3 overflow-hidden rounded-xl">
          <iframe
            title="Spotify player"
            src={`https://open.spotify.com/embed/${embed.type}/${embed.id}?utm_source=generator&theme=0`}
            width="100%"
            height={EMBED_HEIGHT[embed.type] ?? 152}
            style={{ border: 0 }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}
    </section>
  );
}
