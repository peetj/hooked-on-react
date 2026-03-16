import { useEffect, useState } from "react";
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
