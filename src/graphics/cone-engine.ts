import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ConeSettings, EngineStatus } from "@app/settings/types";
import { DEFAULT_SETTINGS } from "@app/settings/defaults";
import { toEngineSettings } from "@app/settings/to-engine-settings";
import {
  aimProjectorAtWall,
  createSceneLayout,
  getWallLayout,
  layoutScene,
  PLINTH_HEIGHT,
  PROJECTOR_HEIGHT,
} from "./scene-layout";
import { WallArc } from "./wall-arc";
import { ConeBeam } from "./cone-beam";

export interface ConeEngineOptions {
  onStatus?: (status: EngineStatus) => void;
}

export class ConeEngine {
  private readonly _container: HTMLElement;
  private readonly _onStatus: (status: EngineStatus) => void;
  private readonly _canvas: HTMLCanvasElement;
  private readonly _renderer: THREE.WebGLRenderer;
  private readonly _scene: THREE.Scene;
  private readonly _camera: THREE.PerspectiveCamera;
  private readonly _controls: OrbitControls;
  private readonly _layout = createSceneLayout();
  private readonly _wallArc = new WallArc();
  private readonly _coneBeam = new ConeBeam();
  private readonly _wallTarget = new THREE.Vector3();
  private readonly _resizeObserver: ResizeObserver;

  private _settings = toEngineSettings(DEFAULT_SETTINGS);
  private _disposed = false;
  private _rafId: number | null = null;
  private _timer = new THREE.Timer();
  private _elapsedSec = 0;
  private _cycleCompleteSent = false;

  constructor(container: HTMLElement, { onStatus }: ConeEngineOptions = {}) {
    this._container = container;
    this._onStatus = onStatus ?? (() => {});

    this._canvas = document.createElement("canvas");
    this._canvas.style.display = "block";
    this._canvas.style.width = "100%";
    this._canvas.style.height = "100%";
    container.appendChild(this._canvas);

    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      antialias: true,
      alpha: false,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setClearColor(0x000000, 1);
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x000000);

    this._camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);

    this._controls = new OrbitControls(this._camera, this._canvas);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.06;
    this._controls.maxDistance = 18;
    this._controls.minDistance = 1.5;
    this._frameCameraOnWall(DEFAULT_SETTINGS);

    this._scene.add(this._layout.projector);
    this._scene.add(this._layout.wall);
    this._scene.add(this._layout.floor);
    this._layout.emitPoint.add(this._coneBeam.mesh);
    this._scene.add(this._wallArc.mesh);

    const ambient = new THREE.AmbientLight(0x445566, 0.38);
    this._scene.add(ambient);

    this._handleResize();
    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(container);

    this._timer.connect(document);

    this._onStatus({ type: "ready" });
    this._loop = this._loop.bind(this);
    this._rafId = requestAnimationFrame(this._loop);
  }

  setSettings(settings: ConeSettings): void {
    const wasPlaying = this._settings.playing;
    this._settings = toEngineSettings(settings, this._elapsedSec);

    if (!wasPlaying && settings.playing) {
      this._cycleCompleteSent = false;
    }
  }

  restart(): void {
    this._elapsedSec = 0;
    this._cycleCompleteSent = false;
  }

  snapshot(): string | null {
    try {
      this._renderFrame();
      return this._renderer.domElement.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    if (this._rafId != null) cancelAnimationFrame(this._rafId);
    this._timer.dispose();
    this._resizeObserver.disconnect();
    this._controls.dispose();
    this._wallArc.dispose();
    this._coneBeam.dispose();
    this._layout.wall.geometry.dispose();
    (this._layout.wall.material as THREE.Material).dispose();
    this._layout.floor.geometry.dispose();
    (this._layout.floor.material as THREE.Material).dispose();
    this._layout.projector.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
    this._renderer.dispose();
    this._canvas.remove();
  }

  private _handleResize(): void {
    const { clientWidth, clientHeight } = this._container;
    if (clientWidth <= 0 || clientHeight <= 0) return;
    this._camera.aspect = clientWidth / clientHeight;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(clientWidth, clientHeight, false);
  }

  private _loop(timestamp: number): void {
    if (this._disposed) return;
    this._timer.update(timestamp);
    const delta = this._timer.getDelta();
    this._tickTime(delta);
    this._renderFrame();
    this._controls.update();
    this._rafId = requestAnimationFrame(this._loop);
  }

  private _tickTime(delta: number): void {
    if (this._settings.playing) {
      this._elapsedSec += delta;
      const scaled =
        (this._elapsedSec * this._settings.timeScale) /
        this._settings.durationSec;
      if (scaled >= 1 && !this._cycleCompleteSent) {
        this._cycleCompleteSent = true;
        this._onStatus({ type: "cycle-complete" });
      }
    }
    this._settings = toEngineSettings(this._settings, this._elapsedSec);
  }

  /** Default view: three-quarter angle — projector lower-left, wall mid-right. */
  private _frameCameraOnWall(settings: ConeSettings): void {
    const { throwDistance } = toEngineSettings(settings);

    const beamY = PLINTH_HEIGHT + 0.08 + PROJECTOR_HEIGHT * 0.5;
    // Aim between plinth base and mid-beam so a tight zoom still catches the plinth.
    const target = new THREE.Vector3(
      0,
      PLINTH_HEIGHT * 0.42 + beamY * 0.38,
      -throwDistance * 0.3
    );
    const offset = new THREE.Vector3(
      throwDistance * 0.5,
      throwDistance * 0.15 + beamY * 0.12,
      throwDistance * 0.72
    );
    offset.multiplyScalar(0.7);

    this._controls.target.copy(target);
    this._camera.position.copy(target).add(offset);
    this._controls.update();
  }

  private _renderFrame(): void {
    layoutScene(this._layout, this._settings);
    const wall = getWallLayout(this._settings);

    this._wallTarget.copy(wall.center);
    aimProjectorAtWall(
      this._layout.gimbal,
      this._layout.emitPoint,
      this._wallTarget
    );

    this._wallArc.resize(wall.width, wall.height);
    this._wallArc.mesh.position.copy(wall.center);
    this._wallArc.mesh.position.z += 0.02;
    this._wallArc.mesh.rotation.copy(this._layout.wall.rotation);

    this._wallArc.update(this._settings);
    this._coneBeam.update(this._settings, wall, this._layout.emitPoint);

    this._renderer.render(this._scene, this._camera);
  }
}
