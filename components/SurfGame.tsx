"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type SurfSpot = {
  name: string;
  swell: string;
  wind: string;
  tide: string;
  speed: number;
  risk: number;
};

type SurfResult = {
  label: string;
  detail: string;
  tone: "miss" | "good" | "perfect" | "wipeout";
  ride: number;
};

const TargetProgress = 68;
const RoundDurationMs = 4200;
const spots: SurfSpot[] = [
  { name: "Ocean Beach", swell: "4-6 ft", wind: "light offshore", tide: "mid", speed: 1.04, risk: 1.1 },
  { name: "Linda Mar", swell: "3-4 ft", wind: "clean morning", tide: "incoming", speed: 0.92, risk: 0.82 },
  { name: "Steamer Lane", swell: "4 ft", wind: "glassy", tide: "mid", speed: 0.98, risk: 0.9 },
  { name: "Pleasure Point", swell: "3 ft", wind: "light cross-shore", tide: "high", speed: 0.88, risk: 0.76 },
  { name: "Fort Point", swell: "3-5 ft", wind: "under the bridge", tide: "outgoing", speed: 1.02, risk: 1 },
  { name: "Bolinas", swell: "2-3 ft", wind: "soft", tide: "mid", speed: 0.84, risk: 0.7 },
  { name: "Stinson Beach", swell: "2-4 ft", wind: "calm", tide: "incoming", speed: 0.9, risk: 0.78 },
  { name: "Salmon Creek", swell: "4-5 ft", wind: "crisp", tide: "low", speed: 1.08, risk: 1.08 },
  { name: "Mavericks", swell: "12 ft", wind: "serious", tide: "low", speed: 1.28, risk: 1.8 },
];

function getSpot(round: number) {
  if (round > 0 && round % 9 === 0) {
    return spots[8];
  }
  return spots[round % 8];
}

function getResult(delta: number, spot: SurfSpot): SurfResult {
  const riskBonus = spot.risk;
  if (delta < -18) {
    return {
      label: "Too early",
      detail: "Paddled before the wave stood up. It rolled under you.",
      tone: "miss",
      ride: 0,
    };
  }
  if (delta < -7) {
    return {
      label: "Shoulder ride",
      detail: "You found the shoulder and trimmed down the line.",
      tone: "good",
      ride: Math.round(54 * riskBonus + Math.abs(delta)),
    };
  }
  if (delta <= 7) {
    return {
      label: "Clean takeoff",
      detail: "Perfect read. Early paddle, calm pop-up, clean line.",
      tone: "perfect",
      ride: Math.round(118 * riskBonus + (7 - Math.abs(delta)) * 5),
    };
  }
  if (delta <= 16) {
    return {
      label: "Late drop",
      detail: "A little spicy, but you made the section.",
      tone: "good",
      ride: Math.round(72 * riskBonus + (16 - delta) * 2),
    };
  }
  return {
    label: "Over the falls",
    detail: "Too late. The lip got there first.",
    tone: "wipeout",
    ride: 0,
  };
}

export default function SurfGame({ active = true }: { active?: boolean }) {
  const [round, setRound] = useState(0);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SurfResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestRide, setBestRide] = useState(0);
  const [stoke, setStoke] = useState(0);
  const startedAtRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const currentProgressRef = useRef(0);
  const wasActiveRef = useRef(false);
  const paddleRef = useRef<() => void>(() => {});
  const spot = useMemo(() => getSpot(round), [round]);

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      trackEvent("surf_game_open");
    }
    wasActiveRef.current = active;
  }, [active]);

  const stopFrame = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const startRound = useCallback(() => {
    const nextRound = result ? round + 1 : round;
    const nextSpot = getSpot(nextRound);
    const nextDuration = RoundDurationMs / nextSpot.speed;
    stopFrame();
    setRound(nextRound);
    startedAtRef.current = performance.now();
    currentProgressRef.current = 0;
    setProgress(0);
    setResult(null);
    setRunning(true);
    trackEvent("surf_round_start", { spot: nextSpot.name, round: nextRound + 1 });

    const tick = (time: number) => {
      const nextProgress = Math.min(
        ((time - startedAtRef.current) / nextDuration) * 100,
        100
      );
      currentProgressRef.current = nextProgress;
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        setRunning(false);
        const missed: SurfResult = {
          label: "Missed set",
          detail: "You waited too long. The wave went unridden.",
          tone: "miss",
          ride: 0,
        };
        setResult(missed);
        setStreak(0);
        trackEvent("surf_result", {
          spot: nextSpot.name,
          result: missed.label,
          ride: 0,
        });
        return;
      }
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
  }, [result, round, stopFrame]);

  const paddle = useCallback(() => {
    if (!running) {
      startRound();
      return;
    }

    stopFrame();
    setRunning(false);
    const delta = currentProgressRef.current - TargetProgress;
    const nextResult = getResult(delta, spot);
    setResult(nextResult);
    setStoke((value) => value + nextResult.ride);
    setBestRide((value) => Math.max(value, nextResult.ride));
    setStreak((value) =>
      nextResult.tone === "perfect" || nextResult.tone === "good"
        ? value + 1
        : 0
    );
    trackEvent("surf_attempt", {
      spot: spot.name,
      timing_delta: Math.round(delta),
      result: nextResult.label,
      ride: nextResult.ride,
    });
    trackEvent("surf_result", {
      spot: spot.name,
      result: nextResult.label,
      ride: nextResult.ride,
    });
    if (nextResult.tone === "perfect") {
      trackEvent("surf_perfect_ride", {
        spot: spot.name,
        ride: nextResult.ride,
      });
    }
    if (nextResult.ride > bestRide) {
      trackEvent("surf_best_score", {
        spot: spot.name,
        ride: nextResult.ride,
      });
    }
  }, [bestRide, running, spot, startRound, stopFrame]);

  useEffect(() => {
    paddleRef.current = paddle;
  }, [paddle]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        paddleRef.current();
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

  const waveLeft = `${100 - progress}%`;
  const timingDistance = Math.abs(progress - TargetProgress);
  const isInPocket = running && timingDistance <= 7;

  return (
    <div
      className="surf-game"
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        paddle();
      }}
    >
      <div className="surf-header">
        <div>
          <div className="window-kicker">Dawn Patrol</div>
          <h1>Wave Timing</h1>
        </div>
        <div className="surf-scoreboard" aria-label="Surf score">
          <span>stoke {stoke}</span>
          <span>best {bestRide}m</span>
          <span>streak {streak}</span>
        </div>
      </div>

      <div className="surf-conditions">
        <span>{spot.name}</span>
        <span>swell {spot.swell}</span>
        <span>{spot.wind}</span>
        <span>tide {spot.tide}</span>
      </div>

      <div className="surf-scene" aria-label="Wave timing game">
        <div className="surf-sky" />
        <div className="surf-sun" />
        <div className="surf-water" />
        <div className={`takeoff-zone ${isInPocket ? "active" : ""}`}>
          <span>takeoff</span>
        </div>
        <div className="surf-wave" style={{ left: waveLeft }}>
          <span />
        </div>
        <div className={`surfer ${running ? "paddling" : ""}`}>
          <span className="surfer-head" />
          <span className="surfboard">JK</span>
        </div>
      </div>

      <div className={`surf-result ${result?.tone ?? "idle"}`}>
        <strong>{result ? result.label : "Watch the set roll in."}</strong>
        <span>
          {result
            ? `${result.detail}${result.ride ? ` Ride: ${result.ride}m.` : ""}`
            : "Pick your moment when the wave hits the takeoff zone."}
        </span>
      </div>

      <button
        type="button"
        className="surf-action"
        onClick={paddle}
      >
        {running ? "Paddle now" : result ? "Next wave" : "Start session"}
      </button>
    </div>
  );
}
