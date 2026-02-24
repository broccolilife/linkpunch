"use client";

import { useCallback, useEffect, useState } from "react";

export interface ThemeConfig {
  background: string;
  accent: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
}

const presets: Record<string, ThemeConfig> = {
  "Midnight (Default)": {
    background: "#0a0a0a",
    accent: "#34d399",
    cardBg: "rgba(255,255,255,0.05)",
    textPrimary: "#ffffff",
    textSecondary: "rgba(255,255,255,0.6)"
  },
  "Ocean Blue": {
    background: "#0c1929",
    accent: "#38bdf8",
    cardBg: "rgba(56,189,248,0.08)",
    textPrimary: "#e0f2fe",
    textSecondary: "rgba(224,242,254,0.6)"
  },
  "Sunset Warm": {
    background: "#1a0a0a",
    accent: "#fb923c",
    cardBg: "rgba(251,146,60,0.08)",
    textPrimary: "#fff7ed",
    textSecondary: "rgba(255,247,237,0.6)"
  },
  "Forest Green": {
    background: "#0a1a0f",
    accent: "#4ade80",
    cardBg: "rgba(74,222,128,0.08)",
    textPrimary: "#f0fdf4",
    textSecondary: "rgba(240,253,244,0.6)"
  },
  "Royal Purple": {
    background: "#0f0a1a",
    accent: "#c084fc",
    cardBg: "rgba(192,132,252,0.08)",
    textPrimary: "#faf5ff",
    textSecondary: "rgba(250,245,255,0.6)"
  },
  "Rose Pink": {
    background: "#1a0a12",
    accent: "#fb7185",
    cardBg: "rgba(251,113,133,0.08)",
    textPrimary: "#fff1f2",
    textSecondary: "rgba(255,241,242,0.6)"
  }
};

const STORAGE_KEY = "aerolinks_theme";

function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty("--theme-bg", theme.background);
  root.style.setProperty("--theme-accent", theme.accent);
  root.style.setProperty("--theme-card-bg", theme.cardBg);
  root.style.setProperty("--theme-text-primary", theme.textPrimary);
  root.style.setProperty("--theme-text-secondary", theme.textSecondary);
  root.style.backgroundColor = theme.background;
}

export function useTheme() {
  const [themeName, setThemeName] = useState("Midnight (Default)");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && presets[saved]) {
      setThemeName(saved);
      applyTheme(presets[saved]);
    }
  }, []);

  const selectTheme = useCallback((name: string) => {
    const theme = presets[name];
    if (!theme) return;
    setThemeName(name);
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, name);
  }, []);

  return { themeName, selectTheme, presets };
}

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeCustomizer({ isOpen, onClose }: ThemeCustomizerProps) {
  const { themeName, selectTheme, presets: themePresets } = useTheme();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Theme Customizer</h2>
            <p className="text-sm text-white/60">Pick a color palette for your page.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Close
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {Object.entries(themePresets).map(([name, theme]) => {
            const isActive = name === themeName;
            return (
              <button
                key={name}
                type="button"
                onClick={() => selectTheme(name)}
                className={[
                  "relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition",
                  isActive
                    ? "border-emerald-400/60 bg-emerald-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                ].join(" ")}
              >
                <div className="flex gap-2">
                  <span
                    className="h-6 w-6 rounded-full border border-white/20"
                    style={{ backgroundColor: theme.background }}
                  />
                  <span
                    className="h-6 w-6 rounded-full border border-white/20"
                    style={{ backgroundColor: theme.accent }}
                  />
                </div>
                <span className="text-sm font-semibold">{name}</span>
                {isActive ? (
                  <span className="absolute right-3 top-3 text-xs text-emerald-300">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
