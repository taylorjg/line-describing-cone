import * as THREE from "three";
import type { EngineSettings } from "@app/settings/types";
import type { WallLayout } from "./scene-layout";
import { APEX_RADIUS } from "./scene-layout";
import { getNarrowPointOnRuling, sampleWallArcPoints } from "./arc-geometry";
import { ConeMembraneGeometry } from "./cone-membrane";

const ARC_SAMPLES = 96;

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 projectorPosition;
  uniform float scatterG;
  uniform float edgeMix;
  uniform float falloffPower;
  uniform float nearBoost;
  uniform float farAtten;
  uniform float glareStrength;
  uniform float membraneMax;
  uniform float minWeight;
  uniform float densityMin;
  uniform float densityMax;
  uniform float densityContrast;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float henyeyGreenstein(float cosTheta, float g) {
    float gg = g * g;
    return (1.0 - gg) / pow(max(1.0 + gg - 2.0 * g * cosTheta, 1e-4), 1.5);
  }

  void main() {
    vec3 toFrag = vWorldPos - projectorPosition;
    float dist = length(toFrag);

    // vUv.y runs narrow (projector) → wide (wall); hot at source, fade along the beam.
    float t = clamp(vUv.y, 0.0, 1.0);
    float distAtten = mix(farAtten, nearBoost, pow(1.0 - t, falloffPower));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 beamDir = dist > 1e-5 ? toFrag / dist : vec3(0.0, 0.0, -1.0);
    float cosTheta = dot(beamDir, viewDir);

    // Thin sheet: visible from both sides (DoubleSide); flip normal on back faces for rim.
    vec3 n = gl_FrontFacing ? vNormal : -vNormal;
    float edgeTerm = 1.0 - abs(dot(viewDir, n));
    float phasePeak = henyeyGreenstein(1.0, scatterG);
    float phase = henyeyGreenstein(cosTheta, scatterG) / phasePeak;
    float alongBeam = max(cosTheta, 0.0);
    float glareSuppress = 1.0 - glareStrength * alongBeam * alongBeam;
    float highlight = mix(edgeTerm, phase, edgeMix) * glareSuppress;
    // Keep a faint sheet visible face-on; rim still dominates at grazing angles.
    highlight = max(highlight, edgeTerm * 0.78);

    vec2 noiseCoord = vec2(vUv.y * 48.0, vUv.x * 12.0);
    float grain = valueNoise(noiseCoord);
    grain += 0.35 * valueNoise(noiseCoord * 2.1 + 17.0);
    grain /= 1.35;
    float densityPatch = pow(clamp(grain, 0.0, 1.0), densityContrast);
    float density = mix(densityMin, densityMax, densityPatch);

    float weight = min(
      max(highlight, minWeight * (0.45 + 0.55 * densityPatch)),
      1.0
    );

    float intensity = weight * density * distAtten * membraneMax;
    vec3 color = vec3(1.0, 1.0, 1.0) * intensity;
    gl_FragColor = vec4(color, intensity);
  }
`;

export class ConeBeam {
  readonly mesh: THREE.Mesh;
  private readonly geometry: ConeMembraneGeometry;
  private readonly material: THREE.ShaderMaterial;
  private readonly uniforms: {
    projectorPosition: { value: THREE.Vector3 };
    scatterG: { value: number };
    edgeMix: { value: number };
    falloffPower: { value: number };
    nearBoost: { value: number };
    farAtten: { value: number };
    glareStrength: { value: number };
    membraneMax: { value: number };
    minWeight: { value: number };
    densityMin: { value: number };
    densityMax: { value: number };
    densityContrast: { value: number };
  };
  private readonly _arcPoints: THREE.Vector3[] = [];
  private readonly _narrowPoints: THREE.Vector3[] = [];
  private readonly _widePoints: THREE.Vector3[] = [];
  private readonly _scratchWide = new THREE.Vector3();
  private readonly _scratchNarrow = new THREE.Vector3();
  private readonly _worldMatrixInverse = new THREE.Matrix4();

  constructor() {
    this.geometry = new ConeMembraneGeometry();
    this.uniforms = {
      projectorPosition: { value: new THREE.Vector3() },
      // Visible by default from face-on; rim/scatter still adds brightness at grazing angles.
      scatterG: { value: 0.68 },
      edgeMix: { value: 0.4 },
      falloffPower: { value: 2.35 },
      nearBoost: { value: 1.45 },
      farAtten: { value: 0.16 },
      glareStrength: { value: 0.28 },
      membraneMax: { value: 1.55 },
      minWeight: { value: 0.45 },
      densityMin: { value: 0.52 },
      densityMax: { value: 1.35 },
      densityContrast: { value: 0.58 },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 0;
  }

  update(
    settings: EngineSettings,
    wall: WallLayout,
    emitPoint: THREE.Object3D
  ): void {
    emitPoint.updateWorldMatrix(true, false);
    emitPoint.getWorldPosition(this.uniforms.projectorPosition.value);

    sampleWallArcPoints(settings, wall, ARC_SAMPLES, this._arcPoints);

    this._narrowPoints.length = 0;
    this._widePoints.length = 0;
    this._worldMatrixInverse.copy(emitPoint.matrixWorld).invert();

    for (let i = 0; i < this._arcPoints.length; i++) {
      const wide = this._scratchWide
        .copy(this._arcPoints[i]!)
        .applyMatrix4(this._worldMatrixInverse);
      const narrow = getNarrowPointOnRuling(
        wide,
        APEX_RADIUS,
        this._scratchNarrow
      );

      this._narrowPoints.push(narrow.clone());
      this._widePoints.push(wide.clone());
    }

    this.geometry.update(this._narrowPoints, this._widePoints);
    this.mesh.visible = this._widePoints.length >= 2;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
