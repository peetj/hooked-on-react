import { useEffect, useRef } from "react";
import type { QuizStream, SessionMode } from "@react-quiz-1000/shared";
import arenaCssRaw from "../assets/arena/react-quest-arena-v2.css?raw";
import arenaMarkupRaw from "../assets/arena/react-quest-arena-v2.body.html?raw";

type Props = {
  selectedStream: QuizStream;
  sessionMode: SessionMode;
  busy: boolean;
  onSelectStream: (next: QuizStream) => void;
  onStartTimed: () => void | Promise<void>;
  onStartLearn: () => void | Promise<void>;
  onOpenLeaderboard: () => void;
  onOpenSocial: () => void;
};

type LiveCallbacks = {
  selectedStream: QuizStream;
  sessionMode: SessionMode;
  busy: boolean;
  onSelectStream: (next: QuizStream) => void;
  onStartTimed: () => void | Promise<void>;
  onStartLearn: () => void | Promise<void>;
  onOpenLeaderboard: () => void;
  onOpenSocial: () => void;
};

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700;900&family=Orbitron:wght@400;600;700;900&family=Exo+2:ital,wght@0,300;0,400;0,600;0,700;0,900;1,400&display=swap";

const POSTER_STREAMS: QuizStream[] = ["1", "2", "3"];

const PARTICLE_CONFIGS = [
  { color: "#f0a500", size: 2 },
  { color: "#ffd166", size: 1.5 },
  { color: "#c060ff", size: 2 },
  { color: "#9060f0", size: 1.5 },
  { color: "#ff8020", size: 1.5 },
  { color: "#ffe090", size: 1 }
] as const;

const ARENA_MARKUP = arenaMarkupRaw
  .replace(/<div class="feedback-tab">[\s\S]*?<\/div>/, "")
  .replace(/\s+onclick="ripple\(event,this\)"/g, "")
  .replace(/Â·/g, "·")
  .replace(/â—†/g, "◆")
  .replace(/â¬¡/g, "□");

const ARENA_CSS = [
  ":host { display: block; width: 100%; }",
  ".arena-shell { position: relative; min-height: 100vh; }",
  arenaCssRaw.replace(/:root\s*\{/, ":host, .arena-shell {").replace(/body\s*\{/, ".arena-shell {"),
  ".cta-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }",
  ".btn-learn { background: linear-gradient(170deg, #612aa8 0%, #8c45ff 30%, #6b31b8 65%, #37155f 100%); color: #f3e8ff; text-shadow: 0 1px 4px rgba(0,0,0,0.65); box-shadow: 0 0 22px rgba(138,84,255,0.42), 0 4px 0 #240b44, inset 0 1px 0 rgba(241,222,255,0.24), inset 0 -2px 0 rgba(0,0,0,0.45), inset 1px 0 0 rgba(216,195,255,0.18), inset -1px 0 0 rgba(0,0,0,0.35); }",
  ".cta-btn.mode-active { box-shadow: 0 0 0 2px rgba(255,233,197,0.24), 0 0 30px rgba(255,154,53,0.28), 0 4px 0 rgba(22,9,24,0.72), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.45); }",
  "@media (max-width: 880px) { .cta-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }"
].join("\n");

export function ReactQuestArenaDashboard(props: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef<LiveCallbacks>({
    selectedStream: props.selectedStream,
    sessionMode: props.sessionMode,
    busy: props.busy,
    onSelectStream: props.onSelectStream,
    onStartTimed: props.onStartTimed,
    onStartLearn: props.onStartLearn,
    onOpenLeaderboard: props.onOpenLeaderboard,
    onOpenSocial: props.onOpenSocial
  });

  useEffect(() => {
    callbacksRef.current = {
      selectedStream: props.selectedStream,
      sessionMode: props.sessionMode,
      busy: props.busy,
      onSelectStream: props.onSelectStream,
      onStartTimed: props.onStartTimed,
      onStartLearn: props.onStartLearn,
      onOpenLeaderboard: props.onOpenLeaderboard,
      onOpenSocial: props.onOpenSocial
    };
  }, [props.busy, props.onOpenLeaderboard, props.onOpenSocial, props.onSelectStream, props.onStartLearn, props.onStartTimed, props.selectedStream, props.sessionMode]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadow.innerHTML = "";

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = FONT_HREF;

    const style = document.createElement("style");
    style.textContent = ARENA_CSS;

    const shell = document.createElement("div");
    shell.className = "arena-shell";
    shell.innerHTML = ARENA_MARKUP;

    shadow.append(fontLink, style, shell);

    ensureLearnButton(shadow);

    populateParticles(shadow);

    const audio = createArenaAudio();
    const cleanups: Array<() => void> = [];

    const tierCards = Array.from(shadow.querySelectorAll<HTMLElement>(".tier-card"));
    tierCards.forEach((card, index) => {
      const stream = POSTER_STREAMS[index];
      if (!stream) return;

      card.dataset.stream = stream;
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Choose ${stream === "1" ? "Tier 1 Foundations" : stream === "2" ? "Tier 2 Challenges" : "Tier 3 Expert Mode"}`);

      const selectStream = () => {
        audio.resume();
        audio.playTierSelect();
        callbacksRef.current.onSelectStream(stream);
      };

      const onEnter = () => {
        audio.resume();
        audio.playTierHover();
      };
      const onClick = () => {
        selectStream();
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        selectStream();
      };

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("click", onClick);
      card.addEventListener("keydown", onKeyDown);
      cleanups.push(() => {
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("click", onClick);
        card.removeEventListener("keydown", onKeyDown);
      });
    });

    const ctaButtons = [
      shadow.querySelector<HTMLButtonElement>(".btn-start"),
      shadow.querySelector<HTMLButtonElement>(".btn-learn"),
      shadow.querySelector<HTMLButtonElement>(".btn-leader"),
      shadow.querySelector<HTMLButtonElement>(".btn-social")
    ].filter(Boolean) as HTMLButtonElement[];
    const actions = [
      () => callbacksRef.current.onStartTimed(),
      () => callbacksRef.current.onStartLearn(),
      () => callbacksRef.current.onOpenLeaderboard(),
      () => callbacksRef.current.onOpenSocial()
    ] as const;

    ctaButtons.forEach((button, index) => {
      button.type = "button";
      const action = actions[index];
      if (!action) return;

      const onEnter = () => {
        audio.resume();
        audio.playHover();
      };
      const onClick = (event: MouseEvent) => {
        if ((index === 0 || index === 1) && callbacksRef.current.busy) return;
        audio.resume();
        audio.playClick();
        spawnRipple(event, button);
        void action();
      };

      button.addEventListener("mouseenter", onEnter);
      button.addEventListener("click", onClick);
      cleanups.push(() => {
        button.removeEventListener("mouseenter", onEnter);
        button.removeEventListener("click", onClick);
      });
    });

    syncPosterState(shadow, callbacksRef.current.selectedStream, callbacksRef.current.busy, callbacksRef.current.sessionMode);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      audio.dispose();
    };
  }, []);

  useEffect(() => {
    const shadow = hostRef.current?.shadowRoot;
    if (!shadow) return;
    syncPosterState(shadow, props.selectedStream, props.busy, props.sessionMode);
  }, [props.busy, props.selectedStream, props.sessionMode]);

  return <div ref={hostRef} className="arena-poster-host" aria-label="React Quest Arena dashboard" />;
}

function syncPosterState(shadow: ShadowRoot, selectedStream: QuizStream, busy: boolean, sessionMode: SessionMode) {
  const tierCards = Array.from(shadow.querySelectorAll<HTMLElement>(".tier-card"));
  tierCards.forEach((card) => {
    const isSelected = card.dataset.stream === selectedStream;
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  const startButton = shadow.querySelector<HTMLButtonElement>(".btn-start");
  const learnButton = shadow.querySelector<HTMLButtonElement>(".btn-learn");
  if (startButton) {
    const iconMarkup = startButton.querySelector("svg")?.outerHTML ?? "";
    startButton.innerHTML = `${iconMarkup}START TIMED RUN`;
    startButton.disabled = busy;
    startButton.style.pointerEvents = busy ? "none" : "";
    startButton.style.opacity = busy ? "0.82" : "";
    startButton.setAttribute("aria-busy", busy ? "true" : "false");
    startButton.setAttribute("aria-label", "Start timed run");
    startButton.title = "Start timed run";
    startButton.classList.toggle("mode-active", sessionMode === "ranked");
  }

  if (learnButton) {
    const iconMarkup = learnButton.querySelector("svg")?.outerHTML ?? "";
    learnButton.innerHTML = `${iconMarkup}START LEARN MODE`;
    learnButton.disabled = busy;
    learnButton.style.pointerEvents = busy ? "none" : "";
    learnButton.style.opacity = busy ? "0.82" : "";
    learnButton.setAttribute("aria-busy", busy ? "true" : "false");
    learnButton.setAttribute("aria-label", "Start learn mode");
    learnButton.title = "Start learn mode";
    learnButton.classList.toggle("mode-active", sessionMode === "practice");
  }
}

function ensureLearnButton(shadow: ShadowRoot) {
  const ctaRow = shadow.querySelector<HTMLElement>(".cta-row");
  const startButton = shadow.querySelector<HTMLButtonElement>(".btn-start");
  const leaderButton = shadow.querySelector<HTMLButtonElement>(".btn-leader");
  if (!ctaRow || !startButton || !leaderButton || shadow.querySelector(".btn-learn")) return;

  const learnButton = startButton.cloneNode(true) as HTMLButtonElement;
  learnButton.classList.remove("btn-start");
  learnButton.classList.add("btn-learn");
  learnButton.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 13 13" style="vertical-align:-1px;margin-right:5px" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2.5H11V10.5H2V2.5Z" stroke="#f3d5ff" stroke-width="1.2"/>
        <path d="M4 4.5L6 6.5L4 8.5" stroke="#f3d5ff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="7.5" y1="8.5" x2="9.5" y2="8.5" stroke="#f3d5ff" stroke-width="1.2" stroke-linecap="round"/>
      </svg>START LEARN MODE`;
  ctaRow.insertBefore(learnButton, leaderButton);
}

function populateParticles(shadow: ShadowRoot) {
  const container = shadow.getElementById("particles");
  if (!container || container.childElementCount > 0) return;

  for (let index = 0; index < 36; index += 1) {
    const particle = document.createElement("div");
    const config = PARTICLE_CONFIGS[Math.floor(Math.random() * PARTICLE_CONFIGS.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = 7 + Math.random() * 12;
    const dx = (Math.random() - 0.5) * 80;

    particle.className = "p";
    particle.style.left = `${left}%`;
    particle.style.bottom = "-4px";
    particle.style.width = `${config.size}px`;
    particle.style.height = `${config.size}px`;
    particle.style.background = config.color;
    particle.style.boxShadow = `0 0 4px ${config.color}`;
    particle.style.setProperty("--dx", `${dx}px`);
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.borderRadius = "50%";
    container.appendChild(particle);
  }
}

function spawnRipple(event: MouseEvent, button: HTMLButtonElement) {
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  button.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), 600);
}

function createArenaAudio() {
  let context: AudioContext | null = null;

  const ensureContext = () => {
    if (context) return context;
    const AudioCtor = getAudioContextCtor();
    if (!AudioCtor) return null;
    context = new AudioCtor();
    return context;
  };

  const withContext = (callback: (audio: AudioContext) => void) => {
    const audio = ensureContext();
    if (!audio) return;
    callback(audio);
  };

  return {
    resume() {
      withContext((audio) => {
        if (audio.state === "suspended") {
          void audio.resume().catch(() => undefined);
        }
      });
    },
    playHover() {
      withContext((audio) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audio.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1320, audio.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.12);
      });
    },
    playClick() {
      withContext((audio) => {
        const tones: Array<[number, number, number, number, OscillatorType]> = [
          [120, 60, 0.18, 0.12, "sine"],
          [1800, 900, 0.06, 0.18, "sine"]
        ];

        tones.forEach(([from, to, volume, duration, type]) => {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();

          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.type = type;
          oscillator.frequency.setValueAtTime(from, audio.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(to, audio.currentTime + duration);
          gain.gain.setValueAtTime(volume, audio.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
          oscillator.start();
          oscillator.stop(audio.currentTime + duration);
        });
      });
    },
    playTierSelect() {
      withContext((audio) => {
        [523, 659, 784, 1047].forEach((frequency, index) => {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          const start = audio.currentTime + index * 0.06;

          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, start);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.07, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
          oscillator.start(start);
          oscillator.stop(start + 0.14);
        });
      });
    },
    playTierHover() {
      withContext((audio) => {
        const bufferSize = Math.floor(audio.sampleRate * 0.1);
        const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
        const data = buffer.getChannelData(0);

        for (let index = 0; index < bufferSize; index += 1) {
          data[index] = Math.random() * 2 - 1;
        }

        const noise = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();

        noise.buffer = buffer;
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(400, audio.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3200, audio.currentTime + 0.09);
        filter.Q.value = 1.5;
        gain.gain.setValueAtTime(0.12, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.09);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);
        noise.start();
        noise.stop(audio.currentTime + 0.1);
      });
    },
    dispose() {
      if (!context) return;
      void context.close().catch(() => undefined);
      context = null;
    }
  };
}

function getAudioContextCtor() {
  const win = window as Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };

  return win.AudioContext ?? win.webkitAudioContext ?? null;
}
