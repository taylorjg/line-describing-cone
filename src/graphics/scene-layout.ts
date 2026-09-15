import * as THREE from "three";
import type { EngineSettings } from "@app/settings/types";

export interface SceneLayoutObjects {
  projector: THREE.Group;
  gimbal: THREE.Group;
  emitPoint: THREE.Object3D;
  wall: THREE.Mesh;
  floor: THREE.Mesh;
}

const PROJECTOR_HEIGHT = 1.2;
const LENS_OFFSET = new THREE.Vector3(0, PROJECTOR_HEIGHT + 0.08, -0.05);
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
    new THREE.BoxGeometry(0.5, PROJECTOR_HEIGHT, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  );
  plinth.position.y = PROJECTOR_HEIGHT * 0.5;
  projector.add(plinth);

  const gimbal = new THREE.Group();
  gimbal.position.copy(LENS_OFFSET);
  projector.add(gimbal);

  const lens = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.18, 0.45),
    new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: 0x223344,
      emissiveIntensity: 0.2,
      roughness: 0.4,
    })
  );
  gimbal.add(lens);

  const emitPoint = new THREE.Object3D();
  gimbal.add(emitPoint);

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

/** Tilt the head at the lens so +Z aims at the wall without swinging the plinth. */
export const aimProjectorAtWall = (
  gimbal: THREE.Object3D,
  wallPosition: THREE.Vector3
): void => {
  gimbal.rotation.set(0, 0, 0);
  gimbal.updateWorldMatrix(true, false);
  gimbal.getWorldPosition(_from);
  const direction = wallPosition.clone().sub(_from).normalize();
  gimbal.quaternion.setFromUnitVectors(_forward, direction);
};

export { PROJECTOR_HEIGHT, LENS_OFFSET };
