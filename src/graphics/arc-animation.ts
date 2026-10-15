import type { EngineSettings } from "@app/settings/types";
import {
  getSequenceState,
  getSequenceTimeFromPlayback,
} from "@app/sequence/get-sequence-state";
import type { SequenceState } from "@app/sequence/sequence-types";

export const getSequenceStateFromSettings = (
  settings: EngineSettings
): SequenceState => {
  const timeSec = getSequenceTimeFromPlayback(settings);
  return getSequenceState(timeSec);
};

/** Effective arc progress 0–1 from the LDAC sequence (dot-move stage only). */
export const getArcProgress = (settings: EngineSettings): number =>
  getSequenceStateFromSettings(settings).arcProgress;
