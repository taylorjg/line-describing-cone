import * as THREE from "three";
import type { EngineSettings } from "@app/settings/types";
import type { WallLayout } from "./scene-layout";
import { getArcProgress } from "./arc-animation";

/** Fraction of wall width/height used as arc radius (matches canvas texture). */
export const ARC_RADIUS_FACTOR = 0.44;
/** Vertical centre of arc in normalised texture space (0–1). */
export const ARC_CENTER_V = 0.5;
/** Arc begins at 6 o'clock (canvas / math convention). */
export const ARC_START_ANGLE = Math.PI * 0.5;

export const getArcSweep = (progress: number): number =>
  Math.max(0, progress) * Math.PI * 2;

/** Wall-plane point for a given arc angle (world space). */
export const getWallArcPoint = (
  angle: number,
  wall: WallLayout,
  target = new THREE.Vector3()
): THREE.Vector3 => {
  const localX = ARC_RADIUS_FACTOR * Math.cos(angle) * wall.width;
  const localY = -ARC_RADIUS_FACTOR * Math.sin(angle) * wall.height;
  return target.set(
    wall.center.x + localX,
    wall.center.y + localY,
    wall.center.z
  );
};

/** Sample points along the drawn portion of the arc (world space). */
export const sampleWallArcPoints = (
  settings: EngineSettings,
  wall: WallLayout,
  numSamples: number,
  out: THREE.Vector3[] = []
): THREE.Vector3[] => {
  out.length = 0;
  const progress = getArcProgress(settings);
  if (progress <= 0 || numSamples < 2) return out;

  const sweep = getArcSweep(progress);
  for (let i = 0; i < numSamples; i++) {
    const t = i / (numSamples - 1);
    const angle = ARC_START_ANGLE + sweep * t;
    out.push(getWallArcPoint(angle, wall));
  }
  return out;
};

/** Sample angle for arc parameter t in 0–1 along the drawn sweep. */
export const getArcAngle = (progress: number, t: number): number =>
  ARC_START_ANGLE + getArcSweep(progress) * t;

/** Point on the front-face aperture circle (z = 0), aligned with each wall ruling. */
export const getNarrowPointOnRuling = (
  wallPointLocal: THREE.Vector3,
  apexRadius: number,
  target = new THREE.Vector3()
): THREE.Vector3 => {
  const len = Math.hypot(wallPointLocal.x, wallPointLocal.y);
  if (len < 1e-6) return target.set(0, 0, 0);
  return target.set(
    (wallPointLocal.x / len) * apexRadius,
    (wallPointLocal.y / len) * apexRadius,
    0
  );
};

export const getCanvasArcParams = (size: number) => ({
  cx: size * 0.5,
  cy: size * ARC_CENTER_V,
  radius: size * ARC_RADIUS_FACTOR,
  startAngle: ARC_START_ANGLE,
});
