import * as THREE from "three";
import type { EngineSettings } from "@app/settings/types";
import { getArcProgress } from "./arc-animation";
import { drawWallArc } from "./wall-arc-draw";

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
    drawWallArc(this.ctx, TEXTURE_SIZE, progress, {
      lineWidth: LINE_WIDTH,
      headRadius: HEAD_RADIUS,
    });
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
