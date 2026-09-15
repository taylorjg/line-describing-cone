import * as THREE from "three";
import type { EngineSettings } from "@app/settings/types";
import { getArcProgress } from "./arc-animation";
import {
  getCanvasArcParams,
  getArcSweep,
  ARC_START_ANGLE,
} from "./arc-geometry";

const TEXTURE_SIZE = 1024;
const LINE_WIDTH = 8;
const HEAD_RADIUS = 9;

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
    const { cx, cy, radius } = getCanvasArcParams(size);

    ctx.clearRect(0, 0, size, size);

    if (progress <= 0) {
      this.texture.needsUpdate = true;
      return;
    }

    const sweep = getArcSweep(progress);
    const endAngle = ARC_START_ANGLE + sweep;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.arc(cx, cy, radius, ARC_START_ANGLE, endAngle);
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
