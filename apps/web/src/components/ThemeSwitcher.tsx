import { getThemeSwatch } from "../lib/helpers";
import type { ThemeName } from "../lib/types";
import { useEffect, useRef } from "react";

export function ThemeSwitcher(props: {
  theme: ThemeName;
  open: boolean;
  onChange: (next: ThemeName) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { open, onChange, onOpenChange, theme } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const options: Array<{ id: ThemeName; label: string }> = [
    { id: "midnight", label: "Midnight" },
    { id: "ember", label: "Ember" },
    { id: "nova", label: "Nova" },
    { id: "sunset", label: "Sunset" },
    { id: "circuit", label: "Circuit" }
  ];
  const active = options.find((option) => option.id === theme) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      if (!(event.target instanceof Node) || rootRef.current?.contains(event.target)) return;
      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <div className="theme-picker-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="theme-picker"
        aria-label="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <span className={`theme-picker-swatch bg-gradient-to-r ${getThemeSwatch(theme)}`} />
        <span className="theme-picker-current">{active.label}</span>
      </button>
      <div className="theme-picker-panel" hidden={!open} role="menu">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="menuitemradio"
            aria-checked={option.id === theme}
            className={`theme-picker-option${option.id === theme ? " theme-picker-option-active" : ""}`}
            onClick={() => {
              onChange(option.id);
              onOpenChange(false);
            }}
          >
            <span className={`theme-picker-swatch theme-picker-option-swatch bg-gradient-to-r ${getThemeSwatch(option.id)}`} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
