export type SequenceStageId =
  | "black-open"
  | "title-in"
  | "title-hold"
  | "title-out"
  | "black-pre"
  | "dot-in"
  | "dot-pause-start"
  | "dot-move"
  | "dot-pause-end"
  | "dot-out"
  | "circle-pause"
  | "circle-out"
  | "black-close";

export interface SequenceStage {
  id: SequenceStageId;
  label: string;
  durationSec: number;
}

export interface SequenceState {
  stageId: SequenceStageId;
  stageLabel: string;
  /** 0–1 progress within the current stage. */
  stageT: number;
  /** Seconds from the start of the full sequence (after loop wrap). */
  sequenceTimeSec: number;
  /** Arc draw progress 0–1; advances only during dot-move. */
  arcProgress: number;
  /** Master projector brightness — drives wall and cone scatter. */
  lightOpacity: number;
  titleOpacity: number;
  headOpacity: number;
  /** Wall stroke opacity (separate fade on circle-out). */
  arcOpacity: number;
}
