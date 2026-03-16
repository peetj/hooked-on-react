# Nexgen React Arena Exact React Build

This pack reconstructs the supplied page in React using the generated spritesheet and sprite map.

## Files
- `NexgenReactArenaExact.jsx` - main React component
- `react-arena-spritesheet.png` - atlas image used by the component
- `sprite-map.json` - atlas coordinate map

## Usage
```jsx
import NexgenReactArenaExact from './NexgenReactArenaExact';

export default function App() {
  return <NexgenReactArenaExact />;
}
```

## Notes
- This is designed for maximum likeness to the supplied artwork.
- It scales responsively while preserving the original 1365 x 2048 aspect ratio.
- The buttons and main tier cards have invisible hotspot overlays you can wire up.
- For a true editable UI, the next pass would replace rasterized title, cards, and labels with live components.
