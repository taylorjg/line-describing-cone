import {
  ARC_START_ANGLE,
  getArcSweep,
  getCanvasArcParams,
} from "./arc-geometry";

export interface WallArcDrawStyle {
  lineWidth: number;
  headRadius: number;
  strokeStyle?: string;
  headFillStyle?: string;
}

const DEFAULT_STYLE: WallArcDrawStyle = {
  lineWidth: 8,
  headRadius: 9,
  strokeStyle: "#ffffff",
  headFillStyle: "#ffffff",
};

/** Draw the wall arc (2D screen line only) onto a 2D canvas context. */
export const drawWallArc = (
  ctx: CanvasRenderingContext2D,
  size: number,
  progress: number,
  style: Partial<WallArcDrawStyle> = {}
): void => {
  const { lineWidth, headRadius, strokeStyle, headFillStyle } = {
    ...DEFAULT_STYLE,
    ...style,
  };
  const { cx, cy, radius } = getCanvasArcParams(size);

  ctx.clearRect(0, 0, size, size);

  if (progress <= 0) return;

  const sweep = getArcSweep(progress);
  const endAngle = ARC_START_ANGLE + sweep;

  ctx.strokeStyle = strokeStyle ?? "#ffffff";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.arc(cx, cy, radius, ARC_START_ANGLE, endAngle);
  ctx.stroke();

  const hx = cx + Math.cos(endAngle) * radius;
  const hy = cy + Math.sin(endAngle) * radius;
  ctx.fillStyle = headFillStyle ?? "#ffffff";
  ctx.beginPath();
  ctx.arc(hx, hy, headRadius, 0, Math.PI * 2);
  ctx.fill();
};
