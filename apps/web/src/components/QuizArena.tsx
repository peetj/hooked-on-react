import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { SubmitAnswerResponse } from "@react-quiz-1000/shared";
import { cx } from "../lib/api";

function escapeScriptContent(value: string) {
  return value.replace(/<\/script>/gi, "<\\/script>");
}

function buildPlaygroundSrcDoc(code: string) {
  const safeCode = escapeScriptContent(code);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(255, 131, 55, 0.16), transparent 32%),
          linear-gradient(180deg, #140d1d, #0e0915);
        color: #fff4e7;
        font-family: Inter, system-ui, sans-serif;
      }
      #root {
        padding: 18px;
      }
      #playground-error {
        display: none;
        margin: 0 18px 18px;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(132, 28, 47, 0.85);
        color: #ffe7ec;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        white-space: pre-wrap;
      }
      button, input {
        font: inherit;
      }
      button {
        padding: 8px 12px;
        margin-right: 8px;
        border: 0;
        border-radius: 10px;
        background: linear-gradient(180deg, #ff9443, #b04416);
        color: white;
        cursor: pointer;
      }
      input {
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(255,255,255,0.08);
        color: white;
      }
      pre {
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <div id="playground-error"></div>
    <script>
      const errorNode = document.getElementById("playground-error");
      function showError(message) {
        errorNode.style.display = "block";
        errorNode.textContent = message;
      }
      window.addEventListener("error", (event) => {
        showError(event.error?.stack || event.message || "Unknown runtime error");
      });
      window.addEventListener("unhandledrejection", (event) => {
        showError(String(event.reason ?? "Unhandled promise rejection"));
      });
    </script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="text/babel">
${safeCode}
    </script>
  </body>
</html>`;
}

export function LearnPlayground(props: { example: NonNullable<SubmitAnswerResponse["playground"]> }) {
  const [code, setCode] = useState(props.example.code);

  useEffect(() => {
    setCode(props.example.code);
  }, [props.example.code]);

  return (
    <div className="learn-playground">
      <div className="quiz-explanation-eyebrow">Try it live</div>
      <div className="learn-playground-head">
        <div>
          <div className="learn-playground-title">{props.example.title}</div>
          <div className="learn-playground-copy">{props.example.description}</div>
        </div>
        <button type="button" className="learn-playground-reset" onClick={() => setCode(props.example.code)}>
          Reset example
        </button>
      </div>
      <div className="learn-playground-grid">
        <label className="learn-playground-editor">
          <span className="learn-playground-label">Editable code</span>
          <textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} />
        </label>
        <div className="learn-playground-preview-shell">
          <span className="learn-playground-label">Preview</span>
          <iframe
            title={props.example.title}
            className="learn-playground-preview"
            sandbox="allow-scripts"
            srcDoc={buildPlaygroundSrcDoc(code)}
          />
        </div>
      </div>
    </div>
  );
}

export function QuizStatCard(props: { label: string; value: string; tone: "accent" | "success" | "danger" | "neutral"; prominent?: boolean }) {
  return (
    <div className={cx("quiz-stat-card", `quiz-stat-card-${props.tone}`, props.prominent ? "quiz-stat-card-prominent" : "")}>
      <div className="quiz-stat-label">{props.label}</div>
      <div className="quiz-stat-value">{props.value}</div>
    </div>
  );
}

export function PixelField(props: { reduceMotion: boolean }) {
  const pixels = useMemo(
    () =>
      Array.from({ length: props.reduceMotion ? 12 : 28 }, (_, index) => {
        const colors = ["#ffb25b", "#ff7b52", "#ffdd8f", "#c087ff", "#8f72ff"];
        const color = colors[index % colors.length];
        return {
          id: index,
          color,
          left: Math.random() * 100,
          size: 2 + Math.random() * 4,
          duration: 7 + Math.random() * 8,
          delay: Math.random() * 8,
          drift: -22 + Math.random() * 44,
          opacity: 0.35 + Math.random() * 0.45
        };
      }),
    [props.reduceMotion]
  );

  return (
    <div className="quiz-pixel-field" aria-hidden="true">
      {pixels.map((pixel) => {
        const style: CSSProperties & { "--pixel-drift": string } = {
          left: `${pixel.left}%`,
          width: `${pixel.size}px`,
          height: `${pixel.size}px`,
          animationDuration: `${pixel.duration}s`,
          animationDelay: `${pixel.delay}s`,
          opacity: pixel.opacity,
          background: pixel.color,
          boxShadow: `0 0 10px ${pixel.color}`,
          "--pixel-drift": `${pixel.drift}px`
        };

        return <span key={pixel.id} className="quiz-pixel" style={style} />;
      })}
    </div>
  );
}
