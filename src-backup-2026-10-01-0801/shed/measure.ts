/** Point snapping for the Measure tool. three.js is passed in because the viewer loads it lazily. */
import type * as Three from "three";

type ThreeModule = typeof Three;

export type SnapKind = "vertex" | "edge" | "surface";
export type Snap = { point: Three.Vector3; kind: SnapKind };

/** Feature edges (not triangle diagonals) of each geometry, in local coordinates. Built once per geometry. */
const edgeCache = new WeakMap<Three.BufferGeometry, Float32Array>();

function featureEdges(T: ThreeModule, geometry: Three.BufferGeometry): Float32Array {
  let edges = edgeCache.get(geometry);
  if (!edges) {
    const eg = new T.EdgesGeometry(geometry, 20);
    edges = eg.getAttribute("position").array as Float32Array;
    eg.dispose();
    edgeCache.set(geometry, edges);
  }
  return edges;
}

/**
 * Snap a raycast hit to the nearest vertex of the hit mesh within `threshold` screen pixels,
 * else to the nearest point on the nearest feature edge within the threshold, else the raw hit.
 */
export function snapHit(
  T: ThreeModule,
  hit: Three.Intersection,
  ray: Three.Ray,
  camera: Three.Camera,
  size: { width: number; height: number },
  pointer: { x: number; y: number },
  threshold = 12,
): Snap {
  const mesh = hit.object as Three.Mesh;
  const geometry = mesh.geometry as Three.BufferGeometry | undefined;
  const pos = geometry?.getAttribute("position");
  if (!geometry || !pos) return { point: hit.point.clone(), kind: "surface" };

  const world = mesh.matrixWorld;
  const v = new T.Vector3();
  const p = new T.Vector3();
  const screenDist = (point: Three.Vector3) => {
    p.copy(point).project(camera);
    if (p.z > 1 || p.z < -1) return Infinity;
    const sx = ((p.x + 1) / 2) * size.width;
    const sy = ((1 - p.y) / 2) * size.height;
    return Math.hypot(sx - pointer.x, sy - pointer.y);
  };

  // Candidates within the threshold, nearest on screen first. A candidate hidden behind the hit mesh
  // itself (e.g. the back corner of a box seen almost end-on) is skipped, so snaps land on what you see.
  const eye = new T.Vector3().setFromMatrixPosition(camera.matrixWorld);
  const probe = new T.Raycaster();
  const visible = (point: Three.Vector3) => {
    const dir = new T.Vector3().subVectors(point, eye);
    const dist = dir.length();
    if (dist < 1e-6) return true;
    probe.set(eye, dir.divideScalar(dist));
    probe.far = dist - 0.002;
    return probe.intersectObject(mesh, false).length === 0;
  };
  const firstVisible = (list: { point: Three.Vector3; d: number }[]) => {
    list.sort((m, n) => m.d - n.d);
    for (const c of list.slice(0, 8)) if (visible(c.point)) return c.point;
    return null;
  };

  const vertices: { point: Three.Vector3; d: number }[] = [];
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).applyMatrix4(world);
    const d = screenDist(v);
    if (d <= threshold) vertices.push({ point: v.clone(), d });
  }
  const vertex = firstVisible(vertices);
  if (vertex) return { point: vertex, kind: "vertex" };

  const edges = featureEdges(T, geometry);
  const a = new T.Vector3();
  const b = new T.Vector3();
  const onSeg = new T.Vector3();
  const onEdges: { point: Three.Vector3; d: number }[] = [];
  for (let i = 0; i + 5 < edges.length; i += 6) {
    a.set(edges[i], edges[i + 1], edges[i + 2]).applyMatrix4(world);
    b.set(edges[i + 3], edges[i + 4], edges[i + 5]).applyMatrix4(world);
    ray.distanceSqToSegment(a, b, undefined, onSeg);
    const d = screenDist(onSeg);
    if (d <= threshold) onEdges.push({ point: onSeg.clone(), d });
  }
  const edge = firstVisible(onEdges);
  if (edge) return { point: edge, kind: "edge" };
  return { point: hit.point.clone(), kind: "surface" };
}
