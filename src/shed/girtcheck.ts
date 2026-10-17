/**
 * Wall girt wind check (rough hand check, computed from the geometry, not an engineer's design).
 * Girt: spec.purlin section (ASC 12516, C 127×51×15×1.6), web horizontal on top, flanges vertical, spans between columns.
 * Wind acts horizontally across the web's plane, i.e. strong-axis bending. Supports: the concrete wall top below the
 * lowest girt and the SHS tie above the top girt carry the lining's tributary strips between the girts.
 * Assumptions (change here): fy 450 MPa (G450), E 200 GPa, wind 0.8 kPa design / 0.57 kPa MS 1553 site, deflection limit L/150
 * (cladding on girts), inward wind with the compression flange + lip braced only at the midspan rods.
 */
import { liningInfo, spec } from "./geometry";

const fy = 450e6;
const E = 200e9;

/** Centreline-model section properties (m units) of a lipped C, strong axis. */
function cSection() {
  const d = spec.purlin.depth, b = spec.purlin.flange, c = spec.purlin.lip, t = spec.purlin.wall;
  // elements: web (vertical in the C's own frame), 2 flanges, 2 lips; centreline dimensions
  const dc = d - t, bc = b - t, cc = c - t / 2;
  const els = [
    { a: dc * t, y: 0, i: (t * dc ** 3) / 12 },
    { a: bc * t, y: dc / 2, i: 0 },
    { a: bc * t, y: -dc / 2, i: 0 },
    { a: cc * t, y: dc / 2 - cc / 2, i: (t * cc ** 3) / 12 },
    { a: cc * t, y: -dc / 2 + cc / 2, i: (t * cc ** 3) / 12 },
  ];
  const I = els.reduce((s, e) => s + e.i + e.a * e.y ** 2, 0);
  const A = els.reduce((s, e) => s + e.a, 0);
  // compression flange + lip as a strut: weak-axis radius of gyration about its own centroid in the flange's plane
  const sA = bc * t + cc * t;
  const sCx = (cc * t * bc) / sA; // lip hangs off the flange tip: centroid offset along flange
  // lip is perpendicular to the flange: its second moment about the strut's axis (the flange direction) is cc*t*(bc-sCx)^2 + small
  const sIfull = (t * bc ** 3) / 12 + bc * t * (sCx - bc / 2) ** 2 + cc * t * (bc - sCx) ** 2;
  return { I, Z: I / (d / 2), A, kgPerM: A * 7850, rStrut: Math.sqrt(sIfull / sA) };
}

export type GirtCheckRow = {
  row: number;
  centre: number;
  tributary: number;
  /** Per wind case: bending ratio against the braced-flange-reduced capacity, yield-only ratio, deflection ratio vs L/150. */
  cases: { kPa: number; bending: number; yieldOnly: number; deflection: number; pass: boolean }[];
};

export const girtCheck = (() => {
  const sec = cSection();
  const L = liningInfo.girtLength;
  const rows = liningInfo.girtRows.map((r) => (r.top + r.bottom) / 2);
  const supports = [liningInfo.wallTopIn, ...rows, liningInfo.tieUnder];
  const Lb = L / 2; // flange braced at the midspan rod
  const Fcr = (Math.PI ** 2 * E) / (Lb / sec.rStrut) ** 2;
  const Mn = sec.Z * Math.min(fy, Fcr);
  const My = sec.Z * fy;
  const out: GirtCheckRow[] = rows.map((c, i) => {
    const trib = (supports[i + 2] - supports[i]) / 2;
    return {
      row: i + 1,
      centre: c,
      tributary: trib,
      cases: [0.8, 0.57].map((kPa) => {
        const w = kPa * 1000 * trib;
        const M = (w * L * L) / 8;
        const defl = (5 * w * L ** 4) / (384 * E * sec.I);
        const bending = M / Mn, yieldOnly = M / My, deflection = defl / (L / 150);
        return { kPa, bending, yieldOnly, deflection, pass: bending <= 1 && deflection <= 1 };
      }),
    };
  });
  return {
    section: "C 127×51×15×1.6 (ASC 12516)",
    span: L,
    Ix: sec.I,
    Zx: sec.Z,
    kgPerM: sec.kgPerM,
    bracedLength: Lb,
    flangeFcr: Fcr,
    Mn,
    My,
    rows: out,
    allPass: out.every((r) => r.cases.every((c) => c.pass)),
  };
})();
