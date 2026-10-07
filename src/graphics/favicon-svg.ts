import {
  ARC_START_ANGLE,
  getArcSweep,
  getCanvasArcParams,
} from "./arc-geometry";

/** Arc progress used for the site favicon (~60% of the full circle). */
export const FAVICON_ARC_PROGRESS = 0.6;

/** Stroke/head tuned for favicon raster sizes — not the in-scene wall texture. */
const FAVICON_LINE_WIDTH = 44;
const FAVICON_HEAD_RADIUS = 52;

const describeSvgArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const sweep = endAngle - startAngle;
  const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
  const sweepFlag = sweep > 0 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${x2} ${y2}`;
};

/** SVG favicon: white arc on black (matches wall-arc canvas drawing). */
export const buildFaviconSvg = (
  progress: number = FAVICON_ARC_PROGRESS,
  size = 512
): string => {
  const { cx, cy, radius } = getCanvasArcParams(size);
  const lineWidth = FAVICON_LINE_WIDTH;
  const headRadius = FAVICON_HEAD_RADIUS;

  if (progress <= 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#000"/></svg>`;
  }

  const endAngle = ARC_START_ANGLE + getArcSweep(progress);
  const arcPath = describeSvgArc(cx, cy, radius, ARC_START_ANGLE, endAngle);
  const hx = cx + Math.cos(endAngle) * radius;
  const hy = cy + Math.sin(endAngle) * radius;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#000"/>
  <path d="${arcPath}" fill="none" stroke="#fff" stroke-width="${lineWidth}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${hx}" cy="${hy}" r="${headRadius}" fill="#fff"/>
</svg>`;
};
