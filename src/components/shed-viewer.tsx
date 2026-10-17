import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Scissors, X } from "lucide-react";
import {
  derived,
  formatLength,
  frameLayout,
  partInfo,
  parts,
  purlinStations,
  roofBraceBays,
  spec,
  wallQuantities,
  foundationQuantities,
  type PartId,
} from "@/shed/geometry";
import { snapHit, type SnapKind } from "@/shed/measure";
import type { SafetyFocus } from "@/shed/safety";

export type ViewName = "iso" | "side" | "end" | "plan";

export type ShedHandle = {
  setView: (view: ViewName) => void;
  clearMeasure: () => void;
  /** Safety panel: highlight the members an item is about (null clears) and move the camera to them. */
  focusSafety: (id: SafetyFocus | null) => void;
  /** CSS px of the model covered by a panel on the left and a sheet at the bottom; the view centre shifts into the uncovered part. */
  setInsets: (left: number, bottom: number) => void;
  /**
   * Cut-away: clip the whole model with a plane across the building at x (model metres along the length).
   * `hide` 1 hides x > position, -1 hides x < position, 0 picks the side the camera is on. Returns the side used.
   */
  setCut: (on: boolean, x: number, hide: -1 | 0 | 1) => -1 | 1;
  /** Orbit centre along the length (model x), for starting the cut where you are looking. */
  targetX: () => number;
};

type Props = {
  shown: Record<PartId, boolean>;
  /** Measure mode: taps pick points (A, then B) and report the part under them. */
  measuring?: boolean;
};

type XYZ = { x: number; y: number; z: number };
type PartReadout = { id: PartId; name: string; label: string; count: number; section: string; detail: string };
type Readout = { a: XYZ | null; b: XYZ | null; snap: SnapKind | null; part: PartReadout | null };
const emptyReadout: Readout = { a: null, b: null, snap: null, part: null };

/** Tap = pointer released within this many CSS px and ms of going down. Anything else is an orbit/pan drag. */
const TAP_PX = 5;
const TAP_MS = 400;
const HOVER_MS = 60;
/** Double-tap / double-click: second tap within this time and distance of the first focuses the view there. */
const DOUBLE_MS = 400;
const DOUBLE_PX = 30;
/** Focus glide duration. */
const GLIDE_MS = 300;
/** Cut-away range along the length (model x) and the frame lines it can step to. */
const CUT_MAX = Math.ceil((spec.length / 2 + spec.purlin.endOverhang) * 20) / 20;
const CUT_MIN = -CUT_MAX;
const FRAME_XS = Array.from({ length: spec.length / spec.bay + 1 }, (_, i) => -spec.length / 2 + i * spec.bay);
/** When stepping frame to frame, stop this far on the hidden side of the frame so the whole truss shows. */
const CUT_FRAME_CLEAR = 0.3;
type Cut = { on: boolean; open: boolean; x: number; hide: -1 | 1 };
/**
 * Camera control speeds (OrbitControls defaults are rotate 1, pan 1, zoom 1, keyPan 7).
 * Touch gets about half speed for rotate and pan and a gentler pinch; mouse gets about 0.7x.
 */
const CONTROL_SPEED = {
  touch: { rotate: 0.5, pan: 0.5, zoom: 0.8, keyPan: 3.5 },
  mouse: { rotate: 0.7, pan: 0.7, zoom: 1, keyPan: 5 },
} as const;

export const ShedViewer = forwardRef<ShedHandle, Props>(function ShedViewer({ shown, measuring = false }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const api = useRef<ShedHandle>({
    setView: () => {},
    clearMeasure: () => {},
    focusSafety: () => {},
    setInsets: () => {},
    setCut: () => 1,
    targetX: () => 0,
  });
  const [insets, setInsetsState] = useState({ left: 0, bottom: 0 });
  const [cut, setCut] = useState<Cut>({ on: false, open: false, x: 0, hide: 1 });
  const readoutRef = useRef<HTMLDivElement>(null);
  const [readoutH, setReadoutH] = useState(0);
  const measuringRef = useRef(measuring);
  measuringRef.current = measuring;
  const [readout, setReadout] = useState<Readout>(emptyReadout);
  const groupsRef = useRef<Partial<Record<PartId, { visible: boolean }>>>({});
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useImperativeHandle(ref, () => api.current, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    let disposed = false;
    let cleanup = () => {};

    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      const { mergeGeometries } = await import("three/addons/utils/BufferGeometryUtils.js");
      if (disposed || !canvasRef.current) return;

      // Steel is always drawn at its true size.
      const scale = 1;
      const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x141816);
      scene.fog = new THREE.Fog(0x141816, 90, 220);

      const camera = new THREE.PerspectiveCamera(
        42,
        el.clientWidth / Math.max(el.clientHeight, 1),
        0.05,
        900,
      );
      const controls = new OrbitControls(camera, renderer.domElement);
      // Damping eases each drag out over a few frames; tick() calls controls.update() every frame.
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      // Slower than OrbitControls' 1.0 defaults so a finger (or mouse) can make fine adjustments.
      const applyControlSpeeds = (touch: boolean) => {
        const s = touch ? CONTROL_SPEED.touch : CONTROL_SPEED.mouse;
        controls.rotateSpeed = s.rotate;
        controls.panSpeed = s.pan;
        controls.zoomSpeed = s.zoom;
        controls.keyPanSpeed = s.keyPan;
      };
      applyControlSpeeds(window.matchMedia?.("(pointer: coarse)").matches ?? false);
      controls.target.set(0, 2, 0);
      controls.maxPolarAngle = Math.PI * 0.49;
      // Wheel and pinch zoom towards the point under the cursor / between the fingers (three r186 has this built
      // in, touch included). The zoom stops minDistance short of the orbit centre, so it cannot flip through it;
      // before each zoom-in the centre is pulled onto the surface under the pointer (see pullTargetTo).
      controls.zoomToCursor = true;
      controls.minDistance = 0.3;
      controls.maxDistance = 800;

      // Cut-away: one global clipping plane (applies to every material, X-ray and highlights included).
      const cutPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
      let cutOn = false;
      /** False for points the cut-away hides, so picking, Measure and focus ignore clipped geometry. */
      const kept = (p: import("three").Vector3) => !cutOn || cutPlane.distanceToPoint(p) >= -1e-4;

      const tanHalfFov = Math.tan(((camera.fov / 2) * Math.PI) / 180);
      /** Distance at which a box of the given half width and half height fills the current canvas. */
      const fitDistance = (halfW: number, halfH: number) =>
        Math.max(halfH / tanHalfFov, halfW / (tanHalfFov * Math.max(camera.aspect, 0.1)));
      const viewHalfRun = spec.length / 2 + spec.purlin.endOverhang;
      const halfRoof = derived.horiz + spec.roof.eaveOverhang;

      // End: from beyond the gable, looking back along the length.
      // Side: from beside the house, square to the long side wall, far enough to see all 102 m.
      const views: Record<ViewName, () => { pos: [number, number, number]; target: [number, number, number] }> = {
        iso: () => ({ pos: [58, 26, 42], target: [0, 2, 0] }),
        end: () => {
          const d = fitDistance(halfRoof * 1.15, 3.2 * 1.15);
          const gable = spec.length / 2;
          return { pos: [gable + d, 2.6 + d * Math.tan((4 * Math.PI) / 180), 0], target: [gable, 2.6, 0] };
        },
        side: () => {
          const d = fitDistance(viewHalfRun * 1.05, 3.5) + derived.horiz;
          return { pos: [0, 2.4 + d * Math.tan((6 * Math.PI) / 180), d], target: [0, 2.4, 0] };
        },
        plan: () => ({ pos: [0, 130, 0.4], target: [0, 0, 0] }),
      };

      /** Focus glide in progress (double-tap), advanced in tick(). */
      let glide: {
        t0: number;
        fromT: import("three").Vector3;
        toT: import("three").Vector3;
        fromP: import("three").Vector3;
        toP: import("three").Vector3;
      } | null = null;
      const apply = (name: ViewName) => {
        glide = null;
        const view = views[name]();
        // Flush any glide left over from a drag so the view lands exactly where it should.
        controls.enableDamping = false;
        controls.update();
        controls.enableDamping = true;
        camera.position.set(...view.pos);
        controls.target.set(...view.target);
        controls.update();
      };
      apply("iso");
      api.current.setView = apply;

      let leftInset = 0;
      let bottomInset = 0;
      const fit = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w < 2 || h < 2) return;
        camera.aspect = w / h;
        // With a panel open, render a larger virtual view and show only part of it, so the view centre sits
        // in the middle of the uncovered model instead of behind the panel (left card or bottom sheet).
        const left = Math.min(leftInset, w * 0.6);
        const bottom = Math.min(bottomInset, h * 0.6);
        if (left > 0 || bottom > 0) camera.setViewOffset(w + left, h + bottom, left, bottom, w, h);
        else camera.clearViewOffset();
        camera.updateProjectionMatrix();
        // false: leave the canvas CSS size to the stylesheet so it keeps tracking its container.
        renderer.setSize(w, h, false);
      };
      fit();
      api.current.setInsets = (left: number, bottom: number) => {
        leftInset = Math.max(0, left);
        bottomInset = Math.max(0, bottom);
        setInsetsState({ left: leftInset, bottom: bottomInset });
        fit();
      };
      api.current.setCut = (on, x, hide) => {
        const side: -1 | 1 = hide === 0 ? (camera.position.x >= x ? 1 : -1) : hide;
        // Plane keeps points where normal · p + constant >= 0.
        cutPlane.normal.set(-side, 0, 0);
        cutPlane.constant = side * x;
        cutOn = on;
        renderer.clippingPlanes = on ? [cutPlane] : [];
        return side;
      };
      api.current.targetX = () => controls.target.x;

      scene.add(new THREE.HemisphereLight(0xd7e0d6, 0x3a3328, 1.05));
      const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
      sun.position.set(50, 90, 24);
      scene.add(sun);

      const steel = new THREE.MeshStandardMaterial({
        color: 0xb7c0c8,
        metalness: 0.72,
        roughness: 0.32,
      });
      const spliceMat = new THREE.MeshStandardMaterial({
        color: 0x6e787e,
        metalness: 0.6,
        roughness: 0.45,
      });
      const webMat = new THREE.MeshStandardMaterial({
        color: 0x8ea398,
        metalness: 0.5,
        roughness: 0.48,
      });
      const concreteMat = new THREE.MeshStandardMaterial({
        color: 0x9a958c,
        roughness: 0.92,
        metalness: 0.02,
      });
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x7d7870,
        roughness: 0.95,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
      const purlinMat = new THREE.MeshStandardMaterial({
        color: 0xd7dbe0,
        metalness: 0.78,
        roughness: 0.28,
      });

      const geos: import("three").BufferGeometry[] = [];
      const padMeshMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, metalness: 0.5, roughness: 0.6 });

      const addMember = (
        a: import("three").Vector3,
        b: import("three").Vector3,
        width: number,
        depth: number,
        material: import("three").Material,
        group: import("three").Group,
      ) => {
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        if (len < 1e-6) return;
        const zAxis = dir.clone().normalize();
        const seed = Math.abs(zAxis.dot(new THREE.Vector3(1, 0, 0))) > 0.92
          ? new THREE.Vector3(0, 0, 1)
          : new THREE.Vector3(1, 0, 0);
        const yAxis = new THREE.Vector3().crossVectors(zAxis, seed).normalize();
        const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
        const geo = new THREE.BoxGeometry(width, depth, len);
        geos.push(geo);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.copy(a).add(b).multiplyScalar(0.5);
        mesh.setRotationFromMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
        group.add(mesh);
      };

      /** A straight member of the given width (along x) whose side outline is any four-point quad in the y-z plane. */
      const addSolid = (
        outline: import("three").Vector3[],
        width: number,
        material: import("three").Material,
        group: import("three").Group,
      ) => {
        const w = width / 2;
        const v = [
          ...outline.map((p) => new THREE.Vector3(p.x - w, p.y, p.z)),
          ...outline.map((p) => new THREE.Vector3(p.x + w, p.y, p.z)),
        ];
        const centre = v.reduce((acc, p) => acc.add(p), new THREE.Vector3()).multiplyScalar(1 / v.length);
        const quads = [
          [0, 1, 2, 3],
          [4, 5, 6, 7],
          [1, 5, 6, 2],
          [0, 4, 7, 3],
          [0, 4, 5, 1],
          [3, 7, 6, 2],
        ];
        const pos: number[] = [];
        for (const [a, b, c, d] of quads) {
          for (const tri of [[a, b, c], [a, c, d]]) {
            let [p, q, r] = tri.map((i) => v[i]);
            const n = new THREE.Vector3().subVectors(q, p).cross(new THREE.Vector3().subVectors(r, p));
            const mid = p.clone().add(q).add(r).multiplyScalar(1 / 3);
            if (n.dot(mid.sub(centre)) < 0) [q, r] = [r, q];
            pos.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        geo.computeVertexNormals();
        geos.push(geo);
        group.add(new THREE.Mesh(geo, material));
      };

      const groups = Object.fromEntries(
        parts.map((part) => [part.id, new THREE.Group()]),
      ) as Record<PartId, import("three").Group>;
      for (const part of parts) {
        groups[part.id].visible = shownRef.current[part.id];
        groups[part.id].name = part.id;
        scene.add(groups[part.id]);
      }
      groupsRef.current = groups;

      // One portal frame, shared with the 2D section diagram (see frameLayout in geometry.ts).
      const frameMid = frameLayout(false);
      const frameEnd = frameLayout(true);
      const col = spec.column.side * scale;
      const plate = spec.basePlate.side * scale;
      const plateT = spec.basePlate.thickness * scale;
      const pad = spec.concrete.side * scale;
      const padD = spec.concrete.depth * scale;
      const chordW = spec.rafter.width * scale;
      const chordD = spec.rafter.depth * scale;
      const web = spec.web.side * scale;
      const { yEdge, yCenter, halfD, yColumnTop, yBeam, yRafterAtColumn, yRidge, yTip, zCol, zTip } = frameMid;
      const x0 = -spec.length / 2;
      const v3 = (x: number, p: { z: number; y: number }) => new THREE.Vector3(x, p.y, p.z);

      // Connection parts (Tan, 30 Sep 2026) are small and many (about 1,000 pieces). To keep the draw calls down,
      // the pieces of one part at one column are merged into one mesh; userData.size / length keep the part readout
      // showing a single piece.
      type Cluster = { part: PartId; mat: import("three").Material; list: import("three").BufferGeometry[]; size?: [number, number, number]; length?: number };
      const clusters = new Map<string, Cluster>();
      const cluster = (
        part: PartId,
        colX: number,
        colZ: number,
        geo: import("three").BufferGeometry,
        mat: import("three").Material,
        at: [number, number, number],
        extra: { size?: [number, number, number]; length?: number } = {},
      ) => {
        // One mesh per part per frame line (both columns of a frame).
        void colZ;
        const key = `${part}:${Math.round(colX * 1000)}`;
        let c = clusters.get(key);
        if (!c) {
          c = { part, mat, list: [], ...extra };
          clusters.set(key, c);
        }
        c.list.push(geo.clone().translate(...at));
      };
      const kneeMat = new THREE.MeshStandardMaterial({ color: 0x8a949b, metalness: 0.65, roughness: 0.38 });
      const kneeBoltMat = new THREE.MeshStandardMaterial({ color: 0x353c40, metalness: 0.75, roughness: 0.38 });
      const kneeShimMat = new THREE.MeshStandardMaterial({ color: 0xa8866a, metalness: 0.55, roughness: 0.45 });
      const kneeGeo = (() => {
        const kn = spec.knee;
        const cap = new THREE.BoxGeometry(kn.capSide, kn.cap, kn.capSide);
        const finLen = frameMid.knee[0].z1 - frameMid.knee[0].z0;
        const fin = new THREE.BoxGeometry(kn.fin, kn.finHeight, finLen);
        const shim = new THREE.BoxGeometry(kn.shim, kn.finHeight, finLen);
        const L = frameMid.knee[0].boltLength;
        const hexR = (af: number) => af / Math.sqrt(3);
        const grip = L - 0.036;
        // Along x: head (13 mm) on one fin, washer + nut (16 mm) + thread end on the other.
        const partsX = [
          new THREE.CylinderGeometry(kn.bolt / 2, kn.bolt / 2, L, 10).translate(0, 0.036 / 2 - 0.013, 0),
          new THREE.CylinderGeometry(hexR(0.03), hexR(0.03), 0.013, 6).translate(0, -grip / 2 - 0.0065, 0),
          new THREE.CylinderGeometry(0.0185, 0.0185, 0.004, 14).translate(0, grip / 2 + 0.002, 0),
          new THREE.CylinderGeometry(hexR(0.03), hexR(0.03), 0.016, 6).translate(0, grip / 2 + 0.004 + 0.008, 0),
        ];
        const bolt = mergeGeometries(partsX, false) ?? partsX[0].clone();
        for (const g of partsX) g.dispose();
        bolt.rotateZ(Math.PI / 2);
        // RHS end cover plate, 0.3 mm proud of the RHS outline so it reads as its own piece.
        const endPlate = new THREE.BoxGeometry(spec.rafter.width + 0.0006, spec.rafter.depth + 0.0006, spec.endPlate.thickness);
        geos.push(cap, fin, shim, bolt, endPlate);
        return { cap, fin, shim, bolt, endPlate, finLen };
      })();
      const endPlateMat = new THREE.MeshStandardMaterial({ color: 0x9aa4ab, metalness: 0.6, roughness: 0.42 });
      for (let i = 0; i < derived.frames; i += 1) {
        const x = x0 + i * spec.bay;
        const endFrame = i === 0 || i === derived.frames - 1;
        const frame = endFrame ? frameEnd : frameMid;
        for (const [k, c] of frame.columns.entries()) {
          const z = c.z;
          const padTop = frame.pads[k].top;
          const plateTop = frame.plates[k].top;
          addMember(
            new THREE.Vector3(x - pad / 2, padTop - padD / 2, z),
            new THREE.Vector3(x + pad / 2, padTop - padD / 2, z),
            pad,
            padD,
            concreteMat,
            groups.concrete,
          );
          // Pad base (Tan, 29 Sep 4:32 PM): 4 ft × 4 ft × 4 in under the pad, with its A10 mesh at mid-depth.
          {
            const pb = spec.padBase;
            const yBaseTop = padTop - padD;
            addMember(
              new THREE.Vector3(x - pb.side / 2, yBaseTop - pb.depth / 2, z),
              new THREE.Vector3(x + pb.side / 2, yBaseTop - pb.depth / 2, z),
              pb.side,
              pb.depth,
              concreteMat,
              groups.padBase,
            );
            const fm = spec.floorMesh;
            const n = foundationQuantities.padMeshBars;
            const len = pb.side - 0.1;
            const yMid = yBaseTop - pb.depth / 2;
            const list: import("three").BufferGeometry[] = [];
            for (let i = 0; i < n; i += 1) {
              const off = -((n - 1) * fm.grid) / 2 + i * fm.grid;
              const a1 = new THREE.BoxGeometry(len, fm.bar, fm.bar);
              a1.translate(x, yMid - fm.bar / 2, z + off);
              const b1 = new THREE.BoxGeometry(fm.bar, fm.bar, len);
              b1.translate(x + off, yMid + fm.bar / 2, z);
              list.push(a1, b1);
            }
            const merged = mergeGeometries(list);
            for (const g of list) g.dispose();
            geos.push(merged);
            groups.padMesh.add(new THREE.Mesh(merged, padMeshMat));
          }
          // Pad cage (Tan, 29 Sep 5:18 PM): open-top Y12 cage, 8 U-bars + 2 rings, one merged mesh per pad.
          {
            const pc = spec.padCage;
            const d = pc.bar;
            const yBot = padTop - padD;
            const h = pad / 2 - pc.cover;
            const yTop = padTop - pc.cover;
            const list: import("three").BufferGeometry[] = [];
            const box = (sx: number, sy: number, sz: number, cx: number, cy: number, cz: number) => {
              const g = new THREE.BoxGeometry(sx, sy, sz);
              g.translate(cx, cy, cz);
              list.push(g);
            };
            for (let i = 0; i < pc.perWay; i += 1) {
              // First way: runs across (z), at x lines; legs on the ±z faces.
              const off = -h + (i * 2 * h) / (pc.perWay - 1);
              const yA = yBot + pc.cover;
              box(d, d, 2 * h + d, x + off, yA, z);
              box(d, yTop - yA, d, x + off, (yA + yTop) / 2, z - h);
              box(d, yTop - yA, d, x + off, (yA + yTop) / 2, z + h);
              // Second way: runs along (x), one bar higher, legs one bar inside on the ±x faces.
              const hB = h - d;
              const offB = -hB + (i * 2 * hB) / (pc.perWay - 1);
              const yB = yA + d;
              const yTopB = yTop - d;
              box(2 * hB + d, d, d, x, yB, z + offB);
              box(d, yTopB - yB, d, x - hB, (yB + yTopB) / 2, z + offB);
              box(d, yTopB - yB, d, x + hB, (yB + yTopB) / 2, z + offB);
            }
            for (const r of pc.rings) {
              const y = yBot + r;
              const rx = h - 2 * d;
              const rz = h - d;
              box(2 * rx + d, d, d, x, y, z - rz);
              box(2 * rx + d, d, d, x, y, z + rz);
              box(d, d, 2 * rz + d, x - rx, y, z);
              box(d, d, 2 * rz + d, x + rx, y, z);
            }
            const merged = mergeGeometries(list);
            for (const g of list) g.dispose();
            geos.push(merged);
            groups.padCage.add(new THREE.Mesh(merged, padMeshMat));
          }
          addMember(
            new THREE.Vector3(x - plate / 2, plateTop - plateT / 2, z),
            new THREE.Vector3(x + plate / 2, plateTop - plateT / 2, z),
            plate,
            plateT,
            steel,
            groups.plates,
          );
          addMember(new THREE.Vector3(x, c.bottom, z), new THREE.Vector3(x, c.top, z), col, col, steel, groups.columns);
          // OPTION 2 fork knee (Tan, 30 Sep 2026): SHOP cap plate + two fins on the column, 54 mm fork, 2 mm shims, no doublers;
          // SITE: 4 × M20 8.8 preloaded bolts through fins and heel. Shared geometries, built once (kneeGeo).
          {
            const kn = frame.knee[k];
            const sk = spec.knee;
            cluster("kneeFins", x, z, kneeGeo.cap, kneeMat, [x, (kn.capBottom + kn.capTop) / 2, z], { size: [sk.fin * 2 + 2 * (spec.rafter.width / 2 + sk.shim), sk.cap + sk.finHeight, kneeGeo.finLen] });
            // Flush layout: fins end on the column's outside face and run 90 mm past its inside face; shims either side.
            const zf = (kn.z0 + kn.z1) / 2;
            for (const fx of kn.finX) cluster("kneeFins", x, z, kneeGeo.fin, kneeMat, [x + fx, (kn.y0 + kn.y1) / 2, zf]);
            for (const dx of kn.shimX) {
              cluster("kneeShims", x, z, kneeGeo.shim, kneeShimMat, [x + dx, (kn.y0 + kn.y1) / 2, zf], { size: [sk.shim, sk.finHeight, kneeGeo.finLen] });
            }
            for (const b of kn.bolts) cluster("kneeBolts", x, z, kneeGeo.bolt, kneeBoltMat, [x, b.y, b.z], { length: kn.boltNominal });
          }
        }
        // Sloping rafters: square cut at the eave tip, plumb cut (vertical) at the ridge,
        // so the two rafters meet face to face along the ridge with no gap.
        for (const rafter of frame.rafters) {
          addSolid(rafter.outline.map((p) => v3(x, p)), chordW, steel, groups.sloping);
        }
        // RHS end cover plates (Tan, 30 Sep 11:59 AM), SHOP seal-welded: the rafter's square-cut eave tip (replaces the
        // old toe filler wedge, which would have hidden it) and the ceiling beam ends at the columns.
        for (const ep of frame.endPlates) {
          const t = spec.endPlate.thickness;
          const off = t / 2 - 0.0003;
          const g = kneeGeo.endPlate.clone().rotateX(Math.atan2(ep.up.z, ep.up.y));
          cluster("endPlates", x, ep.centre.z, g, endPlateMat, [x, ep.centre.y - ep.axis.y * off, ep.centre.z - ep.axis.z * off], { size: [spec.rafter.width, spec.rafter.depth, t] });
          g.dispose();
        }
        for (const piece of frame.beam.pieces) {
          addMember(v3(x, piece.a), v3(x, piece.b), chordW, chordD, steel, groups.horizontal);
        }
        addMember(
          v3(x, frame.beam.splice.a),
          v3(x, frame.beam.splice.b),
          chordW + frame.beam.spliceOversize * scale,
          chordD + frame.beam.spliceOversize * scale,
          spliceMat,
          groups.splices,
        );
        for (const bar of frame.verticals) {
          addMember(v3(x, bar.a), v3(x, bar.b), web, web, webMat, groups.verticals);
        }
        // One W under each rafter, only in the inner 2.5 m beside the ridge.
        for (const bar of frame.wWebs) {
          addMember(v3(x, bar.a), v3(x, bar.b), web, web, webMat, groups.wWebs);
        }
      }

      const tieW = spec.columnTie.width * scale;
      const tieD = spec.columnTie.depth * scale;
      const yTie = yBeam - halfD - tieD / 2;
      // Tie connection (Tan, 30 Sep 2026: no site welding). The tie stops endGap short of each column face and
      // sits on a seat angle SHOP-welded to the column side face (no holes through the column); SITE: M16 bolts
      // down through the tie's bottom face into the angle's flat leg; push-in plastic caps close the tie ends.
      const ta = spec.tieAngle;
      const tieGap = spec.columnTie.endGap;
      const yTieUnder = yTie - tieD / 2;
      const connMat = new THREE.MeshStandardMaterial({ color: 0x7c868d, metalness: 0.65, roughness: 0.4 });
      const connBoltMat = new THREE.MeshStandardMaterial({ color: 0x3f474c, metalness: 0.75, roughness: 0.38 });
      const tieCapMat = new THREE.MeshStandardMaterial({ color: 0x1d1f21, metalness: 0.05, roughness: 0.7 });
      const hex = (af: number) => af / Math.sqrt(3);
      /** Angle geometry with its heel at the origin (column face, tie underside); `dir` points out of the column. */
      const angleGeo = (dir: number) => {
        const flat = new THREE.BoxGeometry(ta.leg, ta.thickness, ta.length).translate((dir * ta.leg) / 2, -ta.thickness / 2, 0);
        const upright = new THREE.BoxGeometry(ta.thickness, ta.leg - ta.thickness, ta.length).translate(
          (dir * ta.thickness) / 2,
          -ta.thickness - (ta.leg - ta.thickness) / 2,
          0,
        );
        const merged = mergeGeometries([flat, upright], false) ?? flat.clone();
        flat.dispose();
        upright.dispose();
        geos.push(merged);
        return merged;
      };
      const angleGeos = { [-1]: angleGeo(-1), [1]: angleGeo(1) } as Record<number, import("three").BufferGeometry>;
      // M16 × 35: head inside the tie on its bottom wall, shank down through the tie wall and the angle's flat leg,
      // washer and nut under the leg. Origin at the tie's underside.
      const tw = spec.columnTie.wall;
      const tieBoltLen = tw + ta.thickness + 0.003 + 0.013 + 0.004;
      const tieBoltParts = [
        new THREE.CylinderGeometry(hex(0.024), hex(0.024), 0.01, 6).translate(0, tw + 0.005, 0),
        new THREE.CylinderGeometry(ta.bolt / 2, ta.bolt / 2, tieBoltLen, 10).translate(0, tw - tieBoltLen / 2, 0),
        new THREE.CylinderGeometry(0.015, 0.015, 0.003, 14).translate(0, -ta.thickness - 0.0015, 0),
        new THREE.CylinderGeometry(hex(0.024), hex(0.024), 0.013, 6).translate(0, -ta.thickness - 0.003 - 0.0065, 0),
      ];
      const tieBoltGeo = mergeGeometries(tieBoltParts, false) ?? tieBoltParts[0].clone();
      for (const g of tieBoltParts) g.dispose();
      geos.push(tieBoltGeo);
      const tieCapGeo = new THREE.BoxGeometry(ta.cap, tieD, tieW);
      geos.push(tieCapGeo);
      for (let i = 0; i < derived.frames - 1; i += 1) {
        const faceA = x0 + i * spec.bay + col / 2;
        const faceB = x0 + (i + 1) * spec.bay - col / 2;
        const xA = faceA + tieGap;
        const xB = faceB - tieGap;
        for (const sign of [-1, 1]) {
          const z = sign * (zCol + col / 2 - tieW / 2);
          addMember(new THREE.Vector3(xA, yTie, z), new THREE.Vector3(xB, yTie, z), tieW, tieD, steel, groups.ties);
          for (const [face, dir, end] of [[faceA, 1, xA], [faceB, -1, xB]] as const) {
            const colX = face - (dir * col) / 2;
            cluster("tieAngles", colX, z, angleGeos[dir], connMat, [face, yTieUnder, sign * zCol], { size: [ta.leg, ta.leg, ta.length] });
            for (const g of [-1, 1]) {
              cluster("tieBolts", colX, z, tieBoltGeo, connBoltMat, [face + dir * ta.boltAt, yTieUnder, sign * zCol + (g * ta.gauge) / 2], {
                length: tieBoltLen,
              });
            }
            cluster("tieCaps", colX, z, tieCapGeo, tieCapMat, [end - (dir * ta.cap) / 2, yTie, z], { size: [ta.cap, tieD, tieW] });
          }
        }
      }

      const zFace = zCol + col / 2;
      // Floor slab (Tan, 28 Sep 8:48 PM): 4 in thick everywhere, the underside following the top's fall; it runs past
      // the columns' outside face (and past the end columns, to the pads' outer faces) so every base plate is buried.
      const floorT = spec.floor.thickness;
      const zToe = zFace + spec.floor.toe;
      const floorRun = spec.length + spec.concrete.side;
      const floorShape = new THREE.Shape();
      floorShape.moveTo(-zToe, 0);
      floorShape.lineTo(-zFace, 0);
      floorShape.lineTo(0, yCenter - floorT);
      floorShape.lineTo(zFace, 0);
      floorShape.lineTo(zToe, 0);
      floorShape.lineTo(zToe, yEdge);
      floorShape.lineTo(zFace, yEdge);
      floorShape.lineTo(0, yCenter);
      floorShape.lineTo(-zFace, yEdge);
      floorShape.lineTo(-zToe, yEdge);
      floorShape.closePath();
      const floorGeo = new THREE.ExtrudeGeometry(floorShape, { depth: floorRun, bevelEnabled: false });
      // Shape (u, v) -> world (z, y); extrusion along -x after the turn, then centred on the length.
      floorGeo.rotateY(-Math.PI / 2);
      floorGeo.translate(floorRun / 2, 0, 0);
      geos.push(floorGeo);
      groups.floor.add(new THREE.Mesh(floorGeo, floorMat));

      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xb7b2a8,
        roughness: 0.9,
        metalness: 0.02,
      });
      const wallT = spec.wall.thickness;
      const yIn = yEdge + spec.wall.inside;
      const yOut = yEdge + spec.wall.outside;
      for (let bay = 0; bay < derived.bays; bay += 1) {
        const xA = x0 + bay * spec.bay + col / 2;
        const xB = x0 + (bay + 1) * spec.bay - col / 2;
        for (const sign of [-1, 1]) {
          const zOut = sign * zFace;
          const zIn = sign * (zFace - wallT);
          const y0 = yEdge;
          const verts = [
            [xA, y0, zIn],
            [xB, y0, zIn],
            [xB, y0, zOut],
            [xA, y0, zOut],
            [xA, yIn, zIn],
            [xB, yIn, zIn],
            [xB, yOut, zOut],
            [xA, yOut, zOut],
          ];
          const center = [(xA + xB) / 2, y0 + 0.4, (zIn + zOut) / 2];
          const indices: number[] = [];
          const tri = (ia: number, ib: number, ic: number) => {
            const a = verts[ia];
            const b = verts[ib];
            const c = verts[ic];
            const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
            const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
            const n = [
              ab[1] * ac[2] - ab[2] * ac[1],
              ab[2] * ac[0] - ab[0] * ac[2],
              ab[0] * ac[1] - ab[1] * ac[0],
            ];
            const mid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
            const out = n[0] * (mid[0] - center[0]) + n[1] * (mid[1] - center[1]) + n[2] * (mid[2] - center[2]);
            indices.push(ia, out < 0 ? ic : ib, out < 0 ? ib : ic);
          };
          for (const [a, b, c, d] of [
            [0, 1, 2, 3],
            [4, 5, 6, 7],
            [0, 1, 5, 4],
            [3, 2, 6, 7],
            [0, 3, 7, 4],
            [1, 2, 6, 5],
          ] as const) {
            tri(a, b, c);
            tri(a, c, d);
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.Float32BufferAttribute(verts.flat(), 3));
          geo.setIndex(indices);
          geo.computeVertexNormals();
          geos.push(geo);
          groups.walls.add(new THREE.Mesh(geo, wallMat));
        }
      }

      // Wall rebar: one layer of Y10 at mid-thickness, merged into one mesh per wall panel. Horizontal bars run
      // column side to column side (welded there); verticals are centred in the bay at the grid spacing.
      const wm = spec.wallMesh;
      const rebarMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, metalness: 0.5, roughness: 0.6 });
      const wallMeanH = (spec.wall.inside + spec.wall.outside) / 2;
      const panelLen = spec.bay - col;
      // Verticals run straight down 6 in below the floor top (no starter bars, Tan 29 Sep 4:27 PM).
      const vertLen = wallMeanH - wm.topCover + wm.below;
      for (let bay = 0; bay < derived.bays; bay += 1) {
        const mid = x0 + (bay + 0.5) * spec.bay;
        for (const sign of [-1, 1]) {
          const z = sign * (zFace - wallT / 2);
          const bars: import("three").BufferGeometry[] = [];
          for (let r = 0; r < wallQuantities.meshRows; r += 1) {
            const g = new THREE.CylinderGeometry(wm.bar / 2, wm.bar / 2, panelLen, 6);
            g.rotateZ(Math.PI / 2);
            g.translate(mid, yEdge + wm.firstRow + r * wm.grid, z);
            bars.push(g);
          }
          const n = wallQuantities.meshVerticals;
          for (let k = 0; k < n; k += 1) {
            const g = new THREE.CylinderGeometry(wm.bar / 2, wm.bar / 2, vertLen, 6);
            g.translate(mid + (k - (n - 1) / 2) * wm.grid, yEdge - wm.below + vertLen / 2, z);
            bars.push(g);
          }
          const merged = mergeGeometries(bars);
          for (const g of bars) g.dispose();
          geos.push(merged);
          groups.wallRebar.add(new THREE.Mesh(merged, rebarMat));
        }
      }

      // Floor mesh (Tan, 29 Sep 4:29 PM): BRC A10, 10 mm bars at 7 in (178 mm) each way, one layer at mid-depth of the
      // 4 in slab, following the fall. Merged into 18 pieces along the length (a few draw calls on a phone).
      {
        const fm = spec.floorMesh;
        const t = fm.bar;
        const top = (zAbs: number) => (zAbs >= zFace ? yEdge : yCenter - ((yCenter - yEdge) * zAbs) / zFace);
        const midY = (zAbs: number) => top(zAbs) - spec.floor.thickness / 2;
        const zEnd = zToe - 0.05;
        const xStart = -floorRun / 2 + 0.05;
        const xEnd = floorRun / 2 - 0.05;
        const chunks = 18;
        const chunkLen = (xEnd - xStart) / chunks;
        const nLong = foundationQuantities.longBars;
        const nCross = foundationQuantities.crossBars;
        const bar = (a: import("three").Vector3, b: import("three").Vector3) => {
          const len = a.distanceTo(b);
          const g = new THREE.BoxGeometry(len, t, t);
          const dir = b.clone().sub(a).normalize();
          g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir));
          g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
          return g;
        };
        for (let c = 0; c < chunks; c += 1) {
          const xa = xStart + c * chunkLen;
          const xb = xa + chunkLen;
          const list: import("three").BufferGeometry[] = [];
          // Long bars (along the length), underneath.
          for (let i = 0; i < nLong; i += 1) {
            const z = -zEnd + i * fm.grid;
            const y = midY(Math.abs(z)) - t / 2;
            list.push(bar(new THREE.Vector3(xa, y, z), new THREE.Vector3(xb, y, z)));
          }
          // Cross bars (across the width), on top, bent at the ridge line and at the column faces.
          for (let j = 0; j < nCross; j += 1) {
            const x = xStart + j * fm.grid;
            if (x < xa - 1e-6 || x >= xb - 1e-6) continue;
            const pts = [-zEnd, -zFace, 0, zFace, zEnd].map((z) => new THREE.Vector3(x, midY(Math.abs(z)) + t / 2, z));
            for (let k = 0; k < pts.length - 1; k += 1) list.push(bar(pts[k], pts[k + 1]));
          }
          const merged = mergeGeometries(list);
          for (const g of list) g.dispose();
          geos.push(merged);
          groups.floorMesh.add(new THREE.Mesh(merged, rebarMat));
        }
      }

      const pD = spec.purlin.depth * scale;
      const pB = spec.purlin.flange * scale;
      const pL = spec.purlin.lip * scale;
      const pT = spec.purlin.wall * scale;
      const purlinLen = spec.length + spec.rafter.width + 2 * spec.purlin.endOverhang;
      const cos = Math.cos(derived.pitch);
      const sin = Math.sin(derived.pitch);
      const stations = purlinStations(zCol + col / 2, zTip);
      // Tan's cut plan: one piece per bay, butt-jointed on the rafter centre with a small gap; the end pieces run
      // on past the end rafters to carry the gable overhang. Each piece is its own group (one pickable piece).
      const pGap = spec.purlin.jointGap;
      const purlinPieces: [number, number][] = [];
      for (let b = 0; b < derived.bays; b += 1) {
        const a = b === 0 ? -purlinLen / 2 : x0 + b * spec.bay + pGap / 2;
        const e = b === derived.bays - 1 ? purlinLen / 2 : x0 + (b + 1) * spec.bay - pGap / 2;
        purlinPieces.push([a, e]);
      }
      for (const sign of [-1, 1]) {
        for (const zAbs of stations) {
          const zOuter = sign * zAbs;
          const yLine = yRidge - derived.rise * (zAbs / zTip);
          const yBottom = yLine + halfD / cos;
          const xAxis = new THREE.Vector3(sign > 0 ? -1 : 1, 0, 0);
          const yAxis = new THREE.Vector3(0, cos, sign * sin);
          const zAxis = new THREE.Vector3(0, sin, sign > 0 ? -cos : cos);
          for (const [a, e] of purlinPieces) {
            const len = e - a;
            const xMid = ((a + e) / 2) * (sign > 0 ? -1 : 1);
            const group = new THREE.Group();
            group.matrix.makeBasis(xAxis, yAxis, zAxis);
            group.matrix.setPosition(0, yBottom, zOuter);
            group.matrixAutoUpdate = false;
            groups.purlins.add(group);
            const addBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
              const geo = new THREE.BoxGeometry(sx, sy, sz);
              geos.push(geo);
              const mesh = new THREE.Mesh(geo, purlinMat);
              mesh.position.set(x, y, z);
              group.add(mesh);
            };
            // Local z runs up the slope from the downslope edge. Web on the downslope (eave) side, flanges and
            // lips open up the slope, facing back inside.
            addBox(xMid, pT / 2, pB / 2, len, pT, pB);
            addBox(xMid, pD - pT / 2, pB / 2, len, pT, pB);
            addBox(xMid, pD / 2, pT / 2, len, pD, pT);
            addBox(xMid, pT + pL / 2, pB - pT / 2, len, pL, pT);
            addBox(xMid, pD - pT - pL / 2, pB - pT / 2, len, pL, pT);
          }
        }
      }

      const cleatMat = new THREE.MeshStandardMaterial({ color: 0x9aa3aa, metalness: 0.7, roughness: 0.4 });
      const cleatT = spec.cleat.thickness * scale;
      const cleatH = spec.cleat.height * scale;
      const cleatSeat = spec.cleat.base * scale;
      const cleatLen = spec.cleat.length * scale;
      const slotMat = new THREE.MeshStandardMaterial({ color: 0x2c3134, metalness: 0.3, roughness: 0.6 });
      const holeY = cleatT + spec.cleat.hole * scale;
      const holeX = [-0.08, -0.03, 0.03, 0.08];
      for (let frame = 0; frame < derived.frames; frame += 1) {
        const x = x0 + frame * spec.bay;
        for (const sign of [-1, 1]) {
          for (const zAbs of stations) {
            const group = new THREE.Group();
            const xAxis = new THREE.Vector3(sign > 0 ? -1 : 1, 0, 0);
            const yAxis = new THREE.Vector3(0, cos, sign * sin);
            const zAxis = new THREE.Vector3(0, sin, sign > 0 ? -cos : cos);
            const yLine = yRidge - derived.rise * (zAbs / zTip);
            const yBottom = yLine + halfD / cos;
            group.matrix.makeBasis(xAxis, yAxis, zAxis);
            group.matrix.setPosition(x, yBottom, sign * zAbs);
            group.matrixAutoUpdate = false;
            groups.cleats.add(group);
            const addCleat = (
              lx: number,
              ly: number,
              lz: number,
              sx: number,
              sy: number,
              sz: number,
              material: import("three").Material,
            ) => {
              const geo = new THREE.BoxGeometry(sx, sy, sz);
              geos.push(geo);
              const mesh = new THREE.Mesh(geo, material);
              mesh.position.set(lx, ly, lz);
              group.add(mesh);
            };
            // The bracket bolts to the outside of the purlin web, which is on the downslope side, so its leg
            // stands just downslope of the purlin and its base runs down the rafter from there.
            addCleat(0, cleatT / 2, -cleatSeat / 2, cleatLen, cleatT, cleatSeat, cleatMat);
            addCleat(0, cleatT + cleatH / 2, -cleatT / 2, cleatLen, cleatH, cleatT, cleatMat);
            for (const hx of holeX) {
              addCleat(
                hx * scale,
                holeY,
                -cleatT - 0.001 * scale,
                spec.cleat.slot * scale,
                spec.cleat.slotHeight * scale,
                0.002 * scale,
                slotMat,
              );
            }
          }
        }
      }

      const roofMat = new THREE.MeshStandardMaterial({
        color: 0xd5dbe2,
        metalness: 0.62,
        roughness: 0.38,
        side: THREE.DoubleSide,
      });
      const foamMat = new THREE.MeshStandardMaterial({
        color: 0xe6d7a2,
        roughness: 0.86,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
      /** The panel's flat 0.47 mm zincalume backing sheet. */
      const backingMat = new THREE.MeshStandardMaterial({
        color: 0xcfd5da,
        metalness: 0.6,
        roughness: 0.42,
        side: THREE.DoubleSide,
      });
      const ceilingMat = new THREE.MeshStandardMaterial({
        color: 0xc5ccd2,
        metalness: 0.55,
        roughness: 0.42,
        side: THREE.DoubleSide,
      });
      const ribH = spec.roof.rib * scale;
      const fluteH = spec.roof.flute * scale;
      const foamT = spec.roof.foam * scale;

      const DRAW_FLUTES = false;
      /** Sheet profile across `width`; `phase` shifts the module pattern so both edges can land on flat pans. */
      const profile = (width: number, phase = 0) => {
        const pts: [number, number][] = [];
        const push = (x: number, y: number) => {
          if (phase > 0 && x > width + 1e-4) return;
          const xc = Math.min(Math.max(x, 0), width);
          const last = pts[pts.length - 1];
          if (last && Math.abs(last[0] - xc) < 1e-5 && Math.abs(last[1] - y) < 1e-5) return;
          if (x < -1e-4) return;
          pts.push([xc, y]);
        };
        if (phase > 0) push(0, 0);
        // Mega Rib 35: one trapezoid rib per 241 mm pitch, then a flat pan. The four ~2 mm pan flutes are
        // not drawn: across the 105 m roof and lining they would quadruple the triangle count (slow on
        // phones, and slower Measure taps) for a detail that is invisible beyond arm's length.
        const r = spec.roof;
        const flank = (r.ribBase - r.ribCrest) / 2;
        const pan = r.ribPitch - r.ribBase;
        const modules = Math.ceil((width + phase) / r.ribPitch - 1e-9);
        for (let m = 0; m < modules; m += 1) {
          const o = m * r.ribPitch - phase;
          push(o, 0);
          push(o + flank, ribH);
          push(o + flank + r.ribCrest, ribH);
          push(o + r.ribBase, 0);
          for (let k = 1; k <= (DRAW_FLUTES ? r.flutesPerPan : 0); k += 1) {
            const c = r.ribBase + (pan * k) / (r.flutesPerPan + 1);
            push(o + c - r.fluteWidth / 2, 0);
            push(o + c - r.fluteWidth / 4, fluteH);
            push(o + c + r.fluteWidth / 4, fluteH);
            push(o + c + r.fluteWidth / 2, 0);
          }
          push(o + r.ribPitch, 0);
        }
        if (phase > 0) push(width, 0);
        return pts;
      };
      /** The phase that keeps ribs and flutes furthest from both edges of a sheet `width` wide. */
      const panPhase = (width: number) => {
        let best = 0;
        let bestGap = -1;
        for (let p = 0.002; p < spec.roof.ribPitch; p += 0.002) {
          // Only the main ribs matter; the 2 mm pan flutes are too small to clash.
          const raised = profile(width, p).filter(([, h]) => h > fluteH + 1e-6);
          const gap = Math.min(...raised.map(([x]) => Math.min(x, width - x)));
          if (gap > bestGap) {
            bestGap = gap;
            best = p;
          }
        }
        return best;
      };

      const ribMesh = (
        width: number,
        length: number,
        yBase: number,
        down: boolean,
        material: import("three").Material,
        z0 = 0,
        phase = 0,
      ) => {
        const pts = profile(width, phase);
        const positions: number[] = [];
        const dir = down ? -1 : 1;
        const z1 = z0 + length;
        for (let i = 0; i < pts.length - 1; i += 1) {
          const [x0, h0] = pts[i];
          const [x1, h1] = pts[i + 1];
          const y0 = yBase + dir * h0;
          const y1 = yBase + dir * h1;
          const xa = x0 - width / 2;
          const xb = x1 - width / 2;
          positions.push(xa, y0, z0, xb, y1, z0, xb, y1, z1, xa, y0, z0, xb, y1, z1, xa, y0, z1);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();
        geos.push(geo);
        return new THREE.Mesh(geo, material);
      };

      /**
       * The PUR core and metal backing under a ribMesh skin (same local frame: pan at yBase, ribs towards +y).
       * The foam fills every rib and flute up to 1 mm under the skin and runs foamT below the pans; the flat
       * 0.47 mm metal backing covers its underside. Only the foam's profile-shaped ends and two sides are drawn:
       * its top (1 mm under the skin) and bottom (on the backing) are always hidden, and drawing them lets the
       * foam speckle through from far away. So the foam shows only at cut edges.
       */
      const foamSolid = (width: number, length: number, yBase: number, z0 = 0, phase = 0) => {
        const pts = profile(width, phase);
        const yBot = yBase - 0.001 - foamT;
        const top = (h: number) => yBase + h - 0.001;
        const X = (x: number) => x - width / 2;
        const z1 = z0 + length;
        const pos: number[] = [];
        const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
        // End caps: one rectangle up to the pans, plus the part of each rib above the pans (few triangles).
        for (const z of [z0, z1]) {
          quad([X(0), yBot, z], [X(width), yBot, z], [X(width), top(0), z], [X(0), top(0), z]);
          // Each rib above the pans is a convex run of profile points: fan it from its first point.
          for (let i = 0; i < pts.length - 1; i += 1) {
            if (pts[i + 1][1] < 1e-6) continue;
            const run = [pts[i]];
            while (i + 1 < pts.length && (pts[i + 1][1] > 1e-6 || run.length === 1)) run.push(pts[++i]);
            if (i + 1 < pts.length) run.push(pts[i + 1]);
            const P = ([x, h]: [number, number]) => [X(x), top(h), z];
            for (let j = 1; j < run.length - 1; j += 1) pos.push(...P(run[0]), ...P(run[j]), ...P(run[j + 1]));
          }
        }
        for (const [x, h] of [pts[0], pts[pts.length - 1]]) {
          quad([X(x), yBot, z0], [X(x), yBot, z1], [X(x), top(h), z1], [X(x), top(h), z0]);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        geo.computeVertexNormals();
        geos.push(geo);
        const backGeo = new THREE.BufferGeometry();
        backGeo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute([X(0), yBot, z0, X(width), yBot, z0, X(width), yBot, z1, X(0), yBot, z1], 3),
        );
        backGeo.setIndex([0, 2, 1, 0, 3, 2]);
        backGeo.computeVertexNormals();
        geos.push(backGeo);
        const core = new THREE.Group();
        core.add(new THREE.Mesh(geo, foamMat), new THREE.Mesh(backGeo, backingMat));
        return core;
      };

      const slopeLen = derived.rafterCentre - pD * Math.tan(derived.pitch);
      const eaveOverhang = spec.roof.eaveOverhang;
      const sheetLen = slopeLen + eaveOverhang;
      for (const sign of [-1, 1]) {
        const group = new THREE.Group();
        const xAxis = new THREE.Vector3(sign > 0 ? -1 : 1, 0, 0);
        const yAxis = new THREE.Vector3(0, cos, sign * sin);
        const zAxis = new THREE.Vector3(0, sin, sign > 0 ? -cos : cos);
        group.matrix.makeBasis(xAxis, yAxis, zAxis);
        group.matrix.setPosition(0, yTip + halfD / cos, sign * zTip);
        group.matrixAutoUpdate = false;
        // Option A (Tan, 1 Oct 2026): the roof is the Mega Rib 35 PUR 25 panel again (roofFoam > 0).
        const yPan = pD + spec.roof.lift + spec.roof.roofFoam * scale + 0.001;
        const skin = ribMesh(purlinLen, sheetLen, yPan, false, roofMat, -eaveOverhang);
        group.add(skin);
        // Foam fills the ribs, metal backing underneath; the last bareTip at the eave end of the sheet is bare skin.
        if (spec.roof.roofFoam > 0) {
          group.add(foamSolid(purlinLen, sheetLen - spec.roof.bareTip, yPan, -eaveOverhang + spec.roof.bareTip));
        }
        groups.roof.add(group);
      }

      // Runs over the wall lining to its pan line; the lining stops 2 mm under this panel's rib crests (see frameLayout).
      const ceilingWidth = frameMid.ceiling.z1 - frameMid.ceiling.z0;
      const ceilingLength = spec.length - chordW;
      // Both edges land on flat pans, so no ceiling rib runs into the lining's ribs at the corner.
      // Option A (Tan, 1 Oct 2026): plain Mega Rib 35 ceiling sheet, 0.35 TCT, no foam, RIBS DOWN (crests at 4.000 clear).
      // Its pans are at frameMid.ceiling.y, 1 mm under the truss.
      const ceilingPhase = panPhase(ceilingWidth);
      const ceiling = new THREE.Group();
      ceiling.add(ribMesh(ceilingWidth, ceilingLength, frameMid.ceiling.y, true, ceilingMat, 0, ceilingPhase));
      ceiling.rotation.y = Math.PI / 2;
      ceiling.position.set(-ceilingLength / 2, 0, 0);
      groups.ceiling.add(ceiling);

      const capMat = new THREE.MeshStandardMaterial({
        color: 0xe4e8ea,
        metalness: 0.7,
        roughness: 0.32,
        side: THREE.DoubleSide,
      });
      const wing = (spec.ridgeCap.girth - 2 * spec.ridgeCap.lip) / 2;
      const capLift = pD + spec.roof.lift + spec.roof.roofFoam * scale + ribH + 0.002;
      const yCrease = yRidge + halfD / cos + capLift / cos;
      const halfRun = purlinLen / 2;
      const capPos: number[] = [];
      const capPush = (a: number[], b: number[], c: number[]) => {
        capPos.push(...a, ...b, ...c);
      };
      for (const sign of [-1, 1]) {
        const down = [0, -sin, sign * cos];
        const end = [down[0] * wing, yCrease + down[1] * wing, down[2] * wing];
        const hem = [end[0], end[1] - spec.ridgeCap.lip, end[2]];
        const creaseL = [-halfRun, yCrease, 0];
        const creaseR = [halfRun, yCrease, 0];
        const endL = [-halfRun, end[1], end[2]];
        const endR = [halfRun, end[1], end[2]];
        const hemL = [-halfRun, hem[1], hem[2]];
        const hemR = [halfRun, hem[1], hem[2]];
        capPush(creaseL, endL, endR);
        capPush(creaseL, endR, creaseR);
        capPush(endL, hemL, hemR);
        capPush(endL, hemR, endR);
      }
      const capGeo = new THREE.BufferGeometry();
      capGeo.setAttribute("position", new THREE.Float32BufferAttribute(capPos, 3));
      capGeo.computeVertexNormals();
      geos.push(capGeo);
      groups.capping.add(new THREE.Mesh(capGeo, capMat));

      const rodMat = new THREE.MeshStandardMaterial({ color: 0x9aa3a8, metalness: 0.8, roughness: 0.35 });
      const rodR = (spec.sagRod.diameter * scale) / 2;
      const purlinPoint = (sign: number, zAbs: number, x: number) => {
        const yLine = yRidge - derived.rise * (zAbs / zTip);
        const yBottom = yLine + halfD / cos;
        const xAxis = new THREE.Vector3(sign > 0 ? -1 : 1, 0, 0);
        const yAxis = new THREE.Vector3(0, cos, sign * sin);
        const zAxis = new THREE.Vector3(0, sin, sign > 0 ? -cos : cos);
        return new THREE.Vector3(0, yBottom, sign * zAbs)
          .addScaledVector(xAxis, x * xAxis.x)
          .addScaledVector(yAxis, pD / 2)
          .addScaledVector(zAxis, pT / 2);
      };
      const addRod = (a: import("three").Vector3, b: import("three").Vector3) => {
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        if (len < 1e-4) return;
        const geo = new THREE.CylinderGeometry(rodR, rodR, len, 6);
        geos.push(geo);
        const mesh = new THREE.Mesh(geo, rodMat);
        mesh.position.copy(a).add(b).multiplyScalar(0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        groups.sagRods.add(mesh);
      };
      for (let bay = 0; bay < derived.bays; bay += 1) {
        for (const at of [1 / 3, 2 / 3]) {
          const x = x0 + (bay + at) * spec.bay;
          for (const sign of [-1, 1]) {
            for (let i = 0; i < stations.length - 1; i += 1) {
              addRod(purlinPoint(sign, stations[i], x), purlinPoint(sign, stations[i + 1], x));
            }
          }
          addRod(purlinPoint(-1, stations[0], x), purlinPoint(1, stations[0], x));
        }
      }

      const braceR = (spec.roofBrace.diameter * scale) / 2;
      const braceMat = new THREE.MeshStandardMaterial({ color: 0xd5dbe0, metalness: 0.85, roughness: 0.25 });
      const addBrace = (a: import("three").Vector3, b: import("three").Vector3) => {
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = dir.length();
        const geo = new THREE.CylinderGeometry(braceR, braceR, len, 8);
        geos.push(geo);
        const mesh = new THREE.Mesh(geo, braceMat);
        mesh.position.copy(a).add(b).multiplyScalar(0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        groups.roofBraces.add(mesh);
      };
      const under = (sign: number, x: number, atRidge: boolean, lift: number) => {
        const z = atRidge ? 0 : sign * zCol;
        const y = atRidge ? yRidge : yRafterAtColumn;
        return new THREE.Vector3(x, y - (halfD + lift) * cos, z - sign * (halfD + lift) * sin);
      };
      for (const bay of roofBraceBays) {
        const xA = x0 + bay * spec.bay;
        const xB = xA + spec.bay;
        for (const sign of [-1, 1]) {
          addBrace(under(sign, xA, false, braceR), under(sign, xB, true, braceR));
          addBrace(under(sign, xA, true, braceR + 0.004 * scale), under(sign, xB, false, braceR + 0.004 * scale));
        }
      }

      const addCee = (
        lengthAxis: import("three").Vector3,
        up: import("three").Vector3,
        side: import("three").Vector3,
        origin: import("three").Vector3,
        length: number,
        group: import("three").Group,
        dims: { depth: number; flange: number; lip: number; wall: number } = spec.purlin,
      ) => {
        const pD = dims.depth * scale;
        const pB = dims.flange * scale;
        const pL = dims.lip * scale;
        const pT = dims.wall * scale;
        const piece = new THREE.Group();
        piece.matrix.makeBasis(lengthAxis, up, side);
        piece.matrix.setPosition(origin);
        piece.matrixAutoUpdate = false;
        const addBox = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
          const geo = new THREE.BoxGeometry(sx, sy, sz);
          geos.push(geo);
          const mesh = new THREE.Mesh(geo, purlinMat);
          mesh.position.set(x, y, z);
          piece.add(mesh);
        };
        addBox(0, pT / 2, pB / 2, length, pT, pB);
        addBox(0, pD - pT / 2, pB / 2, length, pT, pB);
        addBox(0, pD / 2, pT / 2, length, pD, pT);
        addBox(0, pT + pL / 2, pB - pT / 2, length, pL, pT);
        addBox(0, pD - pT - pL / 2, pB - pT / 2, length, pL, pT);
        group.add(piece);
      };
      const beamTop = yBeam + halfD;
      const clearOfWeb = (spec.web.side * scale) / 2;
      const pieceLen = spec.bay + 0.1;
      const lines = [-spec.columnCentres / 4, 0, spec.columnCentres / 4];
      for (let bay = 0; bay < derived.bays; bay += 1) {
        const mid = x0 + (bay + 0.5) * spec.bay;
        const positive = bay % 2 === 1;
        for (const zV of lines) {
          addCee(
            new THREE.Vector3(positive ? 1 : -1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, positive ? 1 : -1),
            new THREE.Vector3(mid, beamTop, zV + (positive ? clearOfWeb : -clearOfWeb)),
            pieceLen,
            groups.ceilingLong,
          );
        }
      }
      const boltR = (0.01 * scale) / 2;
      const boltMat = new THREE.MeshStandardMaterial({ color: 0x4d5559, metalness: 0.75, roughness: 0.4 });
      for (let frame = 1; frame < derived.frames - 1; frame += 1) {
        const x = x0 + frame * spec.bay;
        for (const zV of lines) {
          const zA = zV - clearOfWeb - pT / 2;
          const zB = zV + clearOfWeb + pT / 2;
          const geo = new THREE.CylinderGeometry(boltR, boltR, zB - zA + 0.03 * scale, 8);
          geos.push(geo);
          const bolt = new THREE.Mesh(geo, boltMat);
          bolt.position.set(x, beamTop + pD / 2, (zA + zB) / 2);
          bolt.rotation.x = Math.PI / 2;
          groups.ceilingBolts.add(bolt);
        }
      }
      const crossLen = spec.columnCentres + spec.column.side;
      for (let bay = 0; bay < derived.bays; bay += 1) {
        const xFrame = x0 + bay * spec.bay;
        for (const dx of [2, 4]) {
          addCee(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(-1, 0, 0),
            // Tan 7:25 PM: bottom flange on the ceiling sheet's pans (1 mm under the column top), ends bearing on
            // the SHS ties; hung from the long purlins by L50 hanger angles (was a 27 mm gap with a notional packer).
            // Bottom flange ON the SHS ties' top (column top); the ceiling sheet is 1 mm under it (screw-clamped).
            new THREE.Vector3(xFrame + dx, frameMid.ceiling.top + 0.001, 0),
            crossLen,
            groups.ceilingCross,
            spec.crossPurlin,
          );
        }
      }
      // Ceiling hangers (Tan 7:25 PM): one upright L50×50×5 at every crossing, one leg on the back of the long purlin's web,
      // the other on the back of the cross purlin's web (the cross C's web back is at its x, flanges towards -x);
      // 2 × M10 through each leg. No welding.
      {
        const hg = spec.ceilingHanger;
        const hMat = new THREE.MeshStandardMaterial({ color: 0x8a949a, metalness: 0.65, roughness: 0.4 });
        const yH0 = frameMid.ceiling.top + hg.bottomGap;
        const yH1 = beamTop + spec.purlin.depth - hg.topGap;
        const hH = yH1 - yH0;
        const legGeoX = new THREE.BoxGeometry(hg.leg, hH, hg.thickness);
        const legGeoZ = new THREE.BoxGeometry(hg.thickness, hH, hg.leg);
        const boltGeo = new THREE.CylinderGeometry(hg.bolt / 2, hg.bolt / 2, 0.03, 8);
        // Vertical slots in the cross-purlin leg (drawn as dark patches through the leg) for levelling the cross purlins.
        const slotGeo = new THREE.BoxGeometry(hg.thickness + 0.0006, hg.slot.length, hg.slot.width);
        const slotMat = new THREE.MeshStandardMaterial({ color: 0x1d2225, metalness: 0.2, roughness: 0.8 });
        geos.push(legGeoX, legGeoZ, boltGeo, slotGeo);
        const pW = spec.purlin.wall;
        const cW = spec.crossPurlin.wall;
        for (let bay = 0; bay < derived.bays; bay += 1) {
          const xFrame = x0 + bay * spec.bay;
          const s = bay % 2 === 1 ? 1 : -1;
          for (const dx of [2, 4]) {
            const xc = xFrame + dx;
            for (const zV of lines) {
              const zW = zV + s * clearOfWeb;
              const g = new THREE.Group();
              const legA = new THREE.Mesh(legGeoX, hMat);
              legA.position.set(xc + hg.leg / 2, (yH0 + yH1) / 2, zW - (s * hg.thickness) / 2);
              const legB = new THREE.Mesh(legGeoZ, hMat);
              legB.position.set(xc + hg.thickness / 2, (yH0 + yH1) / 2, zW - (s * hg.leg) / 2);
              g.add(legA, legB);
              const yLong = beamTop + spec.purlin.depth / 2;
              const yCross = frameMid.ceiling.top + spec.crossPurlin.depth / 2;
              for (const dy of [-0.02, 0.02]) {
                const bA = new THREE.Mesh(boltGeo, hMat);
                bA.rotation.x = Math.PI / 2;
                bA.position.set(xc + hg.leg / 2 + dy, yLong, zW - s * (hg.thickness - pW) / 2);
                const bB = new THREE.Mesh(boltGeo, hMat);
                bB.rotation.z = Math.PI / 2;
                bB.position.set(xc + (hg.thickness - cW) / 2, yCross + dy, zW - (s * hg.leg) / 2);
                const slot = new THREE.Mesh(slotGeo, slotMat);
                slot.position.set(xc + hg.thickness / 2, yCross + dy, zW - (s * hg.leg) / 2);
                g.add(bA, bB, slot);
              }
              g.userData.length = hH;
              groups.ceilingHangers.add(g);
            }
          }
        }
      }

      // Ceiling edge angles: flat leg on the SHS tie top, running past the tie's inside face over the ceiling sheet's
      // edge pan (screwed up through the pan on a sealant bead); upright leg at the heel, on the tie. 3 pieces per bay
      // per side, cut to fit between the columns and the cross purlins (whose flanges point to -x from their web).
      {
        const ce = spec.ceilingEdge;
        const edgeMat = new THREE.MeshStandardMaterial({ color: 0xa9b3b9, metalness: 0.6, roughness: 0.38 });
        const yFlat = yTie + tieD / 2;
        const zInside = zCol - col / 2;
        const g = ce.gap;
        const f = spec.crossPurlin.flange;
        for (let bay = 0; bay < derived.bays; bay += 1) {
          const xF = x0 + bay * spec.bay;
          const runs: [number, number][] = [
            [xF + col / 2 + g, xF + 2 - f - g],
            [xF + 2 + g, xF + 4 - f - g],
            [xF + 4 + g, xF + spec.bay - col / 2 - g],
          ];
          for (const sign of [-1, 1]) {
            const zHeel = sign * (zInside + ce.onTie);
            const zToe = sign * (zInside + ce.onTie - ce.flat);
            for (const [xa, xb] of runs) {
              const len = xb - xa;
              const piece = new THREE.Group();
              const flatGeo = new THREE.BoxGeometry(len, ce.thickness, ce.flat);
              const upGeo = new THREE.BoxGeometry(len, ce.up, ce.thickness);
              geos.push(flatGeo, upGeo);
              const flat = new THREE.Mesh(flatGeo, edgeMat);
              flat.position.set((xa + xb) / 2, yFlat + ce.thickness / 2, (zHeel + zToe) / 2);
              const upLeg = new THREE.Mesh(upGeo, edgeMat);
              upLeg.position.set((xa + xb) / 2, yFlat + ce.up / 2, zHeel - (sign * ce.thickness) / 2);
              piece.add(flat, upLeg);
              piece.userData.length = len;
              groups.ceilingEdge.add(piece);
            }
          }
        }
      }

      // Wall girts: one C per bay per row, between the columns (like the column ties). Web on top, open side
      // down so water cannot collect in it; the 127 mm depth runs out through the column, inner flange on the
      // lining's flat foam face, outer flange 2 mm past the column's outside face.
      const girtLen = spec.bay - col - 2 * spec.girt.endGap;
      // Girt connection (Tan, 30 Sep 2026: no site welding; L75×75×6, 2:24 PM): an angle SHOP-welded to the column
      // side face, upright leg pointing down, flat leg inside the C right under the web; SITE: 2 × M12 across the web.
      const gc = spec.girtCleat;
      /** Heel at the origin (column face, flat-leg top); `dir` points out of the column. */
      const girtAngleGeo = (dir: number) => {
        const flat = new THREE.BoxGeometry(gc.leg, gc.thickness, gc.width).translate((dir * gc.leg) / 2, -gc.thickness / 2, 0);
        const upright = new THREE.BoxGeometry(gc.thickness, gc.leg - gc.thickness, gc.width).translate(
          (dir * gc.thickness) / 2,
          -gc.thickness - (gc.leg - gc.thickness) / 2,
          0,
        );
        const merged = mergeGeometries([flat, upright], false) ?? flat.clone();
        flat.dispose();
        upright.dispose();
        geos.push(merged);
        return merged;
      };
      const girtAngles = { [-1]: girtAngleGeo(-1), [1]: girtAngleGeo(1) } as Record<number, import("three").BufferGeometry>;
      const gw = spec.purlin.wall;
      const girtBoltLen = gw + gc.thickness + 0.0025 + 0.0108 + 0.003;
      // Origin at the top of the girt web: head on the web, nut under the cleat.
      const girtBoltParts = [
        new THREE.CylinderGeometry(hex(0.018), hex(0.018), 0.008, 6).translate(0, 0.004, 0),
        new THREE.CylinderGeometry(gc.bolt / 2, gc.bolt / 2, girtBoltLen, 10).translate(0, -girtBoltLen / 2, 0),
        new THREE.CylinderGeometry(hex(0.018), hex(0.018), 0.0108, 6).translate(0, -gw - gc.thickness - 0.0025 - 0.0054, 0),
      ];
      const girtBoltGeo = mergeGeometries(girtBoltParts, false) ?? girtBoltParts[0].clone();
      for (const g of girtBoltParts) g.dispose();
      geos.push(girtBoltGeo);
      for (let bay = 0; bay < derived.bays; bay += 1) {
        const mid = x0 + (bay + 0.5) * spec.bay;
        const faceA = x0 + bay * spec.bay + col / 2;
        const faceB = x0 + (bay + 1) * spec.bay - col / 2;
        for (const g of frameMid.girts) {
          addCee(
            new THREE.Vector3(g.sign, 0, 0),
            new THREE.Vector3(0, 0, g.sign),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(mid, g.yTop, g.zIn),
            girtLen,
            groups.wallGirts,
          );
          const zc = g.zIn + (g.sign * spec.purlin.depth) / 2;
          for (const [face, dir] of [[faceA, 1], [faceB, -1]] as const) {
            const colX = face - (dir * col) / 2;
            cluster("girtCleats", colX, zc, girtAngles[dir], connMat, [face, g.yTop - gw, zc], {
              size: [gc.leg, gc.leg, gc.width],
            });
            for (const s of [-1, 1]) {
              cluster("girtBolts", colX, zc, girtBoltGeo, connBoltMat, [face + dir * gc.boltAt, g.yTop, zc + (s * gc.gauge) / 2], { length: girtBoltLen });
            }
          }
        }
      }

      // Girt tie rods (M12, one per bay per side at midspan, bottom girt through the middle girt up to the SHS tie) . Every rod is
      // the same length, so they share one cylinder geometry. No girt support under the bottom girt (Tan, 7:50 PM).
      const rodGeoLen = frameMid.girtRods[0].y1 - frameMid.girtRods[0].y0;
      const girtRodGeo = new THREE.CylinderGeometry(spec.girt.rodDiameter / 2, spec.girt.rodDiameter / 2, rodGeoLen, 8);
      geos.push(girtRodGeo);
      // Rod top (Tan's detail): M12 bolt welded head-up under the SHS tie, threads down, and a coupling nut that
      // joins the rod. One merged geometry with its origin at the tie's underside.
      const st = spec.girt.stud;
      const hexR = (af: number) => af / Math.sqrt(3);
      const studParts = [
        new THREE.CylinderGeometry(hexR(st.headAF), hexR(st.headAF), st.head, 6).translate(0, -st.head / 2, 0),
        new THREE.CylinderGeometry(0.006, 0.006, st.thread, 8).translate(0, -st.head - st.thread / 2, 0),
        new THREE.CylinderGeometry(hexR(st.couplerAF), hexR(st.couplerAF), st.coupler, 6).translate(0, -st.head - st.thread, 0),
      ];
      const studGeo = mergeGeometries(studParts, false) ?? studParts[0].clone();
      for (const g of studParts) g.dispose();
      geos.push(studGeo);
      const studMat = new THREE.MeshStandardMaterial({ color: 0x4d5559, metalness: 0.75, roughness: 0.4 });
      for (let bay = 0; bay < derived.bays; bay += 1) {
        const mid = x0 + (bay + 0.5) * spec.bay;
        for (const r of frameMid.girtRods) {
          const rod = new THREE.Mesh(girtRodGeo, rodMat);
          rod.position.set(mid, (r.y0 + r.y1) / 2, r.z);
          groups.girtRods.add(rod);
        }
        for (const r of frameMid.girtRods) {
          const stud = new THREE.Mesh(studGeo, studMat);
          stud.position.set(mid, r.yTieUnder, r.z);
          stud.userData.length = st.head + st.thread;
          groups.girtRodStuds.add(stud);
        }
      }

      // Anchor bolts: 4 × M20 per base plate on a square, shank down into the pad, washer and nut on the plate.
      // One shared geometry (shank + washer + hex nut) for all 144; y = 0 is the top of the plate.
      const ab = spec.anchorBolt;
      const shankLen = ab.embed + spec.basePlate.thickness + ab.projection;
      const boltParts = [
        new THREE.CylinderGeometry(ab.diameter / 2, ab.diameter / 2, shankLen, 8).translate(0, ab.projection - shankLen / 2, 0),
        new THREE.CylinderGeometry(0.0185, 0.0185, 0.004, 12).translate(0, 0.002, 0),
        new THREE.CylinderGeometry(0.0173, 0.0173, 0.016, 6).translate(0, 0.012, 0),
      ];
      const anchorGeo = mergeGeometries(boltParts, false) ?? boltParts[0].clone();
      for (const g of boltParts) g.dispose();
      geos.push(anchorGeo);
      const anchorMat = new THREE.MeshStandardMaterial({ color: 0x5b6368, metalness: 0.75, roughness: 0.4 });
      for (let i = 0; i < derived.frames; i += 1) {
        const x = x0 + i * spec.bay;
        const frame = i === 0 || i === derived.frames - 1 ? frameEnd : frameMid;
        for (const [k, c] of frame.columns.entries()) {
          for (const dx of [-ab.pitch / 2, ab.pitch / 2]) {
            for (const dz of [-ab.pitch / 2, ab.pitch / 2]) {
              const bolt = new THREE.Mesh(anchorGeo, anchorMat);
              bolt.position.set(x + dx, frame.plates[k].top, c.z + dz);
              bolt.userData.length = shankLen;
              groups.anchorBolts.add(bolt);
            }
          }
        }
      }

      // Wall lining: the roof panel stood on edge, ribs vertical. Ribs in: the ribbed skin faces into the house
      // and the flat foam face out, against the girts. Foam the full length (no bare strip), from 50 mm below the
      // concrete wall's inside top edge up to the ceiling pan.
      const liningRun = spec.length - chordW;
      for (const l of frameMid.lining) {
        const sheetLength = l.y1 - l.y0;
        const group = new THREE.Group();
        // Local x along the house, local y (rib height) into the house, local z (sheet length) up.
        group.matrix.makeBasis(new THREE.Vector3(l.sign, 0, 0), new THREE.Vector3(0, 0, -l.sign), new THREE.Vector3(0, 1, 0));
        group.matrix.setPosition(0, l.y0, l.zPan);
        group.matrixAutoUpdate = false;
        group.add(ribMesh(liningRun, sheetLength, 0, false, roofMat));
        // Foam fills the ribs from behind; the flat metal backing (outside, at zFoamFace) is against the girts.
        group.add(foamSolid(liningRun, sheetLength, 0));
        group.userData.length = sheetLength;
        groups.wallLining.add(group);
      }

      // ---- Bird netting: eave gaps and gable triangles ----
      // One tile is 4 × 4 mesh cells (10 mm each), repeated in metres. Mipmaps and anisotropy fade it to a
      // see-through tint far away instead of moiré.
      const netCanvas = document.createElement("canvas");
      netCanvas.width = 64;
      netCanvas.height = 64;
      const net2d = netCanvas.getContext("2d");
      if (net2d) {
        // A faint fill between the strands, so the netting still reads as a surface where the mesh fades out.
        net2d.fillStyle = "rgba(255,255,255,0.14)";
        net2d.fillRect(0, 0, 64, 64);
        net2d.fillStyle = "#ffffff";
        for (let i = 0; i < 4; i += 1) {
          net2d.fillRect(i * 16, 0, 2, 64);
          net2d.fillRect(0, i * 16, 64, 2);
        }
      }
      const netTex = new THREE.CanvasTexture(netCanvas);
      netTex.wrapS = THREE.RepeatWrapping;
      netTex.wrapT = THREE.RepeatWrapping;
      const tile = 4 * spec.netting.mesh;
      netTex.repeat.set(1 / tile, 1 / tile);
      netTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      netTex.colorSpace = THREE.SRGBColorSpace;
      // Stainless 304 welded mesh: light silver-grey strands, see-through between them.
      const netMat = new THREE.MeshBasicMaterial({
        color: 0xc4cacf,
        map: netTex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -4,
      });
      const gableSheetMat = new THREE.MeshStandardMaterial({
        color: 0xd5dbe2,
        metalness: 0.62,
        roughness: 0.38,
        side: THREE.DoubleSide,
      });
      // Eave: in the plane of the columns' outside face, tie top to purlin underside, between the rafters.
      for (let bay = 0; bay < derived.bays; bay += 1) {
        const xA = x0 + bay * spec.bay + chordW / 2;
        const xB = x0 + (bay + 1) * spec.bay - chordW / 2;
        for (const n of frameMid.eaveNetting) {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute(
            "position",
            new THREE.Float32BufferAttribute([xA, n.y0, n.z, xB, n.y0, n.z, xB, n.y1, n.z, xA, n.y1, n.z], 3),
          );
          geo.setAttribute("uv", new THREE.Float32BufferAttribute([xA, n.y0, xB, n.y0, xB, n.y1, xA, n.y1], 2));
          geo.setIndex([0, 1, 2, 0, 2, 3]);
          geos.push(geo);
          const mesh = new THREE.Mesh(geo, netMat);
          mesh.renderOrder = 2;
          groups.eaveNetting.add(mesh);
        }
      }
      // Gable: outer face of each end truss, ceiling level up to the roof underside. spec.gableClosure picks
      // netting or sheet; only the material changes.
      const gableShape = new THREE.Shape(frameEnd.gable.map((p) => new THREE.Vector2(p.z, p.y)));
      const gableGeo = new THREE.ShapeGeometry(gableShape);
      geos.push(gableGeo);
      const gableIsNet = spec.gableClosure === "netting";
      // A thin border keeps the netting readable from far away, where the mesh fades to a tint.
      const gableEdgeGeo = new THREE.BufferGeometry().setFromPoints(frameEnd.gable.map((p) => new THREE.Vector3(p.z, p.y, 0)));
      geos.push(gableEdgeGeo);
      const netEdgeMat = new THREE.LineBasicMaterial({ color: 0xaab1b7 });
      for (const sign of [-1, 1]) {
        const mesh = new THREE.Mesh(gableGeo, gableIsNet ? netMat : gableSheetMat);
        mesh.rotation.y = -Math.PI / 2;
        mesh.position.x = sign * (spec.length / 2 + chordW / 2 + spec.netting.offset);
        if (gableIsNet) {
          mesh.renderOrder = 2;
          const edge = new THREE.LineLoop(gableEdgeGeo, netEdgeMat);
          edge.raycast = () => {};
          mesh.add(edge);
        }
        groups.gableNetting.add(mesh);
      }
      /** Netting is see-through: a tap goes through it to the steel just behind. */
      const seeThrough = new Set<string>(gableIsNet ? ["eaveNetting", "gableNetting"] : ["eaveNetting"]);

      // ---- Measure tool: tap to pick points and parts ----
      // Each direct child of a part group is one piece (a mesh, or a group such as a C-purlin's five plates).
      for (const c of clusters.values()) {
        const merged = mergeGeometries(c.list, false);
        for (const g of c.list) g.dispose();
        if (!merged) continue;
        geos.push(merged);
        const mesh = new THREE.Mesh(merged, c.mat);
        if (c.size) mesh.userData.size = c.size;
        if (c.length !== undefined) mesh.userData.length = c.length;
        groups[c.part].add(mesh);
      }
      clusters.clear();
      for (const part of parts) for (const child of groups[part.id].children) child.userData.part = part.id;
      for (const child of groups.sloping.children) child.userData.length = spec.rafterLength;
      for (const child of groups.roof.children) child.userData.length = sheetLen;

      type Obj = import("three").Object3D;
      type MeshT = import("three").Mesh;
      const hiMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0b3a57,
        metalness: 0.3,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });
      const saved = new Map<MeshT, MeshT["material"]>();
      const highlight = (piece: Obj | null) => {
        for (const [mesh, mat] of saved) mesh.material = mat;
        saved.clear();
        piece?.traverse((o) => {
          const mesh = o as MeshT;
          if (mesh.isMesh) {
            saved.set(mesh, mesh.material);
            mesh.material = hiMat;
          }
        });
      };
      const pieceOf = (o: Obj | null) => {
        let cur = o;
        while (cur && cur.userData.part === undefined) cur = cur.parent;
        return cur;
      };
      const lengthOf = (piece: Obj, size: import("three").Vector3): number => {
        if (typeof piece.userData.length === "number") return piece.userData.length;
        const mesh = piece as MeshT;
        const first = (mesh.isMesh ? mesh : piece.children.find((c) => (c as MeshT).isMesh)) as MeshT | undefined;
        const g = first?.geometry as (import("three").BufferGeometry & { parameters?: Record<string, number> }) | undefined;
        // addMember boxes run along their depth; C-purlin plates along their width; rods along their height.
        if (mesh.isMesh && g?.type === "BoxGeometry" && g.parameters) return g.parameters.depth;
        if (mesh.isMesh && g?.type === "CylinderGeometry" && g.parameters) return g.parameters.height;
        if (!mesh.isMesh && g?.type === "BoxGeometry" && g.parameters) return g.parameters.width;
        return Math.max(size.x, size.y, size.z);
      };
      const describe = (piece: Obj): PartReadout => {
        const id = piece.userData.part as PartId;
        const info = partInfo[id];
        const part = parts.find((p) => p.id === id)!;
        const own = piece.userData.size as [number, number, number] | undefined;
        const size = own ? new THREE.Vector3(...own) : new THREE.Box3().setFromObject(piece).getSize(new THREE.Vector3());
        const detail =
          info.measure === "length"
            ? `${info.lengthLabel ?? "Length"} ${formatLength(lengthOf(piece, size))}`
            : `${formatLength(size.x)} along × ${formatLength(size.z)} across × ${formatLength(size.y)} high`;
        return { id, name: info.name, label: part.label, count: part.count, section: info.section, detail };
      };

      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      /** Raycast only on demand, and only into part groups that are switched on. */
      const pick = (clientX: number, clientY: number) => {
        const rect = el.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        ndc.set((px / rect.width) * 2 - 1, -(py / rect.height) * 2 + 1);
        camera.updateMatrixWorld();
        raycaster.setFromCamera(ndc, camera);
        const targets = parts.filter((p) => groups[p.id].visible).map((p) => groups[p.id]);
        const hits = raycaster.intersectObjects(targets, true).filter((h) => kept(h.point));
        const isNet = (h: (typeof hits)[number]) => seeThrough.has(pieceOf(h.object)?.userData.part);
        let hit = hits[0];
        if (!hit) return null;
        if (isNet(hit)) {
          const behind = hits.find((h) => !isNet(h));
          if (behind && behind.distance - hit.distance < 0.2) hit = behind;
        }
        const snap = snapHit(THREE, hit, raycaster.ray, camera, { width: rect.width, height: rect.height }, { x: px, y: py });
        return { ...snap, piece: pieceOf(hit.object) };
      };

      let pointA: import("three").Vector3 | null = null;
      let pointB: import("three").Vector3 | null = null;
      let hover: { point: import("three").Vector3; kind: SnapKind } | null = null;
      const xyz = (v: import("three").Vector3 | null): XYZ | null => (v ? { x: v.x, y: v.y, z: v.z } : null);

      let litPiece: Obj | null = null;
      let lastReadout: Readout = emptyReadout;
      const showReadout = (r: Readout) => {
        lastReadout = r;
        setReadout(r);
      };
      type MeasureState = { a: import("three").Vector3 | null; b: import("three").Vector3 | null; lit: Obj | null; readout: Readout };
      const measureState = (): MeasureState => ({ a: pointA, b: pointB, lit: litPiece, readout: lastReadout });
      const restoreMeasure = (m: MeasureState) => {
        pointA = m.a;
        pointB = m.b;
        litPiece = m.lit;
        highlight(m.lit);
        showReadout(m.readout);
      };
      const tap = (clientX: number, clientY: number) => {
        const res = pick(clientX, clientY);
        if (!res) return;
        // First tap places A, second places B, a third starts over with a new A.
        if (!pointA || pointB) {
          pointA = res.point;
          pointB = null;
        } else {
          pointB = res.point;
        }
        litPiece = res.piece;
        highlight(res.piece);
        showReadout({ a: xyz(pointA), b: xyz(pointB), snap: res.kind, part: res.piece ? describe(res.piece) : null });
      };

      /** Double-tap focus: glide the orbit centre to the tapped point; the camera keeps its place unless it is
       * further from the point than it was from the old centre, then it moves in along its line of sight. */
      const focusAt = (clientX: number, clientY: number) => {
        const res = pick(clientX, clientY);
        if (!res) return false;
        controls.enableDamping = false;
        controls.update();
        controls.enableDamping = true;
        const hit = res.point.clone();
        const pos = camera.position.clone();
        const dNow = pos.distanceTo(hit);
        const dOld = pos.distanceTo(controls.target);
        const dNew = Math.min(Math.max(dNow, 0.8), Math.max(dOld, 0.8));
        const toP = pos.clone().sub(hit).normalize().multiplyScalar(dNew).add(hit);
        glide = { t0: performance.now(), fromT: controls.target.clone(), toT: hit, fromP: pos, toP };
        return true;
      };
      /** Before a zoom-in, move the orbit centre along the line of sight (the view does not change) onto the
       * surface under the pointer if that is nearer, so zooming slows near it and stops short of it. */
      const pullTargetTo = (clientX: number, clientY: number) => {
        const res = pick(clientX, clientY);
        if (!res) return;
        const fwd = camera.getWorldDirection(new THREE.Vector3());
        const depth = res.point.clone().sub(camera.position).dot(fwd);
        const radius = camera.position.distanceTo(controls.target);
        if (depth > 0 && depth < radius) {
          controls.target.copy(camera.position).addScaledVector(fwd, Math.max(depth, controls.minDistance * 1.5));
        }
      };
      const clearMeasure = () => {
        pointA = null;
        pointB = null;
        hover = null;
        litPiece = null;
        highlight(null);
        showReadout(emptyReadout);
      };
      api.current.clearMeasure = clearMeasure;

      let press: { id: number; x: number; y: number; t: number } | null = null;
      let lastTap: { x: number; y: number; t: number; undo: MeasureState | null } | null = null;
      const activePointers = new Map<number, { x: number; y: number }>();
      let lastPull = 0;
      let hoverAt: { x: number; y: number } | null = null;
      let hoverTimer = 0;
      let lastHover = 0;
      const runHover = () => {
        hoverTimer = 0;
        lastHover = performance.now();
        if (!hoverAt || !measuringRef.current) return;
        const res = pick(hoverAt.x, hoverAt.y);
        hover = res ? { point: res.point, kind: res.kind } : null;
      };
      const onDown = (e: PointerEvent) => {
        // Pick speeds from the pointer actually in use (hybrid laptops, stylus); read by OrbitControls on move.
        applyControlSpeeds(e.pointerType !== "mouse");
        glide = null;
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        // A second finger means pinch or pan, never a tap. Pull the orbit centre onto what is between the fingers.
        press = activePointers.size === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp } : null;
        if (activePointers.size === 2) {
          const [p1, p2] = [...activePointers.values()];
          pullTargetTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          lastTap = null;
        }
      };
      const onWheel = (e: WheelEvent) => {
        glide = null;
        const now = performance.now();
        if (e.deltaY < 0 && now - lastPull > 80) {
          lastPull = now;
          pullTargetTo(e.clientX, e.clientY);
        }
      };
      const onMove = (e: PointerEvent) => {
        if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (press && e.pointerId === press.id && Math.hypot(e.clientX - press.x, e.clientY - press.y) > TAP_PX) press = null;
        if (measuringRef.current && e.pointerType === "mouse" && e.buttons === 0) {
          hoverAt = { x: e.clientX, y: e.clientY };
          if (!hoverTimer) hoverTimer = window.setTimeout(runHover, Math.max(0, HOVER_MS - (performance.now() - lastHover)));
        }
      };
      const onUp = (e: PointerEvent) => {
        activePointers.delete(e.pointerId);
        const p = press;
        press = null;
        if (!p || p.id !== e.pointerId) return;
        const now = e.timeStamp;
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > TAP_PX || now - p.t > TAP_MS) return;
        const prev = lastTap;
        if (prev && now - prev.t < DOUBLE_MS && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_PX) {
          // Double-tap: undo the first tap's Measure point (if any) and focus there instead.
          lastTap = null;
          if (prev.undo) restoreMeasure(prev.undo);
          focusAt(e.clientX, e.clientY);
          return;
        }
        lastTap = { x: e.clientX, y: e.clientY, t: now, undo: measuringRef.current ? measureState() : null };
        if (measuringRef.current) tap(e.clientX, e.clientY);
      };
      const onCancel = (e: PointerEvent) => {
        activePointers.delete(e.pointerId);
        lastTap = null;
        press = null;
      };
      const onLeave = () => {
        hoverAt = null;
        hover = null;
      };
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onCancel);
      el.addEventListener("pointerleave", onLeave);
      // Capture phase so the orbit centre is moved before OrbitControls reads the wheel.
      el.addEventListener("wheel", onWheel, { capture: true, passive: true });

      // ---- Safety panel highlights ----
      // Highlights are separate overlay meshes (never part of a part group, so Measure and part picking ignore
      // them). Selected members are merged into one X-ray mesh drawn over everything; zones and proposed items
      // are a few flat translucent quads, dashed lines and labels. One or two draw calls per item.
      const safetyGroup = new THREE.Group();
      safetyGroup.renderOrder = 20;
      scene.add(safetyGroup);
      const xrayMat = new THREE.MeshStandardMaterial({
        color: 0xff8a3d,
        emissive: 0x7a2600,
        metalness: 0.2,
        roughness: 0.6,
        transparent: true,
        opacity: 0.92,
        depthTest: false,
        depthWrite: false,
      });
      const zoneMat = (color: number, opacity: number, onTop = false) =>
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
          depthTest: !onTop,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          polygonOffsetUnits: -4,
        });
      const zoneGreen = zoneMat(0x22c55e, 0.42);
      const zoneRed = zoneMat(0xef4444, 0.45);
      const zoneAmber = zoneMat(0xf59e0b, 0.4);
      const zoneBlue = zoneMat(0x38bdf8, 0.36);
      const ghostMat = zoneMat(0xf59e0b, 0.14, true);
      const dashMat = new THREE.LineDashedMaterial({ color: 0xffb020, dashSize: 0.35, gapSize: 0.22, depthTest: false, transparent: true });
      const safetyMats: import("three").Material[] = [xrayMat, zoneGreen, zoneRed, zoneAmber, zoneBlue, ghostMat, dashMat];
      const safetyGeos: import("three").BufferGeometry[] = [];
      const labelTextures: import("three").Texture[] = [];
      const clearSafety = () => {
        for (const child of [...safetyGroup.children]) safetyGroup.remove(child);
        for (const geo of safetyGeos) geo.dispose();
        safetyGeos.length = 0;
        for (const tex of labelTextures) tex.dispose();
        labelTextures.length = 0;
        for (const mat of safetyMats.splice(7)) mat.dispose();
      };
      /** Pieces (direct children) of a part group whose world-space centre passes the test. */
      const piecesOf = (id: PartId, test: (c: import("three").Vector3) => boolean = () => true) => {
        const out: Obj[] = [];
        const box = new THREE.Box3();
        const c = new THREE.Vector3();
        for (const piece of groups[id].children) {
          box.setFromObject(piece).getCenter(c);
          if (test(c)) out.push(piece);
        }
        return out;
      };
      /** One merged X-ray mesh for all the meshes in the given pieces. */
      const xray = (pieces: Obj[]) => {
        scene.updateMatrixWorld();
        const pieceGeos: import("three").BufferGeometry[] = [];
        for (const piece of pieces) {
          piece.traverse((o) => {
            const mesh = o as MeshT;
            if (!mesh.isMesh) return;
            const src = mesh.geometry as import("three").BufferGeometry;
            const g = src.index ? src.toNonIndexed() : src.clone();
            for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
            if (!g.attributes.normal) g.computeVertexNormals();
            g.applyMatrix4(mesh.matrixWorld);
            pieceGeos.push(g);
          });
        }
        if (!pieceGeos.length) return;
        const merged = mergeGeometries(pieceGeos, false);
        for (const g of pieceGeos) g.dispose();
        if (!merged) return;
        safetyGeos.push(merged);
        const mesh = new THREE.Mesh(merged, xrayMat);
        mesh.renderOrder = 20;
        safetyGroup.add(mesh);
      };
      /** Flat quads from corner lists, one merged mesh per material. */
      const quads = (list: import("three").Vector3[][], material: import("three").Material, renderOrder = 15) => {
        const pos: number[] = [];
        for (const [a, b, c, d] of list) for (const p of [a, b, c, a, c, d]) pos.push(p.x, p.y, p.z);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        safetyGeos.push(geo);
        const mesh = new THREE.Mesh(geo, material);
        mesh.renderOrder = renderOrder;
        safetyGroup.add(mesh);
      };
      const dashed = (segments: [import("three").Vector3, import("three").Vector3][]) => {
        for (const [a, b] of segments) {
          const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
          safetyGeos.push(geo);
          const line = new THREE.Line(geo, dashMat);
          line.computeLineDistances();
          line.renderOrder = 21;
          safetyGroup.add(line);
        }
      };
      const label = (text: string, at: import("three").Vector3, height = 0.55) => {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const fontPx = 40;
        ctx.font = `600 ${fontPx}px system-ui, sans-serif`;
        const w = Math.ceil(ctx.measureText(text).width) + 36;
        c.width = w;
        c.height = 64;
        ctx.font = `600 ${fontPx}px system-ui, sans-serif`;
        ctx.fillStyle = "rgba(40,20,0,0.82)";
        ctx.fillRect(0, 0, w, 64);
        ctx.strokeStyle = "#ffb020";
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, w - 4, 60);
        ctx.fillStyle = "#ffe2a8";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 18, 34);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        labelTextures.push(tex);
        const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
        safetyMats.push(mat);
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set((height * w) / 64, height, 1);
        sprite.position.copy(at);
        sprite.renderOrder = 22;
        safetyGroup.add(sprite);
      };
      // Roof plane helpers: slope distance s from the rafter tip (negative = eave overhang), just above the ribs.
      const roofLift = frameMid.roof[0].skin + spec.roof.rib + 0.03;
      const roofPoint = (sign: number, s: number, x: number) => {
        const r = frameMid.roof[sign < 0 ? 0 : 1];
        return new THREE.Vector3(
          x,
          r.origin.y + r.upslope.y * s + r.normal.y * roofLift,
          r.origin.z + r.upslope.z * s + r.normal.z * roofLift,
        );
      };
      const roofFrom = frameMid.roof[0].from;
      const roofTo = frameMid.roof[0].to - 0.25;
      const roofRect = (sign: number, s0: number, s1: number, xa: number, xb: number) => [
        roofPoint(sign, s0, xa),
        roofPoint(sign, s0, xb),
        roofPoint(sign, s1, xb),
        roofPoint(sign, s1, xa),
      ];
      const gableX = -x0 + spec.purlin.endOverhang;
      const eaveStrip = roofFrom + 2.4 / cos;
      const zFaceOut = zCol + col / 2;
      const zInnerFace = zCol - col / 2;

      type Cam = { pos: [number, number, number]; target: [number, number, number] };
      /** X-ray spheres on every truss heel over the column tops. */
      const heelMarkers = () => {
        const marker = new THREE.SphereGeometry(0.16, 10, 8);
        const list: import("three").BufferGeometry[] = [];
        for (let i = 0; i < derived.frames; i += 1) {
          for (const sign of [-1, 1]) list.push(marker.clone().translate(x0 + i * spec.bay, yBeam + halfD, sign * zCol));
        }
        marker.dispose();
        const merged = mergeGeometries(list, false);
        for (const g of list) g.dispose();
        if (!merged) return;
        safetyGeos.push(merged);
        const mesh = new THREE.Mesh(merged, xrayMat);
        mesh.renderOrder = 20;
        safetyGroup.add(mesh);
      };
      const focusItems: Record<SafetyFocus, { build: () => void; cam: Cam }> = {
        frameFixity: {
          build: () => xray([...piecesOf("columns"), ...piecesOf("concrete"), ...piecesOf("padBase"), ...piecesOf("walls")]),
          cam: { pos: [-30, 5, 22], target: [-45, 2, 0] },
        },
        footings: {
          build: () => xray([...piecesOf("concrete"), ...piecesOf("padBase"), ...piecesOf("padMesh"), ...piecesOf("padCage"), ...piecesOf("plates"), ...piecesOf("anchorBolts"), ...piecesOf("floorMesh")]),
          cam: { pos: [-39.5, 2.4, 10.5], target: [-45, 0.1, 5.06] },
        },
        midGirt: {
          build: () => xray([...piecesOf("wallGirts", (c) => Math.abs(c.y - spec.girt.midCentre) < 0.3), ...piecesOf("girtRods"), ...piecesOf("girtRodStuds")]),
          cam: { pos: [-35, 2.6, 15.5], target: [-42, 2.6, 5.1] },
        },
        concreteWall: {
          build: () => xray([...piecesOf("wallRebar")]),
          cam: { pos: [-40.5, 1.5, 9.8], target: [-44, 0.5, 5.06] },
        },
        bottomGirt: {
          build: () =>
            xray([...piecesOf("wallGirts", (c) => c.y < 2), ...piecesOf("girtRods"), ...piecesOf("girtRodStuds")]),
          cam: { pos: [-37.5, 1.9, 11.5], target: [-42, 1.6, 5.1] },
        },
        sideBracing: {
          build: () => {
            const yTop = yColumnTop;
            // Only above the concrete wall: the wall and its welded mesh brace the columns below its top.
            const yBot = yEdge + spec.wall.inside + 0.02;
            const panels: import("three").Vector3[][] = [];
            const lines: [import("three").Vector3, import("three").Vector3][] = [];
            for (const xa of [x0, -x0 - spec.bay]) {
              const xb = xa + spec.bay;
              for (const sign of [-1, 1]) {
                const z = sign * (zFaceOut + 0.05);
                const P = (x: number, y: number) => new THREE.Vector3(x, y, z);
                panels.push([P(xa, yBot), P(xb, yBot), P(xb, yTop), P(xa, yTop)]);
                lines.push([P(xa, yTop), P(xb, yBot)], [P(xa, yBot), P(xb, yTop)]);
                label("Proposed X above the wall · not designed", new THREE.Vector3(xa + spec.bay / 2, yTop + 0.55, sign * (zFaceOut + 0.3)));
              }
            }
            quads(panels, ghostMat, 16);
            dashed(lines);
          },
          cam: { pos: [-33, 5, 24], target: [-48, 2.2, 5] },
        },
        tipPurlin: {
          build: () => xray(piecesOf("purlins", (c) => Math.abs(c.z) > zFaceOut - 0.25)),
          cam: { pos: [-33, 2.2, 13], target: [-42, 4.3, 5.4] },
        },
        endFrames: {
          build: () => {
            xray(piecesOf("horizontal", (c) => Math.abs(c.x) > -x0 - 0.5));
            const panels: import("three").Vector3[][] = [];
            const lines: [import("three").Vector3, import("three").Vector3][] = [];
            for (const x of [x0 - 0.02, -x0 + 0.02]) {
              const P = (z: number, y: number) => new THREE.Vector3(x, y, z);
              const [a, b, c, d] = [P(-zInnerFace, yEdge), P(zInnerFace, yEdge), P(zInnerFace, yColumnTop), P(-zInnerFace, yColumnTop)];
              panels.push([a, b, c, d]);
              lines.push([a, b], [b, c], [c, d], [d, a]);
              label("End wall: needs its own posts / framing", new THREE.Vector3(x + Math.sign(x) * 0.3, yColumnTop - 1.2, 0));
            }
            quads(panels, ghostMat, 16);
            dashed(lines);
          },
          cam: { pos: [64, 5, 12], target: [51, 3, 0] },
        },
        connections: {
          build: () => {
            xray(piecesOf("splices"));
            heelMarkers();
          },
          cam: { pos: [-40.5, 3.1, 1.2], target: [-45, 4.2, 4.6] },
        },
        columnBars: { build: () => xray(piecesOf("columns")), cam: { pos: [-22, 7, 22], target: [-42, 2, 0] } },
        fireEarth: { build: () => xray(piecesOf("columns")), cam: { pos: [-22, 7, 22], target: [-42, 2, 0] } },
        ceilingCross: { build: () => xray([...piecesOf("ceilingCross"), ...piecesOf("ceilingHangers")]), cam: { pos: [-36, 10, 13], target: [-45, 4.2, 0] } },
        beamSplice: { build: () => xray(piecesOf("splices")), cam: { pos: [-40, 3.0, -2.5], target: [-45, 4.16, 0.9] } },
        cutLength: {
          build: () => xray([...piecesOf("wallGirts"), ...piecesOf("ceilingLong"), ...piecesOf("ceilingCross")]),
          cam: { pos: [-25, 12, 25], target: [-40, 3, 0] },
        },
        overhangs: {
          build: () => {
            const list: import("three").Vector3[][] = [];
            for (const sign of [-1, 1]) {
              list.push(roofRect(sign, roofFrom, roofTo, x0 - spec.purlin.endOverhang, x0));
              list.push(roofRect(sign, roofFrom, roofTo, -x0, gableX));
              // Eave sheet beyond the last (tip) purlin.
              list.push(roofRect(sign, roofFrom, spec.purlin.inset, x0, -x0));
            }
            quads(list, zoneAmber);
          },
          cam: { pos: [-66, 10, 16], target: [-51, 4.2, 2] },
        },
        tieLighter: { build: () => xray(piecesOf("ties")), cam: { pos: [-38, 3.2, 11], target: [-43, 4.0, 5.1] } },
        keepPurlins: { build: () => xray(piecesOf("purlins")), cam: { pos: [-25, 14, 22], target: [-40, 4.5, 0] } },
        purlinCut: {
          build: () =>
            xray([
              ...piecesOf("purlins", (c) => Math.abs(c.x) > x0 * -1 - spec.bay / 2 - 1),
              ...piecesOf("cleats", (c) => Math.abs(Math.abs(c.x) - (-x0 - spec.bay)) < 0.3),
            ]),
          cam: { pos: [-62, 9, 15], target: [-47, 4.4, 2] },
        },
        tieBeam: { build: () => xray([...piecesOf("ties"), ...piecesOf("girtRodStuds")]), cam: { pos: [-38, 3.2, 11], target: [-43, 4.0, 5.1] } },
        trusses: {
          build: () => xray([...piecesOf("sloping"), ...piecesOf("horizontal"), ...piecesOf("verticals"), ...piecesOf("wWebs")]),
          cam: { pos: [-30, 9, 20], target: [-44, 4.3, 0] },
        },
        roofPurlins: { build: () => xray(piecesOf("purlins")), cam: { pos: [-25, 14, 22], target: [-40, 4.5, 0] } },
        roofBracing: { build: () => xray(piecesOf("roofBraces")), cam: { pos: [-20, 22, 26], target: [-30, 4.5, 0] } },
        ceilingSheet: {
          build: () => xray([...piecesOf("ceiling"), ...piecesOf("ceilingEdge"), ...piecesOf("ceilingHangers"), ...piecesOf("eaveNetting")]),
          cam: { pos: [-36, 10, 13], target: [-45, 4.2, 0] },
        },
        solarZone: {
          build: () => {
            const green: import("three").Vector3[][] = [];
            const red: import("three").Vector3[][] = [];
            for (const sign of [-1, 1]) {
              green.push(roofRect(sign, eaveStrip, roofTo, x0 + spec.bay, -x0 - spec.bay));
              red.push(roofRect(sign, roofFrom, eaveStrip, -gableX, gableX));
              red.push(roofRect(sign, eaveStrip, roofTo, -gableX, x0 + 1));
              red.push(roofRect(sign, eaveStrip, roofTo, -x0 - 1, gableX));
            }
            quads(green, zoneGreen);
            quads(red, zoneRed);
          },
          cam: { pos: [45, 42, 40], target: [0, 3, 0] },
        },
        solarBays: {
          build: () => {
            const list: import("three").Vector3[][] = [];
            for (const sign of [-1, 1]) {
              list.push(roofRect(sign, roofFrom, roofTo, x0, x0 + 2 * spec.bay));
              list.push(roofRect(sign, roofFrom, roofTo, -x0 - 2 * spec.bay, -x0));
            }
            quads(list, zoneBlue);
            label("Bays 1–2: same strength as the middle bays", roofPoint(1, 2, x0 + spec.bay).add(new THREE.Vector3(0, 1.2, 0)));
          },
          cam: { pos: [-25, 30, 35], target: [-42, 3, 0] },
        },
        solarRails: { build: () => xray(piecesOf("purlins")), cam: { pos: [-25, 14, 22], target: [-40, 4.5, 0] } },
        noSiteWeld: {
          build: () => {
            xray(piecesOf("wallRebar"));
            label("Still site-welded: wall bars to columns", new THREE.Vector3(-45, yEdge + spec.wall.inside + 0.45, zFaceOut + 0.4), 0.3);
          },
          cam: { pos: [-38.5, 3.4, 12.5], target: [-45, 2.4, 4.8] },
        },
        kneeJoint: {
          build: () =>
            xray([...piecesOf("kneeFins"), ...piecesOf("kneeShims"), ...piecesOf("kneeBolts"), ...piecesOf("endPlates")]),
          cam: { pos: [-43.9, 4.05, 6.6], target: [-45, 4.28, 5.06] },
        },
        shopConnections: {
          build: () =>
            xray([
              ...piecesOf("tieAngles"),
              ...piecesOf("tieBolts"),
              ...piecesOf("tieCaps"),
              ...piecesOf("girtCleats"),
              ...piecesOf("girtBolts"),
            ]),
          cam: { pos: [-43.2, 2.3, 7.6], target: [-45, 3.1, 5.06] },
        },
        steelTotal: {
          build: () =>
            xray([...piecesOf("purlins"), ...piecesOf("wallGirts"), ...piecesOf("ceilingLong"), ...piecesOf("ceilingCross")]),
          cam: { pos: [58, 26, 42], target: [0, 2, 0] },
        },
      };
      api.current.focusSafety = (id) => {
        glide = null;
        clearSafety();
        if (!id) return;
        const item = focusItems[id];
        item.build();
        controls.enableDamping = false;
        controls.update();
        controls.enableDamping = true;
        // The views are framed for a landscape screen; on a tall narrow one (phone, with the sheet open) the
        // horizontal field of view is much narrower, so back the camera off along the same line of sight.
        const w = el.clientWidth + Math.min(leftInset, el.clientWidth * 0.6);
        const h = el.clientHeight + Math.min(bottomInset, el.clientHeight * 0.6);
        const k = Math.min(3, Math.max(1, 1.3 / Math.max(w / Math.max(h, 1), 0.1)));
        const target = new THREE.Vector3(...item.cam.target);
        const pos = new THREE.Vector3(...item.cam.pos).sub(target).multiplyScalar(k).add(target);
        camera.position.copy(pos);
        controls.target.copy(target);
        controls.update();
      };

      // Screen-space overlay: markers, line and label stay the same size at any zoom and draw over the model.
      const svg = overlayRef.current;
      const q = <T extends Element>(name: string) => svg?.querySelector<T>(`[data-m="${name}"]`) ?? null;
      const ov = {
        line: q<SVGLineElement>("line"),
        a: q<SVGGElement>("a"),
        b: q<SVGGElement>("b"),
        label: q<SVGTextElement>("label"),
        hoverV: q<SVGRectElement>("hover-vertex"),
        hoverE: q<SVGCircleElement>("hover-edge"),
        hoverS: q<SVGCircleElement>("hover-surface"),
      };
      const tmp = new THREE.Vector3();
      const toScreen = (v: import("three").Vector3) => {
        tmp.copy(v).project(camera);
        const ok = tmp.z > -1 && tmp.z < 1;
        return { x: ((tmp.x + 1) / 2) * el.clientWidth, y: ((1 - tmp.y) / 2) * el.clientHeight, ok };
      };
      const place = (node: Element | null, v: import("three").Vector3 | null) => {
        if (!node) return null;
        const s2 = v ? toScreen(v) : null;
        if (!s2 || !s2.ok) {
          node.setAttribute("display", "none");
          return null;
        }
        node.setAttribute("display", "inline");
        node.setAttribute("transform", `translate(${s2.x.toFixed(1)} ${s2.y.toFixed(1)})`);
        return s2;
      };
      const drawOverlay = () => {
        if (!svg) return;
        const sa = place(ov.a, pointA);
        const sb = place(ov.b, pointB);
        if (ov.line && ov.label) {
          if (sa && sb && pointA && pointB) {
            ov.line.setAttribute("display", "inline");
            ov.line.setAttribute("x1", sa.x.toFixed(1));
            ov.line.setAttribute("y1", sa.y.toFixed(1));
            ov.line.setAttribute("x2", sb.x.toFixed(1));
            ov.line.setAttribute("y2", sb.y.toFixed(1));
            ov.label.setAttribute("display", "inline");
            ov.label.setAttribute("x", ((sa.x + sb.x) / 2).toFixed(1));
            ov.label.setAttribute("y", ((sa.y + sb.y) / 2 - 10).toFixed(1));
            ov.label.textContent = formatLength(pointA.distanceTo(pointB));
          } else {
            ov.line.setAttribute("display", "none");
            ov.label.setAttribute("display", "none");
          }
        }
        const showHover = measuringRef.current && hover;
        place(ov.hoverV, showHover && hover?.kind === "vertex" ? hover.point : null);
        place(ov.hoverE, showHover && hover?.kind === "edge" ? hover.point : null);
        place(ov.hoverS, showHover && hover?.kind === "surface" ? hover.point : null);
      };

      let raf = 0;
      const fog = scene.fog as import("three").Fog;
      const tick = () => {
        if (glide) {
          const k = Math.min(1, (performance.now() - glide.t0) / GLIDE_MS);
          const ease = 1 - (1 - k) ** 3;
          controls.target.lerpVectors(glide.fromT, glide.toT, ease);
          camera.position.lerpVectors(glide.fromP, glide.toP, ease);
          if (k >= 1) glide = null;
        }
        controls.update();
        // Keep fog behind the subject when the camera is pulled far back (Side view on a narrow screen).
        const dist = camera.position.distanceTo(controls.target);
        fog.near = Math.max(90, dist + 10);
        fog.far = Math.max(220, dist + 140);
        renderer.render(scene, camera);
        drawOverlay();
        raf = requestAnimationFrame(tick);
      };
      tick();

      const observer = new ResizeObserver(fit);
      observer.observe(el);
      if (el.parentElement) observer.observe(el.parentElement);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(hoverTimer);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onCancel);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("wheel", onWheel, { capture: true });
        highlight(null);
        clearSafety();
        for (const mat of safetyMats) mat.dispose();
        hiMat.dispose();
        netMat.dispose();
        netTex.dispose();
        netEdgeMat.dispose();
        gableSheetMat.dispose();
        observer.disconnect();
        controls.dispose();
        for (const geo of geos) geo.dispose();
        steel.dispose();
        kneeMat.dispose();
        kneeBoltMat.dispose();
        kneeShimMat.dispose();
        endPlateMat.dispose();
        spliceMat.dispose();
        webMat.dispose();
        concreteMat.dispose();
        floorMat.dispose();
        padMeshMat.dispose();
        wallMat.dispose();
        purlinMat.dispose();
        cleatMat.dispose();
        slotMat.dispose();
        roofMat.dispose();
        foamMat.dispose();
        backingMat.dispose();
        ceilingMat.dispose();
        capMat.dispose();
        rodMat.dispose();
        braceMat.dispose();
        boltMat.dispose();
        anchorMat.dispose();
        rebarMat.dispose();
        studMat.dispose();
        renderer.dispose();
        groupsRef.current = {};
        api.current.setView = () => {};
        api.current.clearMeasure = () => {};
        api.current.focusSafety = () => {};
        api.current.setInsets = () => {};
        api.current.setCut = () => 1;
        api.current.targetX = () => 0;
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    for (const part of parts) {
      const group = groupsRef.current[part.id];
      if (group) group.visible = shown[part.id];
    }
  }, [shown]);

  useEffect(() => {
    const el = canvasRef.current;
    if (el) el.style.cursor = measuring ? "crosshair" : "";
    if (!measuring) api.current.clearMeasure();
  }, [measuring]);

  useEffect(() => {
    api.current.setCut(cut.on, cut.x, cut.hide);
  }, [cut.on, cut.x, cut.hide]);

  useEffect(() => {
    const node = readoutRef.current;
    if (!measuring || !node) {
      setReadoutH(0);
      return;
    }
    const ro = new ResizeObserver(() => setReadoutH(node.offsetHeight));
    ro.observe(node);
    setReadoutH(node.offsetHeight);
    return () => ro.disconnect();
  }, [measuring]);

  const cutOnOff = () =>
    setCut((c) => {
      if (!c.on) {
        const x = Math.min(CUT_MAX, Math.max(CUT_MIN, api.current.targetX()));
        return { on: true, open: true, x, hide: api.current.setCut(true, x, 0) };
      }
      // Already cutting: the chip folds or unfolds the slider; the cut stays.
      return { ...c, open: !c.open };
    });
  /** Step to the next frame line in that direction, stopping just on the hidden side of it. */
  const cutStep = (dir: -1 | 1) =>
    setCut((c) => {
      const frameAt = c.x - c.hide * CUT_FRAME_CLEAR;
      const next = dir > 0 ? FRAME_XS.find((f) => f > frameAt + 0.01) : [...FRAME_XS].reverse().find((f) => f < frameAt - 0.01);
      if (next === undefined) return c;
      return { ...c, x: Math.min(CUT_MAX, Math.max(CUT_MIN, next + c.hide * CUT_FRAME_CLEAR)) };
    });
  const fromEnd = cut.x + spec.length / 2;
  const cutBay = Math.min(derived.bays, Math.max(1, Math.floor(fromEnd / spec.bay) + 1));
  const cutBottom = insets.bottom + (measuring ? readoutH + 8 : 0) + 8;

  const { a, b } = readout;
  const d = a && b ? { dist: Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z), across: b.z - a.z, along: b.x - a.x, up: b.y - a.y } : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Three-dimensional frame of the layer house"
      />
      <svg ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <line data-m="line" display="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
        {(["a", "b"] as const).map((name) => (
          <g key={name} data-m={name} display="none">
            <circle r="5" fill="#0c4a6e" stroke="#7dd3fc" strokeWidth="2" />
            <text x="8" y="-7" fill="#e0f2fe" stroke="#082f49" strokeWidth="3" paintOrder="stroke" fontSize="12" fontWeight="600">
              {name.toUpperCase()}
            </text>
          </g>
        ))}
        <text
          data-m="label"
          display="none"
          textAnchor="middle"
          fill="#f0f9ff"
          stroke="#082f49"
          strokeWidth="4"
          paintOrder="stroke"
          fontSize="14"
          fontWeight="600"
          fontFamily="var(--font-mono)"
        />
        <rect data-m="hover-vertex" display="none" x="-5" y="-5" width="10" height="10" fill="none" stroke="#7dd3fc" strokeWidth="2" />
        <circle data-m="hover-edge" display="none" r="5" fill="none" stroke="#7dd3fc" strokeWidth="2" />
        <circle data-m="hover-surface" display="none" r="2.5" fill="#7dd3fc" />
      </svg>
      {measuring && (
        <div
          ref={readoutRef}
          data-testid="measure-readout"
          data-a={a ? `${a.x.toFixed(4)},${a.y.toFixed(4)},${a.z.toFixed(4)}` : undefined}
          className="absolute bottom-2 left-2 z-10 w-[min(19rem,calc(100%-1rem))] rounded-md border border-sky-800/80 bg-surface/90 p-2 text-[11px] leading-snug text-fg shadow backdrop-blur-sm"
        >
          {readout.part && (
            <div data-testid="part-info" data-part={readout.part.id} className="mb-1.5 border-b border-border pb-1.5">
              <p className="font-medium text-sky-200">
                {readout.part.name} <span className="font-normal text-muted">· {readout.part.label} {readout.part.count} in model</span>
              </p>
              <p>{readout.part.section}</p>
              <p className="font-mono text-muted">{readout.part.detail}</p>
            </div>
          )}
          {d ? (
            <div
              data-testid="measure-result"
              data-distance={d.dist.toFixed(6)}
              data-across={d.across.toFixed(6)}
              data-along={d.along.toFixed(6)}
              data-vertical={d.up.toFixed(6)}
            >
              <p className="font-mono text-sm font-semibold text-sky-100">A → B {formatLength(d.dist)}</p>
              <p className="font-mono text-muted">
                across {formatLength(d.across)} · along {formatLength(d.along)} · vertical {formatLength(d.up)}
              </p>
            </div>
          ) : (
            <p className="text-muted">
              {a ? "A placed. Tap the second point." : "Tap the model to place A. Points snap to corners and edges."}
            </p>
          )}
          {readout.snap && <p className="mt-0.5 text-[10px] text-muted">Last point snapped to {readout.snap === "surface" ? "the surface" : `a ${readout.snap === "vertex" ? "corner" : "edge"}`}.</p>}
        </div>
      )}
      {/* Cut-away: a small chip; tapping it cuts the model across the building and shows a compact slider. */}
      <div
        className="pointer-events-none absolute right-2 z-10 flex flex-col items-end gap-1.5"
        style={{ bottom: cutBottom }}
      >
        {cut.on && cut.open && (
          <div
            data-testid="cut-panel"
            className="pointer-events-auto w-[min(20rem,calc(100vw-1rem))] rounded-md border border-violet-500/70 bg-surface/90 p-1.5 text-[11px] text-fg shadow backdrop-blur-sm"
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous frame"
                onClick={() => cutStep(-1)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border bg-surface-2/80"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <input
                type="range"
                data-testid="cut-slider"
                aria-label="Cut position along the length"
                min={CUT_MIN}
                max={CUT_MAX}
                step={0.05}
                value={cut.x}
                onChange={(e) => setCut((c) => ({ ...c, x: Number(e.target.value) }))}
                className="h-9 min-w-0 flex-1 accent-violet-400"
              />
              <button
                type="button"
                aria-label="Next frame"
                onClick={() => cutStep(1)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border bg-surface-2/80"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <p data-testid="cut-label" className="min-w-0 flex-1 truncate font-mono text-muted">
                {fromEnd.toFixed(2)} m from end 1 · bay {cutBay}
              </p>
              <button
                type="button"
                data-testid="cut-flip"
                onClick={() => setCut((c) => ({ ...c, hide: c.hide === 1 ? -1 : 1 }))}
                className="inline-flex h-8 items-center gap-1 rounded border border-border bg-surface-2/80 px-2"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
                Flip
              </button>
              <button
                type="button"
                data-testid="cut-off"
                onClick={() => setCut((c) => ({ ...c, on: false, open: false }))}
                className="inline-flex h-8 items-center gap-1 rounded border border-border bg-surface-2/80 px-2"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Off
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          data-testid="cut-chip"
          aria-pressed={cut.on}
          aria-expanded={cut.on && cut.open}
          onClick={cutOnOff}
          className={`pointer-events-auto inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-xs font-medium shadow backdrop-blur-sm sm:h-8 sm:px-2.5 ${
            cut.on ? "border-violet-300 bg-violet-400 text-violet-950" : "border-border bg-surface/85 text-fg"
          }`}
        >
          <Scissors className="h-3.5 w-3.5" aria-hidden />
          {cut.on && !cut.open ? `Cut ${fromEnd.toFixed(1)} m` : "Cut"}
        </button>
      </div>
    </>
  );
});
