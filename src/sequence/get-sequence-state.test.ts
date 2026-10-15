import assert from "node:assert/strict";
import { DOT_MOVE_START_SEC, SEQUENCE_TOTAL_SEC } from "./ldac-sequence";
import { getSequenceState, wrapSequenceTime } from "./get-sequence-state";

const approx = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${b}, got ${a}`);

// Opening black
approx(getSequenceState(0).lightOpacity, 0);
approx(getSequenceState(4.9).lightOpacity, 0);

// Title fade in mid-stage
approx(getSequenceState(6).titleOpacity, 0.5);

// Dot move start
const atMoveStart = getSequenceState(DOT_MOVE_START_SEC);
assert.equal(atMoveStart.stageId, "dot-move");
approx(atMoveStart.arcProgress, 0);
approx(atMoveStart.lightOpacity, 1);

// Dot move end (just before next stage)
const atMoveEnd = getSequenceState(DOT_MOVE_START_SEC + 1796 - 0.001);
approx(atMoveEnd.arcProgress, 1, 1e-3);

// Circle out fades light and arc together
const circleOut = getSequenceState(1862);
assert.equal(circleOut.stageId, "circle-out");
approx(circleOut.lightOpacity, 0.5);
approx(circleOut.arcOpacity, 0.5);

// Loop wrap
approx(wrapSequenceTime(SEQUENCE_TOTAL_SEC), 0);
approx(getSequenceState(SEQUENCE_TOTAL_SEC + 6).titleOpacity, 0.5);

console.log("get-sequence-state tests passed");
