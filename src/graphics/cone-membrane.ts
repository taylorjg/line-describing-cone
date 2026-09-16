import * as THREE from "three";

const DEFAULT_CAPACITY = 128;
const NUM_SEGMENTS = 1;

/**
 * Ruled-surface mesh from apex to an arc polyline on the wall (open, no caps).
 */
export class ConeMembraneGeometry extends THREE.BufferGeometry {
  private _capacity = 0;
  private _currentPoints = 0;

  constructor() {
    super();
    this._ensureCapacity(DEFAULT_CAPACITY);
  }

  private _vertexCount(numPoints: number): number {
    return (NUM_SEGMENTS + 1) * numPoints;
  }

  private _indexCount(numPoints: number): number {
    return Math.max(0, numPoints - 1) * NUM_SEGMENTS * 6;
  }

  private _ensureCapacity(numPoints: number): void {
    if (numPoints <= this._capacity) return;
    this._capacity = numPoints;

    const vertexCount = this._vertexCount(numPoints);
    const indexCount = this._indexCount(numPoints);

    this.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertexCount * 3, 3)
    );
    this.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(vertexCount * 2, 2)
    );
    this.setIndex(new THREE.Uint16BufferAttribute(indexCount, 1));
  }

  private _writeIndices(numPoints: number): void {
    if (numPoints < 2) {
      this.setDrawRange(0, 0);
      return;
    }

    const attrIndex = this.getIndex()!;
    let indexIndex = 0;

    for (let x = 0; x < numPoints - 1; x++) {
      for (let y = 0; y < NUM_SEGMENTS; y++) {
        const rowStride = numPoints;
        const a = y * rowStride + x;
        const b = (y + 1) * rowStride + x;
        const c = (y + 1) * rowStride + (x + 1);
        const d = y * rowStride + (x + 1);

        attrIndex.array[indexIndex++] = a;
        attrIndex.array[indexIndex++] = b;
        attrIndex.array[indexIndex++] = d;
        attrIndex.array[indexIndex++] = b;
        attrIndex.array[indexIndex++] = c;
        attrIndex.array[indexIndex++] = d;
      }
    }

    attrIndex.needsUpdate = true;
    this.setDrawRange(0, this._indexCount(numPoints));
  }

  /** Narrow ring at the projector (v = 0) and arc on the wall (v = 1), emit-local space. */
  update(narrowPoints: THREE.Vector3[], widePoints: THREE.Vector3[]): void {
    const numPoints = narrowPoints.length;
    if (numPoints < 2 || widePoints.length !== numPoints) {
      this.setDrawRange(0, 0);
      this._currentPoints = 0;
      return;
    }

    this._ensureCapacity(numPoints);
    if (numPoints !== this._currentPoints) {
      this._writeIndices(numPoints);
      this._currentPoints = numPoints;
    }

    const positions = this.getAttribute("position")!.array as Float32Array;
    const uvs = this.getAttribute("uv")!.array as Float32Array;

    let vertexIndex = 0;

    for (let y = 0; y <= NUM_SEGMENTS; y++) {
      const v = y / NUM_SEGMENTS;
      const nv = 1 - v;
      for (let x = 0; x < numPoints; x++) {
        const narrow = narrowPoints[x]!;
        const wide = widePoints[x]!;
        const u = x / (numPoints - 1);

        const o = vertexIndex * 3;
        positions[o] = narrow.x * nv + wide.x * v;
        positions[o + 1] = narrow.y * nv + wide.y * v;
        positions[o + 2] = narrow.z * nv + wide.z * v;

        const uv = vertexIndex * 2;
        uvs[uv] = u;
        uvs[uv + 1] = v;

        vertexIndex++;
      }
    }

    this.getAttribute("position")!.needsUpdate = true;
    this.getAttribute("uv")!.needsUpdate = true;
    this.computeVertexNormals();
  }
}
