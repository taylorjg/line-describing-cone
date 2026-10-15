export type EngineStatus =
  { type: "idle" } | { type: "ready" } | { type: "cycle-complete" };

export interface ConeSettings {
  playing: boolean;
  /** Playback multiplier for development. */
  timeScale: number;
  /** Manual scrub 0–1 when paused. */
  progress: number;
  throwDistance: number;
  circleRadius: number;
  showControls: boolean;
}

export interface EngineSettings extends ConeSettings {
  elapsedSec: number;
}
