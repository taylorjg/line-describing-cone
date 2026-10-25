import * as THREE from "three";
import type { EngineSettings } from "@app/settings/types";
import type { WallLayout } from "./scene-layout";
import { APEX_RADIUS } from "./scene-layout";
import {
  ARC_START_ANGLE,
  getNarrowPointOnRuling,
  getWallArcPoint,
  sampleWallArcPoints,
} from "./arc-geometry";
import { getSequenceStateFromSettings } from "./arc-animation";
import { ConeMembraneGeometry } from "./cone-membrane";
import {
  createConeBeamMaterial,
  createConeBeamUniforms,
  type ConeBeamShaderUniforms,
} from "./cone-beam-shader";

const ARC_SAMPLES = 96;

export class ConeBeam {
  readonly mesh: THREE.Mesh;
  private readonly geometry: ConeMembraneGeometry;
  private readonly material: THREE.ShaderMaterial;
  private readonly uniforms: ConeBeamShaderUniforms;
  private readonly _arcPoints: THREE.Vector3[] = [];
  private readonly _narrowPoints: THREE.Vector3[] = [];
  private readonly _widePoints: THREE.Vector3[] = [];
  private readonly _scratchWide = new THREE.Vector3();
  private readonly _scratchNarrow = new THREE.Vector3();
  private readonly _worldMatrixInverse = new THREE.Matrix4();

  constructor(hazeTexture?: THREE.Texture) {
    this.geometry = new ConeMembraneGeometry();
    this.uniforms = createConeBeamUniforms();
    if (hazeTexture) {
      this.uniforms.uHazeDensity.value = hazeTexture;
    }

    this.material = createConeBeamMaterial(this.uniforms);

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 0;
  }

  setHazeTexture(texture: THREE.Texture): void {
    this.uniforms.uHazeDensity.value = texture;
  }

  private _updatePointBeam(wall: WallLayout, emitPoint: THREE.Object3D): void {
    this._worldMatrixInverse.copy(emitPoint.matrixWorld).invert();
    const wide = getWallArcPoint(
      ARC_START_ANGLE,
      wall,
      this._scratchWide
    ).applyMatrix4(this._worldMatrixInverse);
    const narrow = getNarrowPointOnRuling(
      wide,
      APEX_RADIUS,
      this._scratchNarrow
    );

    this._narrowPoints.length = 0;
    this._widePoints.length = 0;
    this._narrowPoints.push(narrow.clone(), narrow.clone());
    this._widePoints.push(wide.clone(), wide.clone());
    this.geometry.update(this._narrowPoints, this._widePoints);
  }

  update(
    settings: EngineSettings,
    wall: WallLayout,
    emitPoint: THREE.Object3D
  ): void {
    const sequence = getSequenceStateFromSettings(settings);
    this.uniforms.lightOpacity.value = sequence.lightOpacity;

    emitPoint.updateWorldMatrix(true, false);
    emitPoint.getWorldPosition(this.uniforms.projectorPosition.value);

    if (sequence.lightOpacity <= 0) {
      this.mesh.visible = false;
      this.geometry.setDrawRange(0, 0);
      return;
    }

    if (sequence.arcProgress <= 0) {
      this._updatePointBeam(wall, emitPoint);
      this.mesh.visible = true;
      return;
    }

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
