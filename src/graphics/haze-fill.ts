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

export class HazeFill {
  readonly group = new THREE.Group();
  private readonly shells: {
    mesh: THREE.Mesh;
    geometry: ConeMembraneGeometry;
    uniforms: ConeBeamShaderUniforms;
    along: number;
  }[] = [];
  private readonly _arcPoints: THREE.Vector3[] = [];
  private readonly _narrowPoints: THREE.Vector3[] = [];
  private readonly _widePoints: THREE.Vector3[] = [];
  private readonly _scratchWide = new THREE.Vector3();
  private readonly _scratchNarrow = new THREE.Vector3();
  private readonly _worldMatrixInverse = new THREE.Matrix4();

  constructor(hazeTexture: THREE.Texture) {
    const alongFactors = [0.82, 0.62];
    const membrane = [0.42, 0.28];
    for (let i = 0; i < alongFactors.length; i++) {
      const geometry = new ConeMembraneGeometry();
      const uniforms = createConeBeamUniforms(membrane[i]!);
      uniforms.uHazeDensity.value = hazeTexture;
      const material = createConeBeamMaterial(uniforms);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.renderOrder = -1 - i;
      this.group.add(mesh);
      this.shells.push({
        mesh,
        geometry,
        uniforms,
        along: alongFactors[i]!,
      });
    }
  }

  setHazeTexture(texture: THREE.Texture): void {
    for (const shell of this.shells) {
      shell.uniforms.uHazeDensity.value = texture;
    }
  }

  private _scaleAlongRuling(
    narrow: THREE.Vector3,
    wide: THREE.Vector3,
    along: number,
    outWide: THREE.Vector3
  ): THREE.Vector3 {
    return outWide.copy(narrow).lerp(wide, along);
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

    for (const shell of this.shells) {
      this._narrowPoints.length = 0;
      this._widePoints.length = 0;
      this._narrowPoints.push(narrow.clone(), narrow.clone());
      const scaledWide = this._scaleAlongRuling(
        narrow,
        wide,
        shell.along,
        new THREE.Vector3()
      );
      this._widePoints.push(scaledWide, scaledWide);
      shell.geometry.update(this._narrowPoints, this._widePoints);
    }
  }

  update(
    settings: EngineSettings,
    wall: WallLayout,
    emitPoint: THREE.Object3D
  ): void {
    const sequence = getSequenceStateFromSettings(settings);
    const lightOpacity = sequence.lightOpacity;
    for (const shell of this.shells) {
      shell.uniforms.lightOpacity.value = lightOpacity;
    }

    if (lightOpacity <= 0) {
      this.group.visible = false;
      for (const shell of this.shells) {
        shell.geometry.setDrawRange(0, 0);
      }
      return;
    }

    emitPoint.updateWorldMatrix(true, false);
    emitPoint.getWorldPosition(
      this.shells[0]!.uniforms.projectorPosition.value
    );
    for (const shell of this.shells) {
      shell.uniforms.projectorPosition.value.copy(
        this.shells[0]!.uniforms.projectorPosition.value
      );
    }

    if (sequence.arcProgress <= 0) {
      this._updatePointBeam(wall, emitPoint);
      this.group.visible = true;
      return;
    }

    sampleWallArcPoints(settings, wall, ARC_SAMPLES, this._arcPoints);
    this._worldMatrixInverse.copy(emitPoint.matrixWorld).invert();

    for (const shell of this.shells) {
      this._narrowPoints.length = 0;
      this._widePoints.length = 0;

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
        this._scaleAlongRuling(narrow, wide, shell.along, this._scratchWide);
        this._widePoints.push(this._scratchWide.clone());
      }

      shell.geometry.update(this._narrowPoints, this._widePoints);
    }

    this.group.visible = this._arcPoints.length >= 2;
  }

  dispose(): void {
    for (const shell of this.shells) {
      shell.geometry.dispose();
      (shell.mesh.material as THREE.Material).dispose();
    }
  }
}
