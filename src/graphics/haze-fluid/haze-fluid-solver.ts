import * as THREE from "three";
import {
  advectDensityFragment,
  clearDensityFragment,
  fullscreenVertex,
  splatDensityFragment,
} from "./haze-fluid-shaders";

const SIM_SIZE = 192;

export interface HazeFluidStepParams {
  delta: number;
  time: number;
  lightOpacity: number;
  arcProgress: number;
  playing: boolean;
}

/**
 * Low-res 2D density field in beam UV space (arc × depth along ruling).
 */
export class HazeFluidSolver {
  private readonly _renderer: THREE.WebGLRenderer;
  private readonly _camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly _quad: THREE.Mesh;
  private readonly _rtA: THREE.WebGLRenderTarget;
  private readonly _rtB: THREE.WebGLRenderTarget;
  private _readIndex = 0;
  private readonly _advectMaterial: THREE.ShaderMaterial;
  private readonly _splatMaterial: THREE.ShaderMaterial;
  private readonly _clearMaterial: THREE.ShaderMaterial;
  private _initialized = false;

  constructor(renderer: THREE.WebGLRenderer) {
    this._renderer = renderer;

    const rtOpts: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RedFormat,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this._rtA = new THREE.WebGLRenderTarget(SIM_SIZE, SIM_SIZE, rtOpts);
    this._rtB = new THREE.WebGLRenderTarget(SIM_SIZE, SIM_SIZE, rtOpts);

    const texel = new THREE.Vector2(1 / SIM_SIZE, 1 / SIM_SIZE);

    this._advectMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: advectDensityFragment,
      uniforms: {
        uDensity: { value: null as THREE.Texture | null },
        uTime: { value: 0 },
        uDt: { value: 0.016 },
        uSwirl: { value: 1.2 },
        uDissipation: { value: 0.992 },
        uTexelSize: { value: texel },
      },
      depthTest: false,
      depthWrite: false,
    });

    this._splatMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: splatDensityFragment,
      uniforms: {
        uDensity: { value: null as THREE.Texture | null },
        uPoint: { value: new THREE.Vector2(0.5, 0.04) },
        uRadius: { value: 0.008 },
        uStrength: { value: 0.15 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this._clearMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: clearDensityFragment,
      uniforms: { uValue: { value: 0 } },
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this._quad = new THREE.Mesh(geometry, this._clearMaterial);
    this._quad.frustumCulled = false;
  }

  get densityTexture(): THREE.Texture {
    return this._readTarget().texture;
  }

  private _readTarget(): THREE.WebGLRenderTarget {
    return this._readIndex === 0 ? this._rtA : this._rtB;
  }

  private _writeTarget(): THREE.WebGLRenderTarget {
    return this._readIndex === 0 ? this._rtB : this._rtA;
  }

  private _swap(): void {
    this._readIndex = 1 - this._readIndex;
  }

  private _renderPass(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget
  ): void {
    this._quad.material = material;
    const prev = this._renderer.getRenderTarget();
    this._renderer.setRenderTarget(target);
    this._renderer.render(this._quad, this._camera);
    this._renderer.setRenderTarget(prev);
  }

  private _ensureInit(): void {
    if (this._initialized) return;
    this._renderPass(this._clearMaterial, this._rtA);
    this._renderPass(this._clearMaterial, this._rtB);
    this._initialized = true;
  }

  step(params: HazeFluidStepParams): void {
    this._ensureInit();
    if (!params.playing) return;

    const dt = Math.min(params.delta, 0.05) * 1.2;
    const read = this._readTarget();
    const write = this._writeTarget();

    const advect = this._advectMaterial.uniforms;
    advect.uDensity!.value = read.texture;
    advect.uTime!.value = params.time;
    advect.uDt!.value = dt;
    advect.uSwirl!.value = 0.8 + params.lightOpacity * 0.6;
    this._renderPass(this._advectMaterial, write);
    this._swap();

    if (params.lightOpacity > 0.01) {
      const splat = this._splatMaterial.uniforms;
      splat.uStrength!.value = 0.08 * params.lightOpacity * dt * 60;
      splat.uRadius!.value = 0.006 + params.arcProgress * 0.004;

      const arcSpan = Math.max(params.arcProgress, 0.02);
      const splatCount = 3;
      for (let i = 0; i < splatCount; i++) {
        const readRt = this._readTarget();
        const writeRt = this._writeTarget();
        const u = fract(
          0.5 +
            (i / splatCount - 0.5) * arcSpan +
            Math.sin(params.time * 0.7 + i) * 0.02
        );
        (splat.uPoint!.value as THREE.Vector2).set(u, 0.03 + i * 0.008);
        splat.uDensity!.value = readRt.texture;
        this._renderPass(this._splatMaterial, writeRt);
        this._swap();
      }
    }
  }

  dispose(): void {
    this._rtA.dispose();
    this._rtB.dispose();
    this._advectMaterial.dispose();
    this._splatMaterial.dispose();
    this._clearMaterial.dispose();
    this._quad.geometry.dispose();
  }
}

function fract(x: number): number {
  return x - Math.floor(x);
}
