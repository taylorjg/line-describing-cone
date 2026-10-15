import type { SequenceStage } from "./sequence-types";

/** LDAC 2.0 production timeline inferred from McCall's authoring software. */
export const LDAC_STAGES: readonly SequenceStage[] = [
  { id: "black-open", label: "black", durationSec: 5 },
  { id: "title-in", label: "title in", durationSec: 2 },
  { id: "title-hold", label: "title", durationSec: 7 },
  { id: "title-out", label: "title out", durationSec: 2 },
  { id: "black-pre", label: "black", durationSec: 9 },
  { id: "dot-in", label: "dot in", durationSec: 2 },
  { id: "dot-pause-start", label: "dot pause", durationSec: 4 },
  { id: "dot-move", label: "dot move", durationSec: 1796 },
  { id: "dot-pause-end", label: "dot pause", durationSec: 16 },
  { id: "dot-out", label: "dot out", durationSec: 2 },
  { id: "circle-pause", label: "circle pause", durationSec: 16 },
  { id: "circle-out", label: "circle out", durationSec: 2 },
  { id: "black-close", label: "black", durationSec: 60 },
] as const;

export const SEQUENCE_TOTAL_SEC = LDAC_STAGES.reduce(
  (sum, stage) => sum + stage.durationSec,
  0
);

export const DOT_MOVE_DURATION_SEC =
  LDAC_STAGES.find((s) => s.id === "dot-move")?.durationSec ?? 1796;

/** Sequence time when dot-move begins. */
export const DOT_MOVE_START_SEC = LDAC_STAGES.slice(
  0,
  LDAC_STAGES.findIndex((s) => s.id === "dot-move")
).reduce((sum, stage) => sum + stage.durationSec, 0);
