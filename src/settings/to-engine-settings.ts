import type { ConeSettings, EngineSettings } from "./types";

export const toEngineSettings = (
  settings: ConeSettings,
  elapsedSec = 0
): EngineSettings => ({
  ...settings,
  elapsedSec,
});
