import * as THREE from "three";
import type { EngineSettings } from "@app/settings/types";

export interface SceneLayoutObjects {
  projector: THREE.Group;
  gimbal: THREE.Group;
  emitPoint: THREE.Object3D;
  wall: THREE.Mesh;
  floor: THREE.Mesh;
}

const PLINTH_HEIGHT = 1.2;
const PLINTH_WIDTH = 0.5;
const PLINTH_DEPTH = 0.5;
/** Slightly lighter than the wall so the body reads against the floor. */
const PLINTH_COLOR = 0x353b48;

/** Projector head — the box mounted on the plinth (not the plinth itself). */
const PROJECTOR_WIDTH = 0.35;
const PROJECTOR_HEIGHT = 0.18;
const PROJECTOR_DEPTH = 0.45;
const PROJECTOR_OFFSET = new THREE.Vector3(0, PLINTH_HEIGHT + 0.08, -0.05);

/** Beam exits the front face of the projector (+Z in gimbal space). */
const EMIT_Z_OFFSET = PROJECTOR_DEPTH * 0.5;
/** Narrow end aperture radius on the projector front face. */
const APEX_RADIUS = PROJECTOR_HEIGHT * 0.25;
/** Dark screen — MeshBasic so it reads clearly against the black room. */
const WALL_COLOR = 0x2a3140;
const WALL_SIZE_FACTOR = 2.2;
const _forward = new THREE.Vector3(0, 0, 1);
const _from = new THREE.Vector3();

export interface WallLayout {
  width: number;
  height: number;
  center: THREE.Vector3;
}

export const getWallLayout = (settings: EngineSettings): WallLayout => {
  const { throwDistance, circleRadius } = settings;
  const height = circleRadius * WALL_SIZE_FACTOR;
  const width = circleRadius * WALL_SIZE_FACTOR;
  const center = new THREE.Vector3(0, height * 0.5, -throwDistance);
  return { width, height, center };
};

export const createSceneLayout = (): SceneLayoutObjects => {
  const projector = new THREE.Group();

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(PLINTH_WIDTH, PLINTH_HEIGHT, PLINTH_DEPTH),
    new THREE.MeshStandardMaterial({
      color: PLINTH_COLOR,
      roughness: 0.85,
      emissive: 0x151920,
      emissiveIntensity: 0.12,
    })
  );
  plinth.position.y = PLINTH_HEIGHT * 0.5;
  projector.add(plinth);

  const gimbal = new THREE.Group();
  gimbal.position.copy(PROJECTOR_OFFSET);
  projector.add(gimbal);

  const projectorHead = new THREE.Mesh(
    new THREE.BoxGeometry(PROJECTOR_WIDTH, PROJECTOR_HEIGHT, PROJECTOR_DEPTH),
    new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: 0x223344,
      emissiveIntensity: 0.2,
      roughness: 0.4,
    })
  );
  gimbal.add(projectorHead);

  const emitPoint = new THREE.Object3D();
  emitPoint.position.set(0, 0, EMIT_Z_OFFSET);
  projectorHead.add(emitPoint);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: WALL_COLOR })
  );

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 1 })
  );
  floor.rotation.x = -Math.PI * 0.5;

  return { projector, gimbal, emitPoint, wall, floor };
};

export const layoutScene = (
  objects: SceneLayoutObjects,
  settings: EngineSettings
): void => {
  const { throwDistance } = settings;
  const wall = getWallLayout(settings);

  objects.projector.position.set(0, 0, 0);
  objects.projector.rotation.set(0, 0, 0);

  objects.wall.position.copy(wall.center);
  objects.wall.scale.set(wall.width, wall.height, 1);

  objects.floor.position.set(0, 0, -throwDistance * 0.5);
  objects.floor.scale.set(throwDistance * 2.5, throwDistance * 2.5, 1);
};

/** Tilt the projector head so the emit point (+Z) aims at the wall without swinging the plinth. */
export const aimProjectorAtWall = (
  gimbal: THREE.Object3D,
  emitPoint: THREE.Object3D,
  wallPosition: THREE.Vector3
): void => {
  gimbal.rotation.set(0, 0, 0);
  gimbal.updateWorldMatrix(true, false);
  emitPoint.getWorldPosition(_from);
  const direction = wallPosition.clone().sub(_from).normalize();
  gimbal.quaternion.setFromUnitVectors(_forward, direction);
};

export {
  PLINTH_HEIGHT,
  PLINTH_WIDTH,
  PLINTH_DEPTH,
  PLINTH_COLOR,
  PROJECTOR_WIDTH,
  PROJECTOR_HEIGHT,
  PROJECTOR_DEPTH,
  PROJECTOR_OFFSET,
  APEX_RADIUS,
  EMIT_Z_OFFSET,
};
