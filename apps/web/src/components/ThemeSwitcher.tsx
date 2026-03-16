import type { ThemeName } from "../lib/types";
import { getThemeSwatch } from "../lib/helpers";

export function ThemeSwitcher(props: { theme: ThemeName; onChange: (next: ThemeName) => void }) {
  const options: Array<{ id: ThemeName; label: string }> = [
    { id: "midnight", label: "Midnight" },
    { id: "ember", label: "Ember" },
    { id: "nova", label: "Nova" },
    { id: "sunset", label: "Sunset" },
    { id: "circuit", label: "Circuit" }
  ];

  return (
    <label className="theme-picker">
      <span className={`theme-picker-swatch bg-gradient-to-r ${getThemeSwatch(props.theme)}`} />
      <select value={props.theme} onChange={(event) => props.onChange(event.target.value as ThemeName)} className="theme-picker-select">
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
