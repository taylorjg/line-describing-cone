import type { EngineSettings } from "@app/settings/types";

/** Effective arc progress 0–1 from playback time or manual scrub. */
export const getArcProgress = (settings: EngineSettings): number => {
  const { playing, durationSec, timeScale, progress, elapsedSec } = settings;

  let value = playing
    ? (elapsedSec * timeScale) / Math.max(durationSec, 0.001)
    : progress;

  value = value % 1;
  if (value < 0) value += 1;

  return Math.min(Math.max(value, 0), 1);
};
