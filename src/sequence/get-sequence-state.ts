import { LDAC_STAGES, SEQUENCE_TOTAL_SEC } from "./ldac-sequence";
import type {
  SequenceStage,
  SequenceStageId,
  SequenceState,
} from "./sequence-types";

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const fadeIn = (t: number): number => t;
const fadeOut = (t: number): number => 1 - t;

interface ActiveStage {
  stage: SequenceStage;
  stageT: number;
  stageStartSec: number;
}

export const wrapSequenceTime = (timeSec: number): number => {
  if (SEQUENCE_TOTAL_SEC <= 0) return 0;
  const wrapped = timeSec % SEQUENCE_TOTAL_SEC;
  return wrapped < 0 ? wrapped + SEQUENCE_TOTAL_SEC : wrapped;
};

export const findActiveStage = (sequenceTimeSec: number): ActiveStage => {
  let remaining = sequenceTimeSec;

  for (const stage of LDAC_STAGES) {
    if (remaining < stage.durationSec) {
      return {
        stage,
        stageT: stage.durationSec > 0 ? remaining / stage.durationSec : 0,
        stageStartSec: sequenceTimeSec - remaining,
      };
    }
    remaining -= stage.durationSec;
  }

  const last = LDAC_STAGES[LDAC_STAGES.length - 1]!;
  return {
    stage: last,
    stageT: 1,
    stageStartSec: sequenceTimeSec - last.durationSec,
  };
};

const opacityForStage = (
  stageId: SequenceStageId,
  stageT: number
): Pick<
  SequenceState,
  "arcProgress" | "lightOpacity" | "titleOpacity" | "headOpacity" | "arcOpacity"
> => {
  switch (stageId) {
    case "black-open":
    case "black-pre":
    case "black-close":
      return {
        arcProgress: 0,
        lightOpacity: 0,
        titleOpacity: 0,
        headOpacity: 0,
        arcOpacity: 0,
      };

    case "title-in":
      return {
        arcProgress: 0,
        lightOpacity: 0,
        titleOpacity: fadeIn(stageT),
        headOpacity: 0,
        arcOpacity: 0,
      };

    case "title-hold":
      return {
        arcProgress: 0,
        lightOpacity: 0,
        titleOpacity: 1,
        headOpacity: 0,
        arcOpacity: 0,
      };

    case "title-out":
      return {
        arcProgress: 0,
        lightOpacity: 0,
        titleOpacity: fadeOut(stageT),
        headOpacity: 0,
        arcOpacity: 0,
      };

    case "dot-in":
      return {
        arcProgress: 0,
        lightOpacity: fadeIn(stageT),
        titleOpacity: 0,
        headOpacity: fadeIn(stageT),
        arcOpacity: 0,
      };

    case "dot-pause-start":
      return {
        arcProgress: 0,
        lightOpacity: 1,
        titleOpacity: 0,
        headOpacity: 1,
        arcOpacity: 0,
      };

    case "dot-move":
      return {
        arcProgress: stageT,
        lightOpacity: 1,
        titleOpacity: 0,
        headOpacity: 1,
        arcOpacity: 1,
      };

    case "dot-pause-end":
      return {
        arcProgress: 1,
        lightOpacity: 1,
        titleOpacity: 0,
        headOpacity: 1,
        arcOpacity: 1,
      };

    case "dot-out":
      return {
        arcProgress: 1,
        lightOpacity: 1,
        titleOpacity: 0,
        headOpacity: fadeOut(stageT),
        arcOpacity: 1,
      };

    case "circle-pause":
      return {
        arcProgress: 1,
        lightOpacity: 1,
        titleOpacity: 0,
        headOpacity: 0,
        arcOpacity: 1,
      };

    case "circle-out":
      return {
        arcProgress: 1,
        lightOpacity: fadeOut(stageT),
        titleOpacity: 0,
        headOpacity: 0,
        arcOpacity: fadeOut(stageT),
      };
  }
};

export const getSequenceState = (
  timeSec: number,
  loop = true
): SequenceState => {
  const sequenceTimeSec = loop
    ? wrapSequenceTime(timeSec)
    : Math.max(0, timeSec);
  const { stage, stageT } = findActiveStage(sequenceTimeSec);
  const opacities = opacityForStage(stage.id, stageT);

  return {
    stageId: stage.id,
    stageLabel: stage.label,
    stageT,
    sequenceTimeSec,
    ...opacities,
  };
};

/** Map engine playback/scrub settings to seconds on the LDAC timeline. */
export const getSequenceTimeFromPlayback = (options: {
  playing: boolean;
  elapsedSec: number;
  timeScale: number;
  progress: number;
}): number => {
  const { playing, elapsedSec, timeScale, progress } = options;

  if (playing) {
    return elapsedSec * timeScale;
  }

  let p = progress % 1;
  if (p < 0) p += 1;
  return p * SEQUENCE_TOTAL_SEC;
};

/** Linear fade helper exported for tests and draw code. */
export const sequenceOpacity = { lerp, fadeIn, fadeOut };
