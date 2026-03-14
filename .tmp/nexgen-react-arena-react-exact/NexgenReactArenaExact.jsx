import React, { useEffect, useMemo, useRef, useState } from "react";
import spriteSheet from "./react-arena-spritesheet.png";
import spriteMap from "./sprite-map.json";

const HOTSPOTS = [
  {
    id: "tier-1",
    label: "Tier 1 Foundations",
    x: 131,
    y: 583,
    width: 365,
    height: 390,
  },
  {
    id: "tier-2",
    label: "Tier 2 Challenges",
    x: 513,
    y: 565,
    width: 383,
    height: 422,
  },
  {
    id: "tier-3",
    label: "Tier 3 Expert Mode",
    x: 901,
    y: 584,
    width: 330,
    height: 378,
  },
  {
    id: "start-run",
    label: "Start Run",
    x: 110,
    y: 1437,
    width: 363,
    height: 116,
  },
  {
    id: "leaderboard",
    label: "View Leaderboard",
    x: 493,
    y: 1434,
    width: 402,
    height: 120,
  },
  {
    id: "social",
    label: "Social Hub",
    x: 915,
    y: 1430,
    width: 337,
    height: 120,
  },
];

function useScaledCanvas(baseWidth, baseHeight) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: baseWidth, height: baseHeight, scale: 1 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const width = node.clientWidth;
      const scale = width / baseWidth;
      setSize({
        width,
        height: baseHeight * scale,
        scale,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [baseWidth, baseHeight]);

  return { ref, ...size };
}

function SpriteTile({ tile, atlas, spriteSheet }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: tile.page_x,
        top: tile.page_y,
        width: tile.width,
        height: tile.height,
        backgroundImage: `url(${spriteSheet})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `-${tile.atlas_x}px -${tile.atlas_y}px`,
        backgroundSize: `${atlas.width}px ${atlas.height}px`,
        imageRendering: "auto",
      }}
    />
  );
}

function Hotspot({ spot }) {
  return (
    <button
      type="button"
      aria-label={spot.label}
      title={spot.label}
      style={{
        position: "absolute",
        left: spot.x,
        top: spot.y,
        width: spot.width,
        height: spot.height,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        borderRadius: 18,
        outline: "none",
      }}
      onClick={() => {
        console.log(`${spot.label} clicked`);
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 184, 77, 0.75)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.035)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    />
  );
}

export default function NexgenReactArenaExact() {
  const { page, atlas, tiles } = spriteMap;
  const baseWidth = page.width;
  const baseHeight = page.height;
  const scaled = useScaledCanvas(baseWidth, baseHeight);

  const orderedTiles = useMemo(() => [...tiles].sort((a, b) => a.index - b.index), [tiles]);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden px-3 py-6 text-white sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(106,59,148,0.28), transparent 32%), linear-gradient(180deg, #120512 0%, #100312 22%, #0b0210 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1365px]">
        <div
          ref={scaled.ref}
          className="relative mx-auto w-full"
          style={{
            height: scaled.height,
            maxWidth: baseWidth,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: baseWidth,
              height: baseHeight,
              transform: `scale(${scaled.scale})`,
              transformOrigin: "top left",
              overflow: "hidden",
              borderRadius: 24,
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,135,61,0.08), inset 0 1px 0 rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.06), transparent 18%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), transparent 28%)",
                pointerEvents: "none",
              }}
            />

            {orderedTiles.map((tile) => (
              <SpriteTile key={tile.index} tile={tile} atlas={atlas} spriteSheet={spriteSheet} />
            ))}

            {HOTSPOTS.map((spot) => (
              <Hotspot key={spot.id} spot={spot} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
