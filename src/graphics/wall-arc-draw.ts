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

export interface WallArcDrawParams {
  arcProgress: number;
  lightOpacity: number;
  headOpacity: number;
  arcOpacity: number;
  style?: Partial<WallArcDrawStyle>;
}

const DEFAULT_STYLE: WallArcDrawStyle = {
  lineWidth: 8,
  headRadius: 9,
  strokeStyle: "#ffffff",
  headFillStyle: "#ffffff",
};

const withAlpha = (hex: string, alpha: number): string => {
  const a = Math.min(Math.max(alpha, 0), 1);
  if (a <= 0) return "rgba(0,0,0,0)";
  if (hex.startsWith("#") && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return hex;
};

/** Draw the wall arc (2D screen line only) onto a 2D canvas context. */
export const drawWallArc = (
  ctx: CanvasRenderingContext2D,
  size: number,
  params: WallArcDrawParams
): void => {
  const {
    arcProgress,
    lightOpacity,
    headOpacity,
    arcOpacity,
    style = {},
  } = params;
  const { lineWidth, headRadius, strokeStyle, headFillStyle } = {
    ...DEFAULT_STYLE,
    ...style,
  };
  const { cx, cy, radius } = getCanvasArcParams(size);

  ctx.clearRect(0, 0, size, size);

  const strokeAlpha = lightOpacity * arcOpacity;
  const headAlpha = lightOpacity * headOpacity;

  const drawHeadAt = (angle: number) => {
    if (headAlpha <= 0) return;
    const hx = cx + Math.cos(angle) * radius;
    const hy = cy + Math.sin(angle) * radius;
    ctx.fillStyle = withAlpha(headFillStyle ?? "#ffffff", headAlpha);
    ctx.beginPath();
    ctx.arc(hx, hy, headRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  if (arcProgress <= 0) {
    drawHeadAt(ARC_START_ANGLE);
    return;
  }

  const sweep = getArcSweep(arcProgress);
  const endAngle = ARC_START_ANGLE + sweep;

  if (strokeAlpha > 0 && sweep > 0) {
    ctx.strokeStyle = withAlpha(strokeStyle ?? "#ffffff", strokeAlpha);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.arc(cx, cy, radius, ARC_START_ANGLE, endAngle);
    ctx.stroke();
  }

  drawHeadAt(endAngle);
};
