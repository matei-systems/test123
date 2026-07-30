// Zentrale Icon-Registry für Stempel: dieselben Vektor-Pfade (24x24 Viewbox,
// gefüllte Silhouetten statt Emoji) werden sowohl im Web-Kartenpreview
// (components/WalletCard.tsx, als Inline-SVG) als auch beim serverseitigen
// Zusammensetzen der Apple-/Google-Wallet-Kartenbilder (lib/card-render.ts,
// als Path2D auf Canvas) verwendet. So sehen Web-Karte und Wallet-Pässe
// immer exakt gleich aus, und beide Renderer profitieren automatisch, wenn
// hier ein neues Icon ergänzt wird - kein Emoji-Font nötig (unzuverlässig in
// einer serverseitigen Node-Canvas-Umgebung ohne Emoji-Schriftart).
export interface StampIconDef {
  key: string;
  label: string;
  path: string;
}

export const STAMP_ICON_PRESETS: StampIconDef[] = [
  { key: "check", label: "Häkchen", path: "M9.6 16.2 4.8 11.5 3.4 12.9 9.6 19 20.7 7.8 19.3 6.4Z" },
  {
    key: "coffee",
    label: "Kaffee",
    path:
      "M6 8h10v7a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V8ZM17 9a3 3 0 0 1 0 6h-1.2v-2H17a1 1 0 0 0 0-2h-1.2V9H17ZM8.7 5.2c.7-.9.7-1.4 0-2.4l1.4-.9c1.1 1.5 1.1 2.7 0 4.2l-1.4-.9ZM12.7 5.2c.7-.9.7-1.4 0-2.4l1.4-.9c1.1 1.5 1.1 2.7 0 4.2l-1.4-.9Z",
  },
  {
    key: "star",
    label: "Stern",
    path: "M12 2.5 14.9 8.8 21.8 9.4 16.6 14.1 18.2 20.9 12 17.6 5.8 20.9 7.4 14.1 2.2 9.4 9.1 8.8Z",
  },
  {
    key: "heart",
    label: "Herz",
    path: "M12 20s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 5.5 5.5 5.5 0 0 1 21.5 11c-2.5 4.4-9.5 9-9.5 9Z",
  },
  {
    key: "scissors",
    label: "Schere",
    path:
      "M6.5 5.3a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6ZM6.5 14.1a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6ZM8.4 8.1 19.6 18.7h-3l-9.7-9.2ZM8.4 15.9 19.6 5.3h-3l-9.7 9.2Z",
  },
  { key: "bolt", label: "Blitz", path: "M13 2 4.5 13.2h5.7L9 22l9.5-11.8h-5.9Z" },
  {
    key: "gift",
    label: "Geschenk",
    path:
      "M4 9h16v11H4Zm0-2h16v3H4Zm7-1h2v14h-2ZM8.2 6c-1.3-.1-2.2-1-2.2-2.3C6 2.5 6.9 2 7.9 2c1.4 0 2.6 1.4 3.6 3.2C10.1 5.9 8.9 6.1 8.2 6ZM15.8 6c1.3-.1 2.2-1 2.2-2.3C18 2.5 17.1 2 16.1 2c-1.4 0-2.6 1.4-3.6 3.2 1.4.7 2.6.9 3.3.8Z",
  },
  {
    key: "drop",
    label: "Tropfen",
    path: "M12 3s7 7.9 7 12.3A7 7 0 0 1 5 15.3C5 10.9 12 3 12 3Z",
  },
  {
    key: "dumbbell",
    label: "Fitness",
    path: "M2.5 10.5h2v3h-2ZM19.5 10.5h2v3h-2ZM5 8.5h2.2v7H5ZM16.8 8.5H19v7h-2.2ZM7.5 11h9v2h-9Z",
  },
  {
    key: "sparkle",
    label: "Beauty",
    path: "M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z",
  },
];

export const DEFAULT_STAMP_ICON_KEY = "check";

export function stampIconPath(key: string | undefined | null): string {
  return STAMP_ICON_PRESETS.find((i) => i.key === key)?.path ?? STAMP_ICON_PRESETS[0].path;
}

// Migriert alte, vor P11 gespeicherte Emoji-Werte (design.stampIcon) auf den
// nächstliegenden neuen Icon-Key, damit vorhandene Programme nicht plötzlich
// ohne (oder mit falschem) Icon dastehen.
const LEGACY_EMOJI_MAP: Record<string, string> = {
  "✓": "check",
  "★": "star",
  "☕": "coffee",
  "❤": "heart",
  "⚡": "bolt",
  "🎁": "gift",
};

export function resolveStampIconKey(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return DEFAULT_STAMP_ICON_KEY;
  if (STAMP_ICON_PRESETS.some((i) => i.key === raw)) return raw;
  return LEGACY_EMOJI_MAP[raw] ?? DEFAULT_STAMP_ICON_KEY;
}
