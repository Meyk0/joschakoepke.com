"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type SurfSpot = {
  name: string;
  swell: string;
  wind: string;
  tide: string;
};

type RunnerMode = "idle" | "running" | "wipeout";
type ObstacleKind =
  | "kelp"
  | "board"
  | "buoy"
  | "paddler"
  | "driftwood"
  | "wake"
  | "shark";

type ObstacleTemplate = {
  kind: ObstacleKind;
  label: string;
  width: number;
  height: number;
  bottom: number;
  minDistance: number;
};

type Obstacle = ObstacleTemplate & {
  id: number;
  x: number;
  cleared: boolean;
};

type RunnerState = {
  mode: RunnerMode;
  distance: number;
  bestDistance: number;
  speed: number;
  jumpY: number;
  velocity: number;
  nextSpawnAt: number;
  cleared: number;
  spotIndex: number;
  runId: number;
  message: string;
  lastHit?: string;
  obstacles: Obstacle[];
};

const spots: SurfSpot[] = [
  { name: "Ocean Beach", swell: "4-6 ft", wind: "light offshore", tide: "mid" },
  { name: "Linda Mar", swell: "3-4 ft", wind: "clean morning", tide: "incoming" },
  { name: "Steamer Lane", swell: "4 ft", wind: "glassy", tide: "mid" },
  { name: "Pleasure Point", swell: "3 ft", wind: "light cross-shore", tide: "high" },
  { name: "Fort Point", swell: "3-5 ft", wind: "under the bridge", tide: "outgoing" },
  { name: "Bolinas", swell: "2-3 ft", wind: "soft", tide: "mid" },
  { name: "Stinson Beach", swell: "2-4 ft", wind: "calm", tide: "incoming" },
  { name: "Salmon Creek", swell: "4-5 ft", wind: "crisp", tide: "low" },
  { name: "Mavericks", swell: "12 ft", wind: "serious", tide: "low" },
];

const obstacleTemplates: ObstacleTemplate[] = [
  { kind: "kelp", label: "kelp patch", width: 48, height: 30, bottom: 64, minDistance: 0 },
  { kind: "board", label: "loose board", width: 62, height: 22, bottom: 68, minDistance: 35 },
  { kind: "buoy", label: "channel buoy", width: 34, height: 42, bottom: 65, minDistance: 75 },
  { kind: "driftwood", label: "driftwood", width: 58, height: 26, bottom: 68, minDistance: 100 },
  { kind: "paddler", label: "paddler", width: 70, height: 34, bottom: 70, minDistance: 150 },
  { kind: "wake", label: "foam pile", width: 78, height: 30, bottom: 66, minDistance: 230 },
  { kind: "shark", label: "shark fin", width: 46, height: 36, bottom: 68, minDistance: 420 },
];

const SurferX = 92;
const SurferWidth = 72;
const SurferHeight = 52;
const WaterlineBottom = 72;
const StartSpeed = 0.32;
const MaxSpeed = 0.64;
const JumpVelocity = 0.72;
const Gravity = 0.0032;

function createIdleState(bestDistance = 0, spotIndex = 0, runId = 0): RunnerState {
  return {
    mode: "idle",
    distance: 0,
    bestDistance,
    speed: StartSpeed,
    jumpY: 0,
    velocity: 0,
    nextSpawnAt: 34,
    cleared: 0,
    spotIndex,
    runId,
    message: "Press Space, click, or tap to start. Jump over lineup hazards.",
    obstacles: [],
  };
}

function cloneState(state: RunnerState): RunnerState {
  return {
    ...state,
    obstacles: state.obstacles.map((obstacle) => ({ ...obstacle })),
  };
}

function getSpot(index: number) {
  return spots[index % spots.length];
}

function getSpawnGap(distance: number) {
  const easing = Math.min(distance / 850, 1);
  return 54 - easing * 18 + Math.random() * 24;
}

function pickObstacle(distance: number) {
  const options = obstacleTemplates.filter((template) => distance >= template.minDistance);
  const sharkChance = distance > 520 && Math.random() > 0.88;
  if (sharkChance) {
    return obstacleTemplates.find((template) => template.kind === "shark") ?? options[0];
  }
  return options[Math.floor(Math.random() * options.length)] ?? obstacleTemplates[0];
}

function makeObstacle(id: number, sceneWidth: number, distance: number): Obstacle {
  const template = pickObstacle(distance);
  return {
    ...template,
    id,
    x: sceneWidth + 110 + Math.random() * 90,
    cleared: false,
  };
}

function hasCollision(obstacle: Obstacle, jumpY: number) {
  const surfer = {
    left: SurferX + 14,
    right: SurferX + SurferWidth - 8,
    bottom: WaterlineBottom + jumpY + 9,
    top: WaterlineBottom + jumpY + SurferHeight - 8,
  };
  const hazard = {
    left: obstacle.x + 6,
    right: obstacle.x + obstacle.width - 6,
    bottom: obstacle.bottom,
    top: obstacle.bottom + obstacle.height,
  };

  return (
    surfer.left < hazard.right &&
    surfer.right > hazard.left &&
    surfer.bottom < hazard.top &&
    surfer.top > hazard.bottom
  );
}

export default function SurfGame({ active = true }: { active?: boolean }) {
  const initialStateRef = useRef<RunnerState | null>(null);
  if (initialStateRef.current === null) {
    initialStateRef.current = createIdleState();
  }

  const runnerRef = useRef<RunnerState>(initialStateRef.current);
  const [snapshot, setSnapshot] = useState<RunnerState>(() => cloneState(runnerRef.current));
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const nextObstacleIdRef = useRef(1);
  const actionRef = useRef<() => void>(() => {});
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      trackEvent("surf_game_open");
    }
    wasActiveRef.current = active;
  }, [active]);

  const publish = useCallback(() => {
    setSnapshot(cloneState(runnerRef.current));
  }, []);

  const stopFrame = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const endRun = useCallback(
    (hitLabel: string) => {
      const state = runnerRef.current;
      const finalDistance = Math.floor(state.distance);
      state.mode = "wipeout";
      state.velocity = 0;
      state.lastHit = hitLabel;
      state.message = `${hitLabel} clipped your line. Press Space or tap to paddle back out.`;

      trackEvent("surf_wipeout", {
        spot: getSpot(state.spotIndex).name,
        obstacle: hitLabel,
        distance: finalDistance,
        cleared: state.cleared,
      });

      if (finalDistance > state.bestDistance) {
        state.bestDistance = finalDistance;
        trackEvent("surf_best_score", {
          spot: getSpot(state.spotIndex).name,
          distance: finalDistance,
        });
      }

      stopFrame();
      publish();
    },
    [publish, stopFrame]
  );

  const tick = useCallback(
    (time: number) => {
      const state = runnerRef.current;
      if (state.mode !== "running") return;

      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      const delta = Math.min(time - lastTimeRef.current, 34);
      lastTimeRef.current = time;

      const sceneWidth = sceneRef.current?.clientWidth ?? 680;
      state.distance += delta * state.speed * 0.082;
      state.speed = Math.min(MaxSpeed, StartSpeed + state.distance / 1850);

      if (state.jumpY > 0 || state.velocity > 0) {
        state.velocity -= Gravity * delta;
        state.jumpY += state.velocity * delta;
        if (state.jumpY <= 0) {
          state.jumpY = 0;
          state.velocity = 0;
        }
      }

      if (state.distance >= state.nextSpawnAt) {
        state.obstacles.push(
          makeObstacle(nextObstacleIdRef.current, sceneWidth, state.distance)
        );
        nextObstacleIdRef.current += 1;
        state.nextSpawnAt = state.distance + getSpawnGap(state.distance);
      }

      for (const obstacle of state.obstacles) {
        obstacle.x -= state.speed * delta;
        if (!obstacle.cleared && obstacle.x + obstacle.width < SurferX) {
          obstacle.cleared = true;
          state.cleared += 1;
          if (state.cleared % 5 === 0) {
            state.message = `${state.cleared} hazards cleared. Speed is building.`;
            trackEvent("surf_obstacle_clear", {
              spot: getSpot(state.spotIndex).name,
              cleared: state.cleared,
              distance: Math.floor(state.distance),
            });
          }
        }
      }

      state.obstacles = state.obstacles.filter((obstacle) => obstacle.x > -120);

      const collision = state.obstacles.find((obstacle) =>
        hasCollision(obstacle, state.jumpY)
      );
      if (collision) {
        endRun(collision.label);
        return;
      }

      publish();
      frameRef.current = window.requestAnimationFrame(tick);
    },
    [endRun, publish]
  );

  const startRun = useCallback(() => {
    const current = runnerRef.current;
    const nextSpotIndex =
      current.mode === "wipeout" ? (current.spotIndex + 1) % spots.length : current.spotIndex;
    runnerRef.current = {
      ...createIdleState(current.bestDistance, nextSpotIndex, current.runId + 1),
      mode: "running",
      message: "Hold your line. Space, click, or tap to jump.",
    };
    lastTimeRef.current = 0;
    stopFrame();
    publish();
    trackEvent("surf_run_start", {
      spot: getSpot(nextSpotIndex).name,
      run: runnerRef.current.runId,
    });
    frameRef.current = window.requestAnimationFrame(tick);
  }, [publish, stopFrame, tick]);

  const performAction = useCallback(() => {
    const state = runnerRef.current;
    if (state.mode !== "running") {
      startRun();
      return;
    }

    if (state.jumpY > 4) return;

    state.velocity = JumpVelocity;
    state.jumpY = 1;
    state.message = "Clean pop-up. Land before the next hazard.";
    trackEvent("surf_jump", {
      spot: getSpot(state.spotIndex).name,
      distance: Math.floor(state.distance),
    });
    publish();
  }, [publish, startRun]);

  useEffect(() => {
    actionRef.current = performAction;
  }, [performAction]);

  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === "ArrowUp") {
        event.preventDefault();
        actionRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  useEffect(() => {
    return () => stopFrame();
  }, [stopFrame]);

  const spot = getSpot(snapshot.spotIndex);
  const distance = Math.floor(snapshot.distance);
  const pace = (snapshot.speed / StartSpeed).toFixed(1);
  const isJumping = snapshot.jumpY > 6;
  const overlayTitle =
    snapshot.mode === "idle"
      ? "Lineup Runner"
      : snapshot.mode === "wipeout"
        ? "Wipeout"
        : "";
  const overlayCopy =
    snapshot.mode === "idle"
      ? "Press Space, click, or tap. Jump the hazards and stay on the wave."
      : snapshot.mode === "wipeout"
        ? `${distance}m at ${spot.name}. ${snapshot.message}`
        : "";

  return (
    <div
      className="surf-game"
      tabIndex={0}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        performAction();
      }}
    >
      <div className="surf-header">
        <div>
          <div className="window-kicker">Surf.app</div>
          <h1>Lineup Runner</h1>
        </div>
        <div className="surf-scoreboard" aria-label="Surf score">
          <span>{distance}m</span>
          <span>best {snapshot.bestDistance}m</span>
          <span>cleared {snapshot.cleared}</span>
          <span>pace {pace}x</span>
        </div>
      </div>

      <div className="surf-conditions">
        <span>{spot.name}</span>
        <span>swell {spot.swell}</span>
        <span>{spot.wind}</span>
        <span>tide {spot.tide}</span>
      </div>

      <div
        ref={sceneRef}
        className={`surf-scene surf-runner-scene ${snapshot.mode}`}
        aria-label="Lineup runner surf game"
      >
        <div className="surf-sky">
          <span className="surf-cloud cloud-one" />
          <span className="surf-cloud cloud-two" />
        </div>
        <div className="surf-sun" />
        <div className="surf-headland" />
        <div className="surf-water" />
        <div className="surf-whitewater" />
        <div className="surf-wave-face">
          <span className="wave-lip" />
          <span className="wave-foam foam-one" />
          <span className="wave-foam foam-two" />
        </div>
        <div className="surf-wave-curl">
          <span className="curl-pocket" />
          <span className="curl-spray spray-one" />
          <span className="curl-spray spray-two" />
        </div>
        <div className="surf-face-line line-one" />
        <div className="surf-face-line line-two" />
        <div
          className={`surf-runner-surfer ${isJumping ? "jumping" : ""}`}
          style={{ left: SurferX, bottom: WaterlineBottom + snapshot.jumpY }}
        >
          <span className="surfer-shadow" />
          <span className="surfer-body">
            <span className="surfer-head" />
            <span className="surfer-torso" />
            <span className="surfer-arm front" />
            <span className="surfer-arm back" />
          </span>
          <span className="surfboard">JK</span>
        </div>
        {snapshot.obstacles.map((obstacle) => (
          <div
            key={obstacle.id}
            className={`runner-obstacle obstacle-${obstacle.kind} ${
              obstacle.cleared ? "cleared" : ""
            }`}
            style={{
              left: obstacle.x,
              bottom: obstacle.bottom,
              width: obstacle.width,
              height: obstacle.height,
            }}
            aria-label={obstacle.label}
          >
            <span />
          </div>
        ))}
        {snapshot.mode !== "running" && (
          <div className={`surf-overlay ${snapshot.mode}`}>
            <strong>{overlayTitle}</strong>
            <span>{overlayCopy}</span>
          </div>
        )}
      </div>

      <div className={`surf-result ${snapshot.mode}`}>
        <strong>
          {snapshot.mode === "running"
            ? "Stay on the face."
            : snapshot.mode === "wipeout"
              ? `${snapshot.lastHit ?? "Hazard"} got you.`
              : "One-button surf runner."}
        </strong>
        <span>{snapshot.message}</span>
      </div>

      <button type="button" className="surf-action" onClick={performAction}>
        {snapshot.mode === "running"
          ? "Jump"
          : snapshot.mode === "wipeout"
            ? "Restart"
            : "Start run"}
      </button>
    </div>
  );
}
