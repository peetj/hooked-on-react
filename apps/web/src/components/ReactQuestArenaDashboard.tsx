import { useEffect, useRef } from "react";
import type { QuizStream, SessionMode } from "@react-quiz-1000/shared";
import arenaCssRaw from "../assets/arena/react-quest-arena-v2.css?raw";
import arenaMarkupRaw from "../assets/arena/react-quest-arena-v2.body.html?raw";
import type { ThemeName } from "../lib/types";

type Props = {
  theme: ThemeName;
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

type GuideSection = {
  heading: string;
  items: string[];
};

type HowToGuide = {
  title: string;
  subtitle: string;
  intro: string;
  sections: GuideSection[];
  footer: string;
};

const HOW_TO_GUIDES: HowToGuide[] = [
  {
    title: "Select Your Mode",
    subtitle: "Pick the lane that matches how you want to learn or compete.",
    intro: "The arena has two main run styles. One is for pressure and leaderboard climbs. The other is for slower study with explanations and runnable examples.",
    sections: [
      {
        heading: "Timed Run",
        items: [
          "Use timed mode when you want a fast competitive round with the quiz clock running.",
          "Your score affects the leaderboard for the stream you choose.",
          "It is the best option when you want streaks, rating movement, and short repeat sessions."
        ]
      },
      {
        heading: "Learn Mode",
        items: [
          "Use learn mode when you want to slow down and understand why an answer is right.",
          "The clock is off, progress is safer to pause, and practice feedback is more forgiving.",
          "After each answer you can open a runnable example to test the idea immediately."
        ]
      },
      {
        heading: "Choosing A Stream",
        items: [
          "Tier 1 to Tier 3 are the poster lanes on the main screen.",
          "Adaptive, Tier 4, and Tier 5 stay available in the support rail for deeper play.",
          "If you are unsure, start with Foundations or Adaptive and move upward once your streaks feel stable."
        ]
      }
    ],
    footer: "Quick rule: timed for pressure, learn for depth."
  },
  {
    title: "Answer To Win",
    subtitle: "Read the prompt cleanly, commit, and keep momentum.",
    intro: "Each challenge is built to be scanned quickly. The goal is not just to know React facts, but to read options clearly under game pressure.",
    sections: [
      {
        heading: "Read The Prompt First",
        items: [
          "Look for the exact claim being tested before you inspect the options.",
          "Pay attention to question type and difficulty markers in the run strip.",
          "React questions often hinge on one word such as async, stable, default, or accessible."
        ]
      },
      {
        heading: "Use The Option Rail",
        items: [
          "Tap an answer to lock a single choice or build a multi-select set when required.",
          "Selected answers glow before submission so you can verify your choice quickly.",
          "If you picked the wrong option by mistake, clear it before locking in."
        ]
      },
      {
        heading: "Handle The Clock",
        items: [
          "Timed rounds reward fast recognition, not overthinking every sentence.",
          "If the timer starts dropping into warning colors, trust the strongest signal and answer.",
          "You can pause and return later, but live pace matters if you want leaderboard momentum."
        ]
      }
    ],
    footer: "Best pattern: scan, decide, submit, learn, repeat."
  },
  {
    title: "Earn Rewards XP",
    subtitle: "Progress is more than one correct answer.",
    intro: "The reward loop is designed to keep sessions short but satisfying. Correct answers help immediately, but consistency is what compounds.",
    sections: [
      {
        heading: "Build Streaks",
        items: [
          "Correct answers increase your streak and strengthen the feel of a run.",
          "Higher streaks make the session feel more rewarding and easier to track mentally.",
          "Missing one is fine, but protecting rhythm over several questions is where progress becomes visible."
        ]
      },
      {
        heading: "Unlock Badges",
        items: [
          "Badges are tied to meaningful actions such as accuracy, persistence, social play, and recovery.",
          "They give you long-tail goals beyond one leaderboard snapshot.",
          "If a badge toast appears, it means the run crossed a threshold worth keeping."
        ]
      },
      {
        heading: "Use Learn Mode For Mastery",
        items: [
          "Practice sessions let you turn explanations into understanding instead of just score.",
          "The code playground helps convert abstract quiz language into something you can test.",
          "That usually pays back later when you return to timed mode."
        ]
      }
    ],
    footer: "Fast points feel good. Retained understanding pays longer."
  },
  {
    title: "Climb The Leaderboard",
    subtitle: "Use the board as a signal, not just a trophy.",
    intro: "The leaderboard tracks how well you perform in the streams you choose. It is meant to create forward pressure without hiding the learning loop.",
    sections: [
      {
        heading: "Play The Right Lane",
        items: [
          "Pick the stream that matches your current comfort level so your rating movement reflects real progress.",
          "Too easy and you stop learning. Too hard and every session becomes random noise.",
          "A stable lane is the fastest way to build an honest climb."
        ]
      },
      {
        heading: "Protect Session Quality",
        items: [
          "Short focused runs usually beat long distracted ones.",
          "If your answers start turning into guesses, pause and return later instead of forcing a bad streak.",
          "Recovery matters because the app will preserve live progress when you step away safely."
        ]
      },
      {
        heading: "Use Social Pressure Well",
        items: [
          "Leaderboard movement, badges, and the social hub work best together when they nudge you back into practice.",
          "Check the board to measure trend, not to panic over one bad round.",
          "Treat every climb as evidence that your React instincts are becoming faster and cleaner."
        ]
      }
    ],
    footer: "Climb steadily, not desperately."
  }
];

const ARENA_MARKUP = arenaMarkupRaw
  .replace(/<div class="feedback-tab">[\s\S]*?<\/div>/, "")
  .replace(/\s+onclick="ripple\(event,this\)"/g, "")
  .replace(/Â·/g, "·")
  .replace(/â—†/g, "◆")
  .replace(/â¬¡/g, "□");

const ARENA_CSS = [
  ":host { display: block; width: 100%; }",
  ".arena-shell { position: relative; min-height: 100vh; --arena-glow-top: rgba(90,30,160,0.50); --arena-glow-left: rgba(160,70,0,0.22); --arena-glow-right: rgba(70,20,140,0.22); --arena-glow-center: rgba(30,10,70,0.30); --arena-base-start: #0c0818; --arena-base-mid1: #160e28; --arena-base-mid2: #100c22; --arena-base-end: #080612; --orb-one: rgba(90,30,160,0.28); --orb-two: rgba(160,70,0,0.18); --orb-three: rgba(60,15,130,0.20); transition: filter 220ms ease, opacity 220ms ease; }",
  arenaCssRaw.replace(/:root\s*\{/, ":host, .arena-shell {").replace(/body\s*\{/, ".arena-shell {"),
  ".arena-shell .bg-base { background: radial-gradient(ellipse 90% 55% at 50% -5%, var(--arena-glow-top) 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 15% 85%, var(--arena-glow-left) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 85% 65%, var(--arena-glow-right) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 50% 50%, var(--arena-glow-center) 0%, transparent 80%), linear-gradient(175deg, var(--arena-base-start) 0%, var(--arena-base-mid1) 35%, var(--arena-base-mid2) 65%, var(--arena-base-end) 100%); }",
  ".arena-shell .orb-1 { background: var(--orb-one); }",
  ".arena-shell .orb-2 { background: var(--orb-two); }",
  ".arena-shell .orb-3 { background: var(--orb-three); }",
  ".arena-shell[data-theme='ember'] { --gold: #ff8f5a; --gold-light: #ffbe8a; --gold-bright: #ffe0b9; --gold-dim: #a9471c; --amber: #ff6c38; --orange: #ff8d45; --purple: #431320; --purple-mid: #6f2235; --purple-hi: #bf5a5e; --purple-pale: #ffc8bd; --dark: #15080d; --darker: #080309; --panel1: rgba(48,15,10,0.92); --panel2: rgba(43,11,19,0.95); --panel3: rgba(54,17,27,0.92); --arena-glow-top: rgba(255,96,72,0.46); --arena-glow-left: rgba(255,138,74,0.22); --arena-glow-right: rgba(170,42,72,0.18); --arena-glow-center: rgba(74,14,26,0.30); --arena-base-start: #12070d; --arena-base-mid1: #261019; --arena-base-mid2: #1a0a12; --arena-base-end: #070308; --orb-one: rgba(255,102,74,0.26); --orb-two: rgba(255,148,72,0.2); --orb-three: rgba(172,46,76,0.18); }",
  ".arena-shell[data-theme='nova'] { --gold: #ff7fd6; --gold-light: #ffb8ec; --gold-bright: #ffe2f7; --gold-dim: #903177; --amber: #ff8ea5; --orange: #ff9e7f; --purple: #5b1a72; --purple-mid: #8d38ae; --purple-hi: #d57eff; --purple-pale: #f1d0ff; --dark: #14081a; --darker: #09030c; --panel1: rgba(44,12,36,0.92); --panel2: rgba(38,10,44,0.95); --panel3: rgba(50,14,54,0.92); --arena-glow-top: rgba(255,106,196,0.42); --arena-glow-left: rgba(255,156,118,0.18); --arena-glow-right: rgba(148,80,255,0.22); --arena-glow-center: rgba(60,12,72,0.28); --arena-base-start: #140817; --arena-base-mid1: #271032; --arena-base-mid2: #1b0a22; --arena-base-end: #08040d; --orb-one: rgba(255,104,192,0.24); --orb-two: rgba(255,154,120,0.16); --orb-three: rgba(154,94,255,0.18); }",
  ".arena-shell[data-theme='sunset'] { --gold: #ffb24f; --gold-light: #ffd48f; --gold-bright: #ffedc6; --gold-dim: #b45b21; --amber: #ff835d; --orange: #ffb56b; --purple: #52204b; --purple-mid: #8c386c; --purple-hi: #f39172; --purple-pale: #ffd7c0; --dark: #160a16; --darker: #09040a; --panel1: rgba(50,20,12,0.92); --panel2: rgba(53,14,31,0.95); --panel3: rgba(60,18,38,0.92); --arena-glow-top: rgba(255,181,86,0.34); --arena-glow-left: rgba(255,130,86,0.2); --arena-glow-right: rgba(160,66,118,0.18); --arena-glow-center: rgba(76,20,48,0.26); --arena-base-start: #150a11; --arena-base-mid1: #2b1120; --arena-base-mid2: #1d0b16; --arena-base-end: #080407; --orb-one: rgba(255,176,80,0.2); --orb-two: rgba(255,132,90,0.18); --orb-three: rgba(166,74,124,0.16); }",
  ".arena-shell[data-theme='circuit'] { --gold: #49dfb0; --gold-light: #9dffe0; --gold-bright: #e0fff3; --gold-dim: #168d63; --amber: #2bc993; --orange: #5ef2cb; --purple: #0f5b4d; --purple-mid: #177d69; --purple-hi: #5bd9b3; --purple-pale: #cbfff0; --dark: #05130f; --darker: #020a08; --panel1: rgba(8,36,27,0.92); --panel2: rgba(8,22,26,0.95); --panel3: rgba(10,32,30,0.92); --arena-glow-top: rgba(60,232,176,0.28); --arena-glow-left: rgba(32,196,174,0.18); --arena-glow-right: rgba(86,240,255,0.18); --arena-glow-center: rgba(10,62,52,0.28); --arena-base-start: #04100d; --arena-base-mid1: #0b231d; --arena-base-mid2: #071813; --arena-base-end: #020806; --orb-one: rgba(58,224,171,0.2); --orb-two: rgba(44,204,185,0.16); --orb-three: rgba(96,240,255,0.16); }",
  ".cta-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }",
  ".btn-learn { background: linear-gradient(170deg, #612aa8 0%, #8c45ff 30%, #6b31b8 65%, #37155f 100%); color: #f3e8ff; text-shadow: 0 1px 4px rgba(0,0,0,0.65); box-shadow: 0 0 22px rgba(138,84,255,0.42), 0 4px 0 #240b44, inset 0 1px 0 rgba(241,222,255,0.24), inset 0 -2px 0 rgba(0,0,0,0.45), inset 1px 0 0 rgba(216,195,255,0.18), inset -1px 0 0 rgba(0,0,0,0.35); }",
  ".cta-btn.mode-active { box-shadow: 0 0 0 2px rgba(255,233,197,0.24), 0 0 30px rgba(255,154,53,0.28), 0 4px 0 rgba(22,9,24,0.72), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.45); }",
  ".how-card { cursor: pointer; }",
  ".how-card:focus-visible { outline: none; transform: translateY(-5px); box-shadow: 0 0 0 2px rgba(255,224,157,0.32), 0 0 30px rgba(240,165,0,0.36), 0 12px 20px rgba(0,0,0,0.45); }",
  ".arena-guide-overlay[hidden] { display: none !important; }",
  ".arena-guide-overlay { position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 26px 16px; background: rgba(8,5,18,0.78); backdrop-filter: blur(8px); }",
  ".arena-guide-window { position: relative; width: min(760px, 100%); max-height: min(86vh, 780px); display: grid; grid-template-rows: auto minmax(0,1fr) auto; border: 1px solid rgba(240,165,0,0.5); border-radius: 18px; overflow: hidden; background: linear-gradient(180deg, rgba(25,14,52,0.98), rgba(10,7,22,0.98)); box-shadow: 0 34px 70px rgba(0,0,0,0.48), 0 0 0 1px rgba(255,209,102,0.08), 0 0 40px rgba(144,96,240,0.18); }",
  ".arena-guide-window::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 20% 0%, rgba(240,165,0,0.08), transparent 24%), radial-gradient(circle at 85% 15%, rgba(144,96,240,0.12), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.05), transparent 22%); }",
  ".arena-guide-head { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 22px 24px 18px; border-bottom: 1px solid rgba(240,165,0,0.18); background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)); }",
  ".arena-guide-kicker { font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #f0a500; text-transform: uppercase; }",
  ".arena-guide-title { margin-top: 8px; font-family: 'Cinzel Decorative', serif; font-size: clamp(30px, 5vw, 42px); line-height: 1.02; color: #ffd166; text-shadow: 0 2px 0 rgba(86,38,0,0.9), 0 0 18px rgba(240,165,0,0.22); }",
  ".arena-guide-subtitle { margin-top: 10px; max-width: 560px; font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 1.2px; color: rgba(255,220,174,0.78); }",
  ".arena-guide-close { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; height: 40px; padding: 0 14px; border: 1px solid rgba(240,165,0,0.28); border-radius: 12px; background: linear-gradient(180deg, rgba(255,160,64,0.14), rgba(35,14,42,0.96)); color: #ffd166; font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,220,100,0.12); }",
  ".arena-guide-close:hover { filter: brightness(1.08); transform: translateY(-1px); }",
  ".arena-guide-scroll { position: relative; overflow: auto; padding: 22px 24px 26px; scrollbar-color: #f0a500 rgba(18,10,36,0.95); }",
  ".arena-guide-scroll::-webkit-scrollbar { width: 12px; }",
  ".arena-guide-scroll::-webkit-scrollbar-track { background: rgba(18,10,36,0.95); border-left: 1px solid rgba(240,165,0,0.08); }",
  ".arena-guide-scroll::-webkit-scrollbar-thumb { border: 2px solid rgba(18,10,36,0.95); border-radius: 999px; background: linear-gradient(180deg, #ffd166, #e07000); }",
  ".arena-guide-intro { margin: 0 0 20px; color: rgba(255,232,208,0.86); font-size: 15px; line-height: 1.65; }",
  ".arena-guide-sections { display: grid; gap: 16px; }",
  ".arena-guide-section { position: relative; padding: 16px 16px 14px; border: 1px solid rgba(240,165,0,0.14); border-radius: 14px; background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(17,9,32,0.96)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }",
  ".arena-guide-section-title { margin: 0 0 12px; font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 700; letter-spacing: 2.4px; color: #ffd166; text-transform: uppercase; }",
  ".arena-guide-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }",
  ".arena-guide-list li { position: relative; padding-left: 18px; color: rgba(255,232,208,0.8); font-size: 14px; line-height: 1.6; }",
  ".arena-guide-list li::before { content: ''; position: absolute; left: 0; top: 8px; width: 7px; height: 7px; transform: rotate(45deg); background: linear-gradient(135deg, #ffd166, #9060f0); box-shadow: 0 0 10px rgba(240,165,0,0.22); }",
  ".arena-guide-actions { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px 24px 20px; border-top: 1px solid rgba(240,165,0,0.18); background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0)); }",
  ".arena-guide-footer { color: rgba(255,220,174,0.72); font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 1.2px; }",
  ".arena-guide-action { border: none; border-radius: 10px; padding: 12px 16px; background: linear-gradient(170deg, #c06000 0%, #e07800 30%, #c86000 65%, #8a3a00 100%); color: #fff8e0; font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; box-shadow: 0 0 18px rgba(220,110,0,0.32), 0 3px 0 #5a2800, inset 0 1px 0 rgba(255,210,100,0.28), inset 0 -2px 0 rgba(0,0,0,0.42); }",
  ".arena-guide-action:hover { filter: brightness(1.08); transform: translateY(-1px); }",
  "@media (max-width: 720px) { .arena-guide-window { max-height: 90vh; } .arena-guide-head { padding: 18px 18px 14px; } .arena-guide-scroll { padding: 18px; } .arena-guide-actions { padding: 14px 18px 18px; flex-direction: column; align-items: stretch; } .arena-guide-close, .arena-guide-action { width: 100%; justify-content: center; } }",
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
    const guideOverlay = ensureGuideOverlay(shadow);

    const audio = createArenaAudio();
    const cleanups: Array<() => void> = [];
    let lastGuideTrigger: HTMLElement | null = null;

    const closeGuide = () => {
      if (guideOverlay.hidden) return;
      guideOverlay.hidden = true;
      guideOverlay.setAttribute("aria-hidden", "true");
      lastGuideTrigger?.focus();
    };

    const onGuideOverlayClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target === guideOverlay || target.closest("[data-guide-close]")) {
        closeGuide();
      }
    };

    const onGuideKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || guideOverlay.hidden) return;
      event.preventDefault();
      closeGuide();
    };

    guideOverlay.addEventListener("click", onGuideOverlayClick);
    window.addEventListener("keydown", onGuideKeyDown);
    cleanups.push(() => {
      guideOverlay.removeEventListener("click", onGuideOverlayClick);
      window.removeEventListener("keydown", onGuideKeyDown);
    });

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

    const howCards = Array.from(shadow.querySelectorAll<HTMLElement>(".how-card"));
    howCards.forEach((card, index) => {
      const guide = HOW_TO_GUIDES[index];
      if (!guide) return;

      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-haspopup", "dialog");
      card.setAttribute("aria-label", `${guide.title}. Open instructions.`);

      const openGuide = () => {
        lastGuideTrigger = card;
        hydrateGuideOverlay(guideOverlay, guide);
        guideOverlay.hidden = false;
        guideOverlay.setAttribute("aria-hidden", "false");
        audio.resume();
        audio.playClick();
        window.setTimeout(() => {
          guideOverlay.querySelector<HTMLElement>("[data-guide-close]")?.focus();
        }, 0);
      };

      const onEnter = () => {
        audio.resume();
        audio.playHover();
      };
      const onClick = () => {
        openGuide();
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openGuide();
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

  useEffect(() => {
    const shadow = hostRef.current?.shadowRoot;
    if (!shadow) return;
    syncPosterTheme(shadow, props.theme);
  }, [props.theme]);

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

function syncPosterTheme(shadow: ShadowRoot, theme: ThemeName) {
  const shell = shadow.querySelector<HTMLElement>(".arena-shell");
  if (!shell) return;
  shell.dataset.theme = theme;
}

function ensureGuideOverlay(shadow: ShadowRoot) {
  const existing = shadow.querySelector<HTMLElement>(".arena-guide-overlay");
  if (existing) return existing;

  const shell = shadow.querySelector<HTMLElement>(".arena-shell");
  if (!shell) {
    throw new Error("Arena shell not found");
  }

  const overlay = document.createElement("div");
  overlay.className = "arena-guide-overlay";
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="arena-guide-window" role="dialog" aria-modal="true" aria-labelledby="arena-guide-title">
      <div class="arena-guide-head">
        <div>
          <div class="arena-guide-kicker">Arena Intel</div>
          <div class="arena-guide-title" id="arena-guide-title"></div>
          <div class="arena-guide-subtitle" data-guide-subtitle></div>
        </div>
        <button type="button" class="arena-guide-close" data-guide-close>Close</button>
      </div>
      <div class="arena-guide-scroll">
        <p class="arena-guide-intro" data-guide-intro></p>
        <div class="arena-guide-sections" data-guide-sections></div>
      </div>
      <div class="arena-guide-actions">
        <div class="arena-guide-footer" data-guide-footer></div>
        <button type="button" class="arena-guide-action" data-guide-close>Return To Arena</button>
      </div>
    </div>
  `;

  shell.appendChild(overlay);
  return overlay;
}

function hydrateGuideOverlay(overlay: HTMLElement, guide: HowToGuide) {
  const title = overlay.querySelector<HTMLElement>("#arena-guide-title");
  const subtitle = overlay.querySelector<HTMLElement>("[data-guide-subtitle]");
  const intro = overlay.querySelector<HTMLElement>("[data-guide-intro]");
  const sections = overlay.querySelector<HTMLElement>("[data-guide-sections]");
  const footer = overlay.querySelector<HTMLElement>("[data-guide-footer]");

  if (!title || !subtitle || !intro || !sections || !footer) return;

  title.textContent = guide.title;
  subtitle.textContent = guide.subtitle;
  intro.textContent = guide.intro;
  footer.textContent = guide.footer;
  sections.replaceChildren(
    ...guide.sections.map((section) => {
      const article = document.createElement("section");
      article.className = "arena-guide-section";

      const heading = document.createElement("h3");
      heading.className = "arena-guide-section-title";
      heading.textContent = section.heading;

      const list = document.createElement("ul");
      list.className = "arena-guide-list";
      section.items.forEach((item) => {
        const entry = document.createElement("li");
        entry.textContent = item;
        list.appendChild(entry);
      });

      article.append(heading, list);
      return article;
    })
  );
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
