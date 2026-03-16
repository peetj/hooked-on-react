import { useEffect, useMemo, useRef, useState } from "react";
import type { QuizStream } from "@react-quiz-1000/shared";
import spriteSheet from "../assets/arena/react-arena-spritesheet.png";
import spriteMap from "../assets/arena/sprite-map.json";

type ArenaHotspot =
  | { id: string; x: number; y: number; width: number; height: number; kind: "stream"; stream: QuizStream; label: string }
  | { id: string; x: number; y: number; width: number; height: number; kind: "action"; action: "start" | "leaderboard" | "social"; label: string }
  | { id: string; x: number; y: number; width: number; height: number; kind: "nav"; action: "play" | "leaderboard" | "social" | "badges" | "admin"; label: string };

type SpriteTile = {
  index: number;
  page_x: number;
  page_y: number;
  width: number;
  height: number;
  atlas_x: number;
  atlas_y: number;
};

type SpriteMap = {
  page: { width: number; height: number };
  atlas: { width: number; height: number };
  tiles: SpriteTile[];
};

type Props = {
  selectedStream: QuizStream;
  isAdmin: boolean;
  busy: boolean;
  onSelectStream: (next: QuizStream) => void;
  onStart: () => Promise<void>;
  onOpenLeaderboard: () => void;
  onOpenSocial: () => void;
  onOpenBadges: () => void;
  onOpenAdmin: () => void;
};

const HOTSPOTS: ArenaHotspot[] = [
  { id: "nav-play", label: "Play", x: 118, y: 498, width: 196, height: 90, kind: "nav", action: "play" },
  { id: "nav-leaderboard", label: "Leaderboard", x: 336, y: 498, width: 238, height: 90, kind: "nav", action: "leaderboard" },
  { id: "nav-social", label: "Social", x: 587, y: 498, width: 153, height: 90, kind: "nav", action: "social" },
  { id: "nav-badges", label: "Badges", x: 753, y: 498, width: 159, height: 90, kind: "nav", action: "badges" },
  { id: "nav-admin", label: "Admin", x: 926, y: 498, width: 148, height: 90, kind: "nav", action: "admin" },
  { id: "tier-1", label: "Tier 1 Foundations", x: 131, y: 583, width: 365, height: 390, kind: "stream", stream: "1" },
  { id: "tier-2", label: "Tier 2 Challenges", x: 513, y: 565, width: 383, height: 422, kind: "stream", stream: "2" },
  { id: "tier-3", label: "Tier 3 Expert Mode", x: 901, y: 584, width: 330, height: 378, kind: "stream", stream: "3" },
  { id: "start-run", label: "Start Run", x: 110, y: 1437, width: 363, height: 116, kind: "action", action: "start" },
  { id: "leaderboard", label: "View Leaderboard", x: 493, y: 1434, width: 402, height: 120, kind: "action", action: "leaderboard" },
  { id: "social", label: "Social Hub", x: 915, y: 1430, width: 337, height: 120, kind: "action", action: "social" }
];

function useScaledCanvas(baseWidth: number, baseHeight: number) {
  const ref = useRef<HTMLDivElement | null>(null);
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
        scale
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
  }, [baseHeight, baseWidth]);

  return { ref, ...size };
}

function SpriteLayer(props: { tile: SpriteTile; atlas: SpriteMap["atlas"] }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: props.tile.page_x,
        top: props.tile.page_y,
        width: props.tile.width,
        height: props.tile.height,
        backgroundImage: `url(${spriteSheet})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `-${props.tile.atlas_x}px -${props.tile.atlas_y}px`,
        backgroundSize: `${props.atlas.width}px ${props.atlas.height}px`
      }}
    />
  );
}

function OverlayButton(props: {
  spot: ArenaHotspot;
  selected?: boolean;
  disabled?: boolean;
  onActivate: () => void;
}) {
  const typeClass =
    props.spot.kind === "nav"
      ? "arena-exact-hotspot-nav"
      : props.spot.kind === "stream"
        ? "arena-exact-hotspot-stream"
        : "arena-exact-hotspot-action";

  return (
    <button
      type="button"
      aria-label={props.spot.label}
      title={props.spot.label}
      aria-pressed={props.spot.kind === "stream" ? props.selected : undefined}
      aria-current={props.spot.kind === "nav" && props.spot.action === "play" ? "page" : undefined}
      disabled={props.disabled}
      className={[
        "arena-exact-hotspot",
        typeClass,
        props.selected ? "arena-exact-hotspot-selected" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: props.spot.x,
        top: props.spot.y,
        width: props.spot.width,
        height: props.spot.height
      }}
      onClick={props.onActivate}
    >
      <span className="sr-only">{props.spot.label}</span>
      <span className="arena-exact-hotspot-hint" aria-hidden="true">
        {props.spot.label}
      </span>
    </button>
  );
}

export function NexgenReactArenaExact(props: Props) {
  const { page, atlas, tiles } = spriteMap as SpriteMap;
  const scaled = useScaledCanvas(page.width, page.height);
  const orderedTiles = useMemo(() => [...tiles].sort((a, b) => a.index - b.index), [tiles]);
  const navSpots = useMemo(() => HOTSPOTS.filter((spot) => spot.kind === "nav" && (spot.action !== "admin" || props.isAdmin)), [props.isAdmin]);
  const streamSpots = useMemo(() => HOTSPOTS.filter((spot) => spot.kind === "stream"), []);
  const actionSpots = useMemo(() => HOTSPOTS.filter((spot) => spot.kind === "action"), []);

  const handleHotspot = async (spot: ArenaHotspot) => {
    if (spot.kind === "stream") {
      props.onSelectStream(spot.stream);
      return;
    }
    if (spot.kind === "action") {
      if (spot.action === "start") {
        await props.onStart();
      } else if (spot.action === "leaderboard") {
        props.onOpenLeaderboard();
      } else {
        props.onOpenSocial();
      }
      return;
    }

    if (spot.action === "leaderboard") props.onOpenLeaderboard();
    if (spot.action === "social") props.onOpenSocial();
    if (spot.action === "badges") props.onOpenBadges();
    if (spot.action === "admin") props.onOpenAdmin();
  };

  return (
    <div className="arena-exact-shell">
      <div ref={scaled.ref} className="arena-exact-frame" style={{ height: scaled.height, maxWidth: page.width }}>
        <div
          className="arena-exact-artboard"
          style={{
            width: page.width,
            height: page.height,
            transform: `scale(${scaled.scale})`,
            transformOrigin: "top left"
          }}
        >
          <div className="arena-exact-sheen" />

          {orderedTiles.map((tile) => (
            <SpriteLayer key={tile.index} tile={tile} atlas={atlas} />
          ))}

          <section className="arena-exact-hero-copy" aria-label="Hero copy">
            <h1 className="sr-only">React Quest Arena</h1>
            <div className="arena-exact-hero-mask arena-exact-hero-mask-kicker" aria-hidden="true" />
            <div className="arena-exact-hero-mask arena-exact-hero-mask-subtitle" aria-hidden="true" />
            <div className="arena-exact-hero-mask arena-exact-hero-mask-ribbon" aria-hidden="true" />
            <p className="arena-exact-kicker">Nexgen React Arena</p>
            <p className="arena-exact-subtitle">Code fast. Climb the leaderboard. Master React.</p>
            <p className="arena-exact-ribbon-text" aria-label="Highlights">
              <span>1000+ Challenges</span>
              <span aria-hidden="true">•</span>
              <span>Timed Battles</span>
              <span aria-hidden="true">•</span>
              <span>Epic Streaks</span>
            </p>
          </section>

          <nav className="arena-exact-layer" aria-label="Primary">
            {navSpots.map((spot) => (
              <OverlayButton key={spot.id} spot={spot} onActivate={() => void handleHotspot(spot)} />
            ))}
          </nav>

          <section className="arena-exact-layer" aria-label="Choose your path">
            {streamSpots.map((spot) => (
              <OverlayButton
                key={spot.id}
                spot={spot}
                selected={props.selectedStream === spot.stream}
                onActivate={() => void handleHotspot(spot)}
              />
            ))}
          </section>

          <section className="arena-exact-layer" aria-label="Primary actions">
            {actionSpots.map((spot) => (
              <OverlayButton
                key={spot.id}
                spot={spot}
                disabled={props.busy && spot.action === "start"}
                onActivate={() => void handleHotspot(spot)}
              />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
