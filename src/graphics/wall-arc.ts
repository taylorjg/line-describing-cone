import * as THREE from "three";
import type { EngineSettings } from "@app/settings/types";
import { getArcProgress } from "./arc-animation";

const TEXTURE_SIZE = 1024;
const LINE_WIDTH = 8;
const HEAD_RADIUS = 9;
/** Fraction of texture used as arc radius — keep margin for round caps. */
const ARC_RADIUS_FACTOR = 0.44;
/** Vertical centre in texture space (0–1). */
const ARC_CENTER_Y = 0.5;

export class WallArc {
  readonly mesh: THREE.Mesh;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = TEXTURE_SIZE;
    this.canvas.height = TEXTURE_SIZE;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create 2D context for wall arc");
    }
    this.ctx = ctx;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    this.mesh.renderOrder = 1;
  }

  resize(width: number, height: number): void {
    this.mesh.scale.set(width, height, 1);
  }

  update(settings: EngineSettings): void {
    const progress = getArcProgress(settings);
    const ctx = this.ctx;
    const size = TEXTURE_SIZE;
    const cx = size * 0.5;
    const cy = size * ARC_CENTER_Y;
    const radius = size * ARC_RADIUS_FACTOR;

    ctx.clearRect(0, 0, size, size);

    if (progress <= 0) {
      this.texture.needsUpdate = true;
      return;
    }

    const startAngle = Math.PI * 0.5;
    const sweep = progress * Math.PI * 2;
    const endAngle = startAngle + sweep;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();

    const hx = cx + Math.cos(endAngle) * radius;
    const hy = cy + Math.sin(endAngle) * radius;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(hx, hy, HEAD_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
