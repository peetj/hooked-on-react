import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { QuizStream, SessionMode } from "@react-quiz-1000/shared";
import type { AuthState, ThemeName } from "./types";

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
