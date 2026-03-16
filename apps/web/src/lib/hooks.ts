import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { QuizStream, SessionMode } from "@react-quiz-1000/shared";
import type { AuthState, ThemeName, ArenaEffectsPalette, ArenaEffectsSettings } from "./types";

const DEFAULT_ARENA_EFFECTS: ArenaEffectsSettings = {
  intensity: 75,
  gridLineCount: 10,
  gridColorRange: 35,
  effectTransparency: 55,
  energyDotCount: 36,
  energyPalette: "classic"
};

export function useAuth(): [AuthState, (next: AuthState) => void, () => void] {
  const [auth, setAuth] = useState<AuthState>(() => {
    const raw = localStorage.getItem("rq_auth");
    if (!raw) return { token: null, user: null };
    try {
      return JSON.parse(raw) as AuthState;
    } catch {
      return { token: null, user: null };
    }
  });

  const set = (next: AuthState) => {
    setAuth(next);
    localStorage.setItem("rq_auth", JSON.stringify(next));
  };

  const clear = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem("rq_auth");
  };

  return [auth, set, clear];
}

export function useTheme(): [ThemeName, (next: ThemeName) => void] {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const raw = localStorage.getItem("rq_theme");
    return raw === "ember" || raw === "nova" || raw === "sunset" || raw === "circuit" || raw === "midnight" ? raw : "midnight";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const set = (next: ThemeName) => {
    setTheme(next);
    localStorage.setItem("rq_theme", next);
  };

  return [theme, set];
}

export function usePreferredStream(): [QuizStream, (next: QuizStream) => void] {
  const [stream, setStream] = useState<QuizStream>(() => {
    const raw = localStorage.getItem("rq_stream");
    return raw === "adaptive" || raw === "1" || raw === "2" || raw === "3" || raw === "4" || raw === "5" ? raw : "2";
  });

  const set = (next: QuizStream) => {
    setStream(next);
    localStorage.setItem("rq_stream", next);
  };

  return [stream, set];
}

export function useSessionMode(): [SessionMode, (next: SessionMode) => void] {
  const [mode, setMode] = useState<SessionMode>(() => {
    const raw = localStorage.getItem("rq_mode");
    return raw === "practice" ? "practice" : "ranked";
  });

  const set = (next: SessionMode) => {
    setMode(next);
    localStorage.setItem("rq_mode", next);
  };

  return [mode, set];
}

export function useArenaEffectsSettings(): [ArenaEffectsSettings, (next: ArenaEffectsSettings) => void] {
  const [settings, setSettings] = useState<ArenaEffectsSettings>(() => {
    const raw = localStorage.getItem("rq_arena_effects");
    if (!raw) return DEFAULT_ARENA_EFFECTS;

    try {
      return normalizeArenaEffects(JSON.parse(raw) as Partial<ArenaEffectsSettings>);
    } catch {
      return DEFAULT_ARENA_EFFECTS;
    }
  });

  const set = (next: ArenaEffectsSettings) => {
    const normalized = normalizeArenaEffects(next);
    setSettings(normalized);
    localStorage.setItem("rq_arena_effects", JSON.stringify(normalized));
  };

  return [settings, set];
}

export function useExclusiveDetailsMenu(ref: RefObject<HTMLDetailsElement | null>) {
  const menuIdRef = useRef(`shell-menu-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;

    const closeMenu = () => {
      if (!menu.open) return;
      menu.removeAttribute("open");
    };

    const onToggle = () => {
      if (!menu.open) return;
      window.dispatchEvent(
        new CustomEvent("shell-menu-open", {
          detail: { id: menuIdRef.current }
        })
      );
    };

    const onOtherMenuOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id === menuIdRef.current) return;
      closeMenu();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!menu.open) return;
      if (!(event.target instanceof Node) || menu.contains(event.target)) return;
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !menu.open) return;
      event.preventDefault();
      closeMenu();
      menu.querySelector<HTMLElement>("summary")?.focus();
    };

    menu.addEventListener("toggle", onToggle);
    window.addEventListener("shell-menu-open", onOtherMenuOpen as EventListener);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      menu.removeEventListener("toggle", onToggle);
      window.removeEventListener("shell-menu-open", onOtherMenuOpen as EventListener);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ref]);
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function isArenaEffectsPalette(value: unknown): value is ArenaEffectsPalette {
  return value === "classic" || value === "ember" || value === "nova" || value === "sunset" || value === "circuit";
}

function normalizeArenaEffects(settings: Partial<ArenaEffectsSettings>): ArenaEffectsSettings {
  return {
    intensity: clampNumber(settings.intensity, 0, 100, DEFAULT_ARENA_EFFECTS.intensity),
    gridLineCount: clampNumber(settings.gridLineCount, 4, 48, DEFAULT_ARENA_EFFECTS.gridLineCount),
    gridColorRange: clampNumber(settings.gridColorRange, 0, 100, DEFAULT_ARENA_EFFECTS.gridColorRange),
    effectTransparency: clampNumber(settings.effectTransparency, 0, 100, DEFAULT_ARENA_EFFECTS.effectTransparency),
    energyDotCount: clampNumber(settings.energyDotCount, 0, 180, DEFAULT_ARENA_EFFECTS.energyDotCount),
    energyPalette: isArenaEffectsPalette(settings.energyPalette) ? settings.energyPalette : DEFAULT_ARENA_EFFECTS.energyPalette
  };
}
