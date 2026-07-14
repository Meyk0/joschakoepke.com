"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { currentLayout, trackEvent, trackMeaningfulAction } from "@/lib/analytics";

type SurfSpot = {
  name: string;
};

type RunnerMode = "idle" | "running" | "wipeout";
type ObstacleKind = "shark" | "sea-lion" | "retriever";

type ObstacleTemplate = {
  kind: ObstacleKind;
  label: string;
  width: number;
  height: number;
  bottom: number;
  minDistance: number;
  role?: "hazard" | "bonus";
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
  stoke: number;
  spotIndex: number;
  runId: number;
  message: string;
  lastHit?: string;
  obstacles: Obstacle[];
};

type LeaderboardEntry = {
  id: string;
  name: string;
  distance: number;
  cleared: number;
  createdAt: string;
};

const LeaderboardStorageKey = "joscha-surf-leaderboard-v1";
const PlayerNameStorageKey = "joscha-surf-player-name-v1";

const spots: SurfSpot[] = [
  { name: "Ocean Beach" },
  { name: "Linda Mar" },
  { name: "Steamer Lane" },
  { name: "Pleasure Point" },
  { name: "Fort Point" },
  { name: "Bolinas" },
  { name: "Stinson Beach" },
  { name: "Salmon Creek" },
  { name: "Mavericks" },
];

const obstacleTemplates: ObstacleTemplate[] = [
  { kind: "sea-lion", label: "sea lion pop-up", width: 58, height: 40, bottom: 66, minDistance: 0 },
  { kind: "shark", label: "great white shark", width: 70, height: 52, bottom: 62, minDistance: 0 },
  {
    kind: "retriever",
    label: "golden retriever cameo",
    width: 50,
    height: 60,
    bottom: 61,
    minDistance: 0,
    role: "bonus",
  },
];

const obstacleImages: Partial<Record<ObstacleKind, string>> = {
  "sea-lion": "/surf/obstacles/sea-lion.png",
  retriever: "/surf/obstacles/retriever.png",
  shark: "/surf/obstacles/shark.png",
};

const obstacleImageSources = Object.values(obstacleImages);

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
    stoke: 0,
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

function getObstacleScale(distance: number) {
  return 0.62 + Math.min(distance / 800, 1) * 0.38;
}

function pickObstacle(id: number) {
  const bonus = obstacleTemplates.find((template) => template.kind === "retriever");
  if (bonus && id % 3 === 0) {
    return bonus;
  }

  const hazardSequence: ObstacleKind[] = ["shark", "sea-lion"];
  const nextKind = hazardSequence[(id - 1) % hazardSequence.length];
  const options = obstacleTemplates.filter(
    (template) => template.role !== "bonus" && template.kind === nextKind
  );
  return options[Math.floor(Math.random() * options.length)] ?? obstacleTemplates[0];
}

function makeObstacle(id: number, sceneWidth: number, distance: number): Obstacle {
  const template = pickObstacle(id);
  const scale = getObstacleScale(distance);

  return {
    ...template,
    width: Math.round(template.width * scale),
    height: Math.round(template.height * scale),
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

function sanitizePlayerName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
}

function loadLeaderboard() {
  try {
    const stored = window.localStorage.getItem(LeaderboardStorageKey);
    const parsed = stored ? (JSON.parse(stored) as LeaderboardEntry[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry) =>
          typeof entry?.name === "string" &&
          typeof entry?.distance === "number" &&
          typeof entry?.cleared === "number"
      )
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 10);
  } catch {
    return [];
  }
}

export default function SurfGame({ active = true }: { active?: boolean }) {
  const initialStateRef = useRef<RunnerState | null>(null);
  if (initialStateRef.current === null) {
    initialStateRef.current = createIdleState();
  }

  const runnerRef = useRef<RunnerState>(initialStateRef.current);
  const [snapshot, setSnapshot] = useState<RunnerState>(() => cloneState(runnerRef.current));
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const nextObstacleIdRef = useRef(1);
  const actionRef = useRef<() => void>(() => {});
  const wasActiveRef = useRef(false);

  useEffect(() => {
    setLeaderboard(loadLeaderboard());
    setPlayerName(window.localStorage.getItem(PlayerNameStorageKey) ?? "");
  }, []);

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
      setScoreSubmitted(false);
      setSubmittedRank(null);
      setShowLeaderboard(true);

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
        if (
          obstacle.role !== "bonus" &&
          !obstacle.cleared &&
          obstacle.x + obstacle.width < SurferX
        ) {
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

      const bonus = state.obstacles.find(
        (obstacle) =>
          obstacle.role === "bonus" &&
          !obstacle.cleared &&
          hasCollision(obstacle, state.jumpY)
      );
      if (bonus) {
        bonus.cleared = true;
        state.stoke += 25;
        state.message = "Golden retriever party wave. +25 stoke.";
        trackEvent("surf_bonus_collect", {
          spot: getSpot(state.spotIndex).name,
          bonus: bonus.label,
          distance: Math.floor(state.distance),
        });
      }

      const collision = state.obstacles.find((obstacle) =>
        obstacle.role !== "bonus" && hasCollision(obstacle, state.jumpY)
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
    trackMeaningfulAction("surf_run", { layout: currentLayout() });
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
      if ((event.target as HTMLElement | null)?.matches("input, textarea")) return;
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
        ? `${distance}m. ${snapshot.message}`
        : "";

  const submitScore = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (snapshot.mode !== "wipeout" || scoreSubmitted) return;

    const name = sanitizePlayerName(playerName);
    if (!name) return;

    const entry: LeaderboardEntry = {
      id: `${Date.now()}-${snapshot.runId}`,
      name,
      distance,
      cleared: snapshot.cleared,
      createdAt: new Date().toISOString(),
    };
    const next = [...leaderboard, entry]
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 10);
    const rank = next.findIndex((item) => item.id === entry.id) + 1;

    window.localStorage.setItem(LeaderboardStorageKey, JSON.stringify(next));
    window.localStorage.setItem(PlayerNameStorageKey, name);
    setPlayerName(name);
    setLeaderboard(next);
    setScoreSubmitted(true);
    setSubmittedRank(rank || null);
    trackMeaningfulAction("surf_score_submit", { layout: currentLayout() });
    trackEvent("surf_score_submit", {
      distance,
      cleared: snapshot.cleared,
      rank: rank || 10,
      layout: currentLayout(),
    });
  };

  return (
    <div
      className="surf-game"
      tabIndex={0}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button, input, form, label")) return;
        performAction();
      }}
    >
      <div className="surf-image-preload" aria-hidden="true">
        {obstacleImageSources.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
      <div className="surf-header">
        <div>
          <div className="window-kicker">Surf.app</div>
          <h1>Lineup Runner</h1>
        </div>
        <div className="surf-scoreboard" aria-label="Surf score">
          <span>{distance}m</span>
          <span>best {snapshot.bestDistance}m</span>
          <span>cleared {snapshot.cleared}</span>
          {snapshot.stoke > 0 && <span>stoke {snapshot.stoke}</span>}
          <span>pace {pace}x</span>
        </div>
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
        {snapshot.obstacles.map((obstacle) => {
          const imageSrc = obstacleImages[obstacle.kind];

          return (
            <div
              key={obstacle.id}
              className={`runner-obstacle obstacle-${obstacle.kind} ${
                imageSrc ? "has-image" : ""
              } ${obstacle.cleared ? "cleared" : ""}`}
              style={{
                left: obstacle.x,
                bottom: obstacle.bottom,
                width: obstacle.width,
                height: obstacle.height,
              }}
              aria-label={obstacle.label}
            >
              {imageSrc ? (
                <img src={imageSrc} alt="" draggable={false} />
              ) : (
                <span />
              )}
            </div>
          );
        })}
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

      {showLeaderboard && (
        <div className="surf-score-sheet" role="dialog" aria-label="Surf leaderboard">
          <section className="surf-leaderboard-panel" aria-live="polite">
            <div className="surf-leaderboard-heading">
              <div>
                <strong>Leaderboard</strong>
                <span>This device</span>
              </div>
              <button type="button" onClick={() => setShowLeaderboard(false)}>
                Close
              </button>
            </div>
            {snapshot.mode === "wipeout" && !scoreSubmitted ? (
              <form className="surf-score-form" onSubmit={submitScore}>
                <label htmlFor="surf-player-name">Save your {distance}m run</label>
                <div>
                  <input
                    id="surf-player-name"
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    maxLength={16}
                    placeholder="Display name"
                    autoComplete="nickname"
                    aria-describedby="surf-score-privacy"
                  />
                  <button type="submit" disabled={!sanitizePlayerName(playerName)}>
                    Add score
                  </button>
                </div>
                <small id="surf-score-privacy">Saved only on this device.</small>
              </form>
            ) : snapshot.mode === "wipeout" && scoreSubmitted ? (
              <div className="surf-score-saved">
                <strong>Run saved{submittedRank ? ` at #${submittedRank}` : ""}.</strong>
                <span>This leaderboard stays on this device.</span>
              </div>
            ) : null}
          </section>

          <section className="surf-leaderboard">
            {leaderboard.length > 0 ? (
              <ol>
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <li key={entry.id}>
                    <span className="surf-rank">{index + 1}</span>
                    <strong>{entry.name}</strong>
                    <span>{entry.distance}m</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Finish a run to set the first score.</p>
            )}
          </section>
        </div>
      )}

      <div className="surf-actions">
        <button type="button" className="surf-action" onClick={performAction}>
          {snapshot.mode === "running"
            ? "Jump"
            : snapshot.mode === "wipeout"
              ? "Restart"
              : "Start run"}
        </button>
        {!showLeaderboard && snapshot.mode !== "running" && (
          <button
            type="button"
            className="surf-action secondary"
            onClick={() => {
              setShowLeaderboard(true);
              trackEvent("surf_leaderboard_view", {
                entry_count: leaderboard.length,
                layout: currentLayout(),
              });
            }}
          >
            Leaderboard
          </button>
        )}
      </div>
    </div>
  );
}
