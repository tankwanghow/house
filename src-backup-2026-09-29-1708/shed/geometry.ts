/** Confirmed frame geometry. Width is column centre to column centre. */

/** How the triangle above the ceiling at each gable is closed. Switch to "sheet" to draw it as cladding. */
export type GableClosure = "netting" | "sheet";

export const spec = {
  length: 102,
  bay: 6,
  columnCentres: 10.125,
  /**
   * Floor top at the column face (spec.floor.edge) up to the column top. Set (Tan, 28 Sep 9:02 PM) so the clear height
   * from the finished floor to the underside of the ceiling sheet (its rib crests, which hang down) is 4.000 m at the
   * floor's high point on the centre line (6 in at the ridge line): 4.000 + the 2 in floor fall + 1 mm + the 35 mm rib.
   * At the walls, where the floor is 2 in lower, the clear height is 4.051 m.
   */
  eaveAtColumn: 4 + (6 - 4) * 0.0254 + 0.001 + 0.035,
  /** Clear height, finished floor (high point) to the underside of the ceiling sheet. */
  ceilingClear: 4,
  pitchDeg: 10,
  /** Mill bar length. This is the rafter's longest edge (top edge, ridge plumb cut to square eave cut). */
  rafterLength: 6,
  column: { side: 0.125, wall: 0.0045 },
  basePlate: { side: 0.3, thickness: 0.012 },
  /**
   * Holding-down bolts (Tan, 28 Sep): 4 × M20 cast-in anchor bolts per base plate, on a 200 mm square
   * (50 mm edge distance on the 300 mm plate, clear of the 125 mm column). Assumed: 400 mm embedded
   * with a nut and washer at the bottom (leaves about 210 mm of the 609 mm block below) and 50 mm standing above the
   * plate for washer and nut. In the 609 mm block the bolts are 204.5 mm from every side, so cone breakout is set
   * by that edge distance, not by the depth.
   */
  anchorBolt: { diameter: 0.02, pitch: 0.2, embed: 0.4, projection: 0.05 },
  /**
   * Column pads (Tan, 28 Sep): 609 × 609 × 609 mm (2 ft cube) concrete block under each column. Tan, 8:48 PM: the
   * base plate sits on the pad top and its top is 4 in below the finished floor, so the plate and the anchor bolts
   * are buried in the floor slab. With the 12 mm plate the pad top is 4 in + 12 mm = 113.6 mm below the floor top at
   * the column face. Poured with the slab (the slab concrete fills the 12 mm over each pad around the plate). No strip
   * footing (removed by Tan, 29 Sep 4:22 PM): the pads stand alone, joined only by the 4 in slab.
   */
  concrete: { side: 24 * 0.0254, depth: 24 * 0.0254 },
  /**
   * Pad base (Tan, 29 Sep 4:32 PM): a 4 ft × 4 ft × 4 in (1219 × 1219 × 102 mm) reinforced concrete base under each
   * 609 mm cube, centred, poured before or with the pad, with BRC A10 mesh (10 mm at 7 in each way) at mid-depth
   * (assumed the same as the floor). It also serves as the clean, level blinding under the pad.
   */
  padBase: { side: 4 * 0.3048, depth: 4 * 0.0254 },
  /**
   * Slab on grade: top 6 in above ground at the ridge line, 4 in at the outer face of the columns (drainage fall).
   * Tan, 8:48 PM: 4 in (100 mm) thick with BRC A10 mesh, poured with the pads and cured before the wall is cast;
   * the underside follows the fall so it is 4 in thick everywhere. `toe`: the slab runs on 150 mm past the columns'
   * outside face (and past the end columns) so the 300 mm base plates are fully buried. A10 mesh: 10 mm bars at
   * 200 mm each way, about 6.17 kg/m² before laps.
   */
  floor: { center: 6 * 0.0254, edge: 4 * 0.0254, thickness: 4 * 0.0254, toe: 0.15 },
  /**
   * Floor slab mesh (Tan, 29 Sep 4:29 PM): BRC A10 (10 mm bars) at 7 in (178 mm) each way. One layer at mid-depth of the 4 in slab
   * (about 40 mm top cover), following the floor's fall; the long bars sit under the cross bars. `lapExtra`: sheet
   * laps (about one mesh square plus 50 mm at each sheet edge) add about 10% to the bar weight.
   */
  floorMesh: { bar: 0.01, grid: 7 * 0.0254, kgPerM: 0.617, lapExtra: 0.1 },
  rafter: { width: 0.05, depth: 0.125, wall: 0.003 },
  /**
   * Column tie (eave strut) between the columns, SHS 125×125×3.0: the full column width, flush with both the
   * inside and outside column faces, top flush with the column top; welded flush to the column side faces.
   * The wall lining's top fixes into its inside face.
   */
  columnTie: { width: 0.125, depth: 0.125, wall: 0.003 },
  web: { side: 0.05, wall: 0.0023 },
  /**
   * AJIYA ASC 12516. Follows the rafter slope, open (lipped) side facing back inside, up the slope towards the
   * ridge; the web is on the downslope (eave) side. The column purlin's web lines up with the column's outside face.
   */
  /**
   * Roof purlins (Tan's cut plan, 28 Sep 8:02 PM): one 6 m piece per bay, butt-jointed over every inner rafter on
   * the purlin bracket (simple spans), and a longer piece in each end bay that runs on past the end rafter to carry
   * the 5 ft gable overhang. `jointGap` is the small gap left between the two purlin ends at each butt joint.
   */
  purlin: { depth: 0.127, flange: 0.051, lip: 0.015, wall: 0.0016, inset: 0.15, endOverhang: 5 * 0.3048, jointGap: 0.005 },
  /**
   * Ceiling cross purlins (Tan, 28 Sep: lighter-section saving applied): lipped C 100×50×15×1.2 G450, two per bay,
   * spanning about 2.53 m between the long ceiling purlins. Bottom flange kept at the old level so the ceiling
   * sheet is unchanged; the top stands 27 mm below the long purlins, taken up by the hanging cleat/packer.
   */
  crossPurlin: { depth: 0.1, flange: 0.05, lip: 0.015, wall: 0.0012 },
  /** 5 in purlin bracket, first row. 220 mm long, four 14×22 slots at 30-50-60-50-30. */
  cleat: { length: 0.22, base: 0.0635, height: 0.089, hole: 0.0635, thickness: 0.004, slot: 0.022, slotHeight: 0.014 },
  /**
   * Roof (and wall lining) panel: MEGA RIB 35 PUR 25 mm, metal zincalume TCT 0.47 mm. A sandwich: the
   * Mega Rib 35 profiled sheet, PU foam filling every rib up to the crest and `foam` thick under the pans,
   * and a flat 0.47 mm metal backing sheet over the foam face. The last `bareTip` at the eave end of each
   * roof sheet is the profiled sheet alone (no foam, no backing).
   * Profile from the AJIYA Mega Rib 30/35 catalogue drawing: 723 mm effective cover, ribs at 241 mm
   * (3 per sheet), 35 mm high with a 24 mm crest; the ~66 mm rib base and the four small pan flutes
   * (~12 mm wide, ~2 mm high) are scaled off that drawing. `lift` stands the backing just off the purlins.
   * The ceiling uses the same profile as a plain single skin, no foam.
   */
  roof: {
    cover: 0.723,
    ribPitch: 0.241,
    rib: 0.035,
    ribBase: 0.066,
    ribCrest: 0.024,
    flute: 0.002,
    fluteWidth: 0.012,
    flutesPerPan: 4,
    foam: 0.025,
    skin: 0.00047,
    lift: 0.001,
    eaveOverhang: 1.5 * 0.3048,
    bareTip: 5 * 0.0254,
  },
  /** AJIYA standard ridge capping, 24 in girth × 8 ft, zincalume 0.47 mm. */
  ridgeCap: { girth: 24 * 0.0254, piece: 8 * 0.3048, lip: 0.015, lap: 0.15 },
  /**
   * Side wall along each eave (Tan, 28 Sep: cast reinforced concrete wall). 125 mm thick, flush with both
   * column faces, cast between and against the columns. The top falls to the outside so water leaves the shed.
   * Height (Tan confirmed): 36 in = 914 mm, taken as above the floor at the wall (slab top at the column face).
   * That is the inside top edge; the concrete top is a sloped cap falling 50 mm to 864 mm at the outside face so
   * water runs out. No flashing (Tan, 28 Sep): the lining runs `lining.wallLap` down past the inside top edge as a skirt.
   */
  wall: { inside: 36 * 0.0254, outside: 34 * 0.0254, thickness: 0.125 },
  /**
   * Wall rebar (Tan confirmed): one layer of Y10 at 320 mm each way at mid-thickness (about 57 mm cover each face).
   * Horizontal bars stop at the column sides and are welded to them before the pour. Rows placed (assumed) 90 mm,
   * 410 mm and 730 mm up; verticals 320 mm apart centred in each bay, 40 mm below the wall top. Tan, 29 Sep 4:27 PM:
   * no starter bars; the verticals run straight down `below` (6 in) past the finished floor top, so they pass through
   * the 4 in slab and end about 50 mm in the soil under it (Tan, 4:28 PM: only soil under the slab and pads).
   */
  wallMesh: { bar: 0.01, grid: 0.32, firstRow: 0.09, topCover: 0.04, kgPerM: 0.617, below: 6 * 0.0254 },
  /**
   * Inner wall lining: the roof panel (Mega Rib 35 PUR 25 mm, spec.roof), ribs vertical. Ribs in:
   * the ribbed metal skin faces into the house, and the flat metal-backed foam face faces out, against the girts' inner
   * flanges on the columns' inside-face plane. `faceGap` keeps the foam face just clear of the steel;
   * `wallLap` (Tan, 28 Sep, 3 PM): the panel runs about 2 in (50 mm) down past the concrete wall's inside top edge,
   * lapping over the wall's inner face like a skirt. No clash: the wall is flush with the columns' inside face and
   * the panel's metal-backed face is `faceGap` (2 mm) inside that plane, so it passes 2 mm clear of the concrete.
   * Seal that 2 mm joint at the wall's top edge so water on the panel's back runs onto the sloped top, not down
   * behind the skirt. The wall panels are PU foam the full length (no bare strip), so the foam shows at the foot:
   * seal it with a bead of PU/silicone sealant or a small bottom trim. The ceiling runs
   * over the rib crests to the lining's pan line; the lining stops `ceilingGap` under the ceiling pan.
   */
  lining: { faceGap: 0.002, wallLap: 0.05, ceilingGap: 0.002 },
  /**
   * Wall girts behind the lining, AJIYA ASC 12516 (same C as the ceiling purlins), one per bay between the
   * columns. Web horizontal at the top, open side (toes) down so water cannot collect in it; the 127 mm depth
   * runs out through the 125 mm column, inner flange against the lining's metal-backed face. Two rows: the
   * bottom row `bottomRaise` above the wall top (Tan, 28 Sep: raised 300 mm), hung from the SHS tie by the midspan tie rod (no
   * girt support on the wall top, Tan 28 Sep 7:50 PM), and one centred at `midCentre`. There is no top
   * row: the lining's top fixes into the SHS column tie instead.
   * Tie rods (Tan, 28 Sep, 3 PM: carried up to the SHS tie, replacing "bottom to middle girt only"): one M12
   * threaded rod per bay at midspan, from under the bottom girt's web, through the middle girt's web, up to the
   * SHS 125 column tie. Tan's top detail: a 16 mm hole in the tie's bottom wall, an M12 × 40 grade 4.6 bolt welded
   * there with its head against the underside and threads pointing down, and an M12 coupling nut joining the rod to
   * it. `rodInset` in from the girts' outer flange (23 mm in from the tie's outside face). Nuts both sides of each
   * girt web. `stud`: head height, thread below the head, coupling nut length and across-flats.
   */
  girt: {
    rows: 2,
    midCentre: 2.7,
    bottomRaise: 0.3,
    rodDiameter: 0.012,
    rodInset: 0.025,
    stud: { head: 0.008, thread: 0.032, coupler: 0.036, headAF: 0.018, couplerAF: 0.018 },
  },
  /**
   * Bird netting: stainless steel 304 welded wire mesh, 10 mm holes, screwed direct to the steel (no angle or
   * flat-bar framing). `offset` stands it just proud of the steel it is fixed to.
   */
  netting: { mesh: 0.01, offset: 0.003 },
  gableClosure: "netting" as GableClosure,
  sagRod: { diameter: 0.012 },
  /** Roof-plane X, 12 mm galvanized wire rope, in four bays only. */
  roofBrace: { diameter: 0.012 },
} as const;

const pitch = (spec.pitchDeg * Math.PI) / 180;

/** Horizontal projection of one full rafter, ridge to tip. */
/** Centreline length. The plumb cut at the ridge makes the top edge longer than the centreline by
 * half the depth × tan(pitch), so the centreline is shortened to keep the top edge at exactly one bar. */
const rafterCentre = spec.rafterLength - (spec.rafter.depth / 2) * Math.tan(pitch);
const horiz = rafterCentre * Math.cos(pitch);
const rise = rafterCentre * Math.sin(pitch);
const half = spec.columnCentres / 2;
const overhangHoriz = horiz - half;
const overhangSlope = overhangHoriz / Math.cos(pitch);
const ridgeAboveColumn = half * Math.tan(pitch);

export const derived = {
  pitch,
  rafterCentre,
  rafterTopEdge: spec.rafterLength,
  rafterBottomEdge: rafterCentre - (spec.rafter.depth / 2) * Math.tan(pitch),
  horiz,
  rise,
  half,
  overhangHoriz,
  overhangSlope,
  ridgeAboveColumn,
  seat: (spec.rafter.depth / 2) * (1 + Math.cos(pitch)),
  ridgeHeight: spec.eaveAtColumn + ridgeAboveColumn,
  eaveTipHeight: spec.eaveAtColumn + ridgeAboveColumn - rise,
  roofWidth: horiz * 2,
  bays: spec.length / spec.bay,
  frames: spec.length / spec.bay + 1,
  columns: (spec.length / spec.bay + 1) * 2,
  rafters: (spec.length / spec.bay + 1) * 2,
};

const frames = spec.length / spec.bay + 1;
const purlinRun = spec.length + spec.rafter.width + 2 * spec.purlin.endOverhang;
const roofSheetsPerSide = Math.ceil(purlinRun / spec.roof.cover - 1e-9);
const ceilingSheets = Math.ceil((spec.columnCentres - spec.column.side) / spec.roof.cover - 1e-9);
const ridgeCaps = Math.ceil((purlinRun - spec.ridgeCap.lap) / (spec.ridgeCap.piece - spec.ridgeCap.lap) - 1e-9);
const purlinsPerSide = 7;
const sagRods = (spec.length / spec.bay) * 2 * ((purlinsPerSide - 1) * 2 + 1);
const ceilingLong = 3 * (spec.length / spec.bay);
const ceilingCross = (spec.length / spec.bay) * 2;
const ceilingBolts = 3 * (spec.length / spec.bay - 1);
const walls = (spec.length / spec.bay) * 2;
/** Lining runs the same length as the ceiling sheet (between the end rafters). */
const liningRun = spec.length - spec.rafter.width;
const liningSheetsPerSide = Math.ceil(liningRun / spec.roof.cover - 1e-9);
/** One girt per bay per row per side, cut to fit between the columns (like the column ties). */
const girts = spec.girt.rows * (spec.length / spec.bay) * 2;
/** One girt tie rod per bay per side; four anchor bolts per column. */
const girtRods = (spec.length / spec.bay) * 2;
const anchorBolts = (spec.length / spec.bay + 1) * 2 * 4;
const gableLabel = spec.gableClosure === "sheet" ? "Gable sheet" : "Gable netting";
const meshText = `SS304 welded mesh ${Math.round(spec.netting.mesh * 1000)} mm`;
/** First bay, last bay, and two bays near 30 m and 66 m. */
export const roofBraceBays = [0, 5, 11, spec.length / spec.bay - 1];
const roofBraces = roofBraceBays.length * 4;

/** One mesh per fabricated piece. Webs are split into verticals and the W diagonals. */
/**
 * Roof purlin cut plan: per line, 6 m pieces (less the joint gap) in the inner bays and one end piece at each
 * gable (6 m bay + half the end rafter + 5 ft overhang, less half a joint gap). Joints sit on the rafter centre.
 */
export const roofPurlinCut = (() => {
  const bays = spec.length / spec.bay;
  const gap = spec.purlin.jointGap;
  const lines = 14;
  const inner = bays - 2;
  const bayCut = spec.bay - gap;
  const endCut = spec.bay + spec.rafter.width / 2 + spec.purlin.endOverhang - gap / 2;
  const joints = lines * (bays - 1);
  const brackets = lines * (bays + 1);
  return { lines, inner, ends: 2, perLine: inner + 2, bayCut, endCut, joints, brackets, bolts: brackets * 4, metres: lines * (inner * bayCut + 2 * endCut) };
})();

export const parts = [
  { id: "floor", label: "Floor", count: 1 },
  { id: "walls", label: "Walls", count: walls },
  { id: "wallRebar", label: "Wall rebar", count: walls },
  { id: "floorMesh", label: "Floor mesh", count: 18 },
  { id: "padBase", label: "Pad base 4x4 ft", count: frames * 2 },
  { id: "padMesh", label: "Pad base mesh", count: frames * 2 },
  { id: "concrete", label: "Pads", count: frames * 2 },
  { id: "plates", label: "Plates", count: frames * 2 },
  { id: "anchorBolts", label: "Anchor bolts", count: anchorBolts },
  { id: "columns", label: "Columns", count: frames * 2 },
  { id: "sloping", label: "Rafters", count: frames * 2 },
  { id: "horizontal", label: "Horiz. beams", count: frames * 2 },
  { id: "splices", label: "Beam splices", count: frames },
  { id: "ties", label: "Ties", count: (frames - 1) * 2 },
  { id: "verticals", label: "Verticals", count: frames * 7 },
  { id: "wWebs", label: "W webs", count: frames * 8 },
  { id: "purlins", label: "Purlins", count: roofPurlinCut.lines * roofPurlinCut.perLine },
  { id: "cleats", label: "Purlin brackets", count: frames * 2 * purlinsPerSide },
  { id: "roof", label: "Roof", count: roofSheetsPerSide * 2 },
  { id: "ceiling", label: "Ceiling", count: ceilingSheets },
  { id: "capping", label: "Capping", count: ridgeCaps },
  { id: "sagRods", label: "Tie rods", count: sagRods },
  { id: "roofBraces", label: "Cables", count: roofBraces },
  { id: "ceilingLong", label: "Long purlins", count: ceilingLong },
  { id: "ceilingBolts", label: "Bolts", count: ceilingBolts },
  { id: "ceilingCross", label: "Cross purlins", count: ceilingCross },
  { id: "wallGirts", label: "Wall girts", count: girts },
  { id: "girtRods", label: "Girt tie rods", count: girtRods },
  { id: "girtRodStuds", label: "Rod studs + couplers", count: girtRods },
  { id: "wallLining", label: "Wall lining", count: liningSheetsPerSide * 2 },
  { id: "eaveNetting", label: "Eave netting", count: (spec.length / spec.bay) * 2 },
  { id: "gableNetting", label: gableLabel, count: 2 },
] as const;

export type PartId = (typeof parts)[number]["id"];

export const partTotal = parts.reduce((sum, part) => sum + part.count, 0);

/** Steel mass per metre (kg/m, 7850 kg/m³): cold-formed hollow sections with corner radii 2t outside, t inside. */
const hollowKg = (b: number, d: number, t: number) => {
  const area = 2 * t * (b + d - 2 * t) - (4 - Math.PI) * ((2 * t) ** 2 - t ** 2);
  return area * 7850;
};
/** Lipped C, from its centreline length. */
const lippedCKg = (d: number, b: number, lip: number, t: number) => (d - t + 2 * (b - t) + 2 * (lip - t / 2)) * t * 7850;
const steelLines = [
  { section: "SHS 125×125×4.5", bars: 37, kg: hollowKg(0.125, 0.125, 0.0045) },
  { section: "RHS 50×125×3", bars: 73, kg: hollowKg(0.05, 0.125, 0.003) },
  { section: "SHS 125×125×3.0 · column ties", bars: (frames - 1) * 2 + 1, kg: hollowKg(0.125, 0.125, 0.003) },
  { section: "SHS 50×50×2.3", bars: 34, kg: hollowKg(0.05, 0.05, 0.0023) },
  { section: "ASC 12516 C 127×51×15×1.6 · wall girts", bars: girts + 1, kg: lippedCKg(0.127, 0.051, 0.015, 0.0016) },
];
/** Cold-formed C sections supplied cut to length (not in the 6 m bar order above). */
const c12516 = lippedCKg(0.127, 0.051, 0.015, 0.0016);
const cp = spec.crossPurlin;
const cCross = lippedCKg(cp.depth, cp.flange, cp.lip, cp.wall);
const cutLines: { section: string; metres: number; kg: number; pieces?: string }[] = [
  { section: "ASC 12516 · roof purlins", metres: roofPurlinCut.metres, kg: c12516, pieces: `${roofPurlinCut.lines * roofPurlinCut.inner} × 6 m (cut ${roofPurlinCut.bayCut.toFixed(3)}) + ${roofPurlinCut.lines * roofPurlinCut.ends} × ${roofPurlinCut.endCut.toFixed(3)} m end pieces = ` },
  { section: "ASC 12516 · long ceiling purlins", metres: ceilingLong * (spec.bay + 0.1), kg: c12516 },
  { section: "C 100×50×15×1.2 · ceiling cross purlins", metres: ceilingCross * (spec.columnCentres + spec.column.side), kg: cCross },
];
export const cutOrder = cutLines.map((l) => ({
  section: l.section,
  order: `${l.pieces ?? ""}${l.metres.toFixed(1)} m · ${l.kg.toFixed(2)} kg/m · ${((l.metres * l.kg) / 1000).toFixed(2)} t`,
}));
/** Old ASC 12516 cross purlins against the lighter C (kg), for the saving note. */
export const crossPurlinSaving = cutLines[2].metres * (c12516 - cCross);
/** Rods and bolts, gross section: M12 girt tie rods (bottom girt web up to the top of the SHS tie) and M20 anchor bolts. */
const rodKg = (d: number) => Math.PI * (d / 2) ** 2 * 7850;
const girtRodLength =
  spec.floor.edge + spec.eaveAtColumn - spec.columnTie.depth - spec.girt.stud.head - spec.girt.stud.thread -
  (spec.floor.edge + spec.wall.inside + 0.002 + spec.girt.bottomRaise + spec.purlin.flange - spec.purlin.wall - 0.02);
const anchorLength = spec.anchorBolt.embed + spec.basePlate.thickness + spec.anchorBolt.projection;
export const smallSteel = [
  { section: "M12 rod · girt tie rods", order: `${girtRods} × ${girtRodLength.toFixed(3)} m · ${((girtRods * girtRodLength * rodKg(0.012)) / 1000).toFixed(3)} t` },
  { section: "M12 × 40 bolts, grade 4.6 (welded studs) + M12 coupling nuts", order: `${girtRods} + ${girtRods}` },
  {
    section: "M12 bolts + nuts + washers · roof purlin brackets",
    order: `${roofPurlinCut.bolts} (4 per bracket × ${roofPurlinCut.brackets}; at the ${roofPurlinCut.joints} butt joints 2 per purlin end)`,
  },
  { section: "M20 · anchor bolts", order: `${anchorBolts} × ${anchorLength.toFixed(3)} m · ${((anchorBolts * anchorLength * rodKg(0.02)) / 1000).toFixed(3)} t` },
];
const smallSteelMass = (girtRods * girtRodLength * rodKg(0.012) + anchorBolts * anchorLength * rodKg(0.02)) / 1000;
/** Side walls: reinforced concrete panels between the columns and their rebar. */
const wallPanelLength = spec.bay - spec.column.side;
const wallMeanHeight = (spec.wall.inside + spec.wall.outside) / 2;
const wm = spec.wallMesh;
const meshRows = Math.floor((wallMeanHeight - wm.topCover - wm.firstRow) / wm.grid) + 1;
const meshVerticals = Math.floor((wallPanelLength - 0.1) / wm.grid) + 1;
export const wallQuantities = {
  panels: walls,
  meshRows,
  meshVerticals,
  concreteM3: walls * wallPanelLength * spec.wall.thickness * wallMeanHeight,
  rebarKg: walls * (meshRows * wallPanelLength + meshVerticals * (wallMeanHeight - wm.topCover + wm.below)) * wm.kgPerM,
};
/** Floor slab, its mesh and the pads (concrete m³, rebar kg). No strip footing (Tan, 29 Sep 4:22 PM). */
export const foundationQuantities = (() => {
  const fl = spec.floor;
  const fm = spec.floorMesh;
  const run = spec.length + spec.concrete.side;
  const floorWidth = 2 * (half + spec.column.side / 2 + fl.toe);
  const floorArea = run * floorWidth;
  const padsM3 = frames * 2 * spec.concrete.side ** 2 * spec.concrete.depth;
  const pb = spec.padBase;
  const padBaseM3 = frames * 2 * pb.side ** 2 * pb.depth;
  const padMeshBars = Math.floor((pb.side - 2 * 0.05) / fm.grid) + 1;
  const padMeshKg = frames * 2 * 2 * padMeshBars * (pb.side - 0.1) * fm.kgPerM;
  const longBars = Math.floor((floorWidth - 2 * 0.05) / fm.grid) + 1;
  const crossBars = Math.floor((run - 2 * 0.05) / fm.grid) + 1;
  const meshBareKg = (longBars * (run - 0.1) + crossBars * (floorWidth - 0.1)) * fm.kgPerM;
    return {
    run,
    floorArea,
    floorM3: floorArea * fl.thickness,
    longBars,
    crossBars,
    floorMeshKg: meshBareKg * (1 + fm.lapExtra),
    floorMeshBareKg: meshBareKg,
    padsM3,
    padBaseM3,
    padMeshBars,
    padMeshKg,
  };
})();

/** Total mass of the 6 m bars ordered (tonnes). */
export const steelOrderMass = steelLines.reduce((sum, l) => sum + (l.bars * 6 * l.kg) / 1000, 0);
/** Cut-to-length C sections (tonnes). */
export const cutOrderMass = cutLines.reduce((sum, l) => sum + (l.metres * l.kg) / 1000, 0);
/** All steel: 6 m bars ordered, cut-to-length C sections, rods and anchor bolts (tonnes; plates, cleats and sag rods not included). */
export const steelTotalMass = steelOrderMass + cutOrderMass + smallSteelMass;
/** Mill lengths to order, with approximate mass. The last bar on each line is a spare. */
export const steelOrder = steelLines.map((l) => ({
  section: l.section,
  order: `${l.bars} × 6 m · ${l.kg.toFixed(1)} kg/m · ${((l.bars * 6 * l.kg) / 1000).toFixed(2)} t`,
}));

/** Positive-side purlin stations, measured horizontally from the ridge. */
export function purlinStations(columnOuterZ: number, tipZ: number): number[] {
  const cos = Math.cos(pitch);
  // The C opens up the slope (back inside). The station is its downslope edge, which is the web, so the ridge
  // purlin's web stays 150 mm from the ridge, the column purlin's web is flush with the column's outside face,
  // and the tip purlin's web is 150 mm from the tip.
  const ridge = spec.purlin.inset * cos;
  const tip = tipZ - spec.purlin.inset * cos;
  const between = [1, 2, 3, 4].map((k) => ridge + ((columnOuterZ - ridge) * k) / 5);
  return [ridge, ...between, columnOuterZ, tip];
}

export function metres(value: number, digits = 3): string {
  return `${value.toFixed(digits)} m`;
}

/** A point in the plane of one portal frame: z across the house (0 at the ridge), y up (0 at ground). */
export type FramePoint = { z: number; y: number };
/** A straight member drawn between two centreline points, square or rectangular in section. */
export type FrameBar = { a: FramePoint; b: FramePoint };

const add = (p: FramePoint, v: FramePoint, s: number): FramePoint => ({ z: p.z + v.z * s, y: p.y + v.y * s });

/**
 * One portal frame, computed once and shared by the 3D viewer and the 2D section diagram.
 * All values are true size, in metres, in the frame plane.
 */
export function frameLayout(endFrame = false) {
  const cos = Math.cos(pitch);
  const sin = Math.sin(pitch);
  const col = spec.column.side;
  const plateT = spec.basePlate.thickness;
  const chordD = spec.rafter.depth;
  const halfD = chordD / 2;
  const yEdge = spec.floor.edge;
  const yCenter = spec.floor.center;
  const yColumnTop = yEdge + spec.eaveAtColumn;
  const yBeam = yColumnTop + halfD;
  const yRafterAtColumn = yBeam + halfD * (1 + cos);
  const yRidge = yRafterAtColumn + ridgeAboveColumn;
  const yTip = yRidge - rise;
  const zCol = half;
  const zTip = horiz;
  const zFace = zCol + col / 2;
  // Tan, 28 Sep 8:48 PM: every base plate sits on its pad with its top 4 in below the floor top (buried in the slab).
  void endFrame;
  const plateTop = yEdge - spec.floor.thickness;
  const padTop = plateTop - plateT;

  const columns = [-zCol, zCol].map((z) => ({ z, bottom: plateTop, top: yColumnTop }));
  const plates = [-zCol, zCol].map((z) => ({ z, top: plateTop }));
  const pads = [-zCol, zCol].map((z) => ({ z, top: padTop }));

  // Square cut at the eave tip, plumb cut at the ridge, plus the small toe filler under the tip.
  const rafters = [-1, 1].map((sign) => {
    const up = { z: sign * sin, y: cos };
    const tip = { z: sign * zTip, y: yTip };
    const tipTop = add(tip, up, halfD);
    const tipBot = add(tip, up, -halfD);
    const plumbHalf = halfD / cos;
    const ridgeTop = { z: 0, y: yRidge + plumbHalf };
    const ridgeBot = { z: 0, y: yRidge - plumbHalf };
    const toe = { z: tipTop.z, y: tipBot.y };
    return { sign, tip, outline: [tipBot, tipTop, ridgeTop, ridgeBot], toe: [tipBot, tipTop, toe] };
  });

  // Horizontal beam at column top: a 6 m bar and the remainder, spliced 6 m from the left end.
  const cap = col / 2;
  const zBeam0 = -(zCol + cap);
  const zBeam1 = zCol + cap;
  const zSplice = zBeam0 + 6;
  const gap = 0.004;
  const beam = {
    y: yBeam,
    pieces: [
      { a: { z: zBeam0, y: yBeam }, b: { z: zSplice - gap / 2, y: yBeam } },
      { a: { z: zSplice + gap / 2, y: yBeam }, b: { z: zBeam1, y: yBeam } },
    ] as FrameBar[],
    splice: { a: { z: zSplice - 0.14, y: yBeam }, b: { z: zSplice + 0.14, y: yBeam } } as FrameBar,
    spliceOversize: 0.012,
  };

  const yAt = (z: number) => yRafterAtColumn + (1 - Math.abs(z) / zCol) * ridgeAboveColumn;
  const yWebTop = (z: number) => yAt(z) - halfD * cos;
  const yWebBottom = yBeam + halfD;
  const quarter = zCol / 2;
  const outerGap = (zCol - quarter) / 3;
  const verticalZ = [
    -quarter,
    0,
    quarter,
    ...[-1, 1].flatMap((sign) => [1, 2].map((i) => sign * (quarter + i * outerGap))),
  ];
  const verticals: FrameBar[] = verticalZ.map((z) => ({ a: { z, y: yWebBottom }, b: { z, y: yWebTop(z) } }));
  // One upside-down W under each rafter, only in the inner quarter-span beside the ridge.
  const step = quarter / 4;
  const wLeft = [0, 1, 2, 3, 4].map((i) => -quarter + i * step);
  const wRight = [0, 1, 2, 3, 4].map((i) => quarter - i * step);
  const wWebs: FrameBar[] = [];
  for (const stations of [wLeft, wRight]) {
    for (let s = 0; s < stations.length - 1; s += 1) {
      const z0 = stations[s];
      const z1 = stations[s + 1];
      const y0 = s % 2 === 0 ? yWebTop(z0) : yWebBottom;
      const y1 = s % 2 === 0 ? yWebBottom : yWebTop(z1);
      wWebs.push({ a: { z: z0, y: y0 }, b: { z: z1, y: y1 } });
    }
  }

  /** Axes of the roof plane on one side: normal (out of the roof) and upslope (towards the ridge). */
  const slopeAxes = (sign: number) => ({
    normal: { z: sign * sin, y: cos },
    upslope: { z: -sign * cos, y: sin },
  });
  // Purlins: each C sits on the rafter top, its origin at the downslope bottom corner (the web's outer face).
  const stations = purlinStations(zFace, zTip);
  const purlins = [-1, 1].flatMap((sign) =>
    stations.map((zAbs) => ({
      sign,
      zAbs,
      origin: { z: sign * zAbs, y: yRidge - rise * (zAbs / zTip) + halfD / cos },
      ...slopeAxes(sign),
    })),
  );

  // Roof sheet: runs from the ridge down past the rafter tip by the eave overhang.
  const pD = spec.purlin.depth;
  const slopeLen = rafterCentre - pD * Math.tan(pitch);
  const roof = [-1, 1].map((sign) => ({
    sign,
    origin: { z: sign * zTip, y: yTip + halfD / cos },
    ...slopeAxes(sign),
    from: -spec.roof.eaveOverhang,
    to: slopeLen,
    bareTip: spec.roof.bareTip,
    /** Metal backing (flat underside of the panel), top of the foam under the pans, and the profiled skin's pan. */
    foamBottom: pD + spec.roof.lift,
    foamTop: pD + spec.roof.lift + spec.roof.foam,
    skin: pD + spec.roof.lift + spec.roof.foam + 0.001,
  }));

  // Inner wall lining (roof panel), ribs in. The flat metal-backed face (outside) stands just clear of the girts on the
  // columns' inside-face plane, which is also the wall's inside face; 25 mm of foam, then the skin pan, and the
  // rib crests one rib height further into the house.
  const zInner = zCol - col / 2;
  const zFoamFace = zInner - spec.lining.faceGap;
  const zPan = zFoamFace - spec.roof.foam - 0.001;
  const zCrest = zPan - spec.roof.rib;
  const yCeiling = yColumnTop - 0.001;
  // The ceiling runs over the lining's rib crests to its pan line, so the ceiling pan closes the top of every
  // rib recess: a clean corner with no slot, and the ceiling's own ribs die into the lining's rib crests.
  const ceiling = { y: yCeiling, z0: -zPan, z1: zPan };

  const wing = (spec.ridgeCap.girth - 2 * spec.ridgeCap.lip) / 2;
  const capLift = pD + spec.roof.lift + spec.roof.foam + spec.roof.rib + 0.002;
  const ridgeCap = { yCrease: yRidge + halfD / cos + capLift / cos, wing, lip: spec.ridgeCap.lip };

  // Wall top line: a sloped concrete cap falling to the outside (no flashing).
  const yWallIn = yEdge + spec.wall.inside;
  const yWallOut = yEdge + spec.wall.outside;
  const wallTopAt = (zAbs: number) => yWallIn - ((zAbs - zInner) * (yWallIn - yWallOut)) / spec.wall.thickness;
  const yLiningBottom = yWallIn - spec.lining.wallLap;
  const lining = [-1, 1].map((sign) => ({
    sign,
    /** Flat metal-backed face (outside, against the girts), skin pan, and rib crests (the innermost face, in the house). */
    zFoamFace: sign * zFoamFace,
    zPan: sign * zPan,
    zCrest: sign * zCrest,
    y0: yLiningBottom,
    y1: yCeiling - spec.lining.ceilingGap,
  }));

  // Girts: web on top, toes down. The bottom row sits bottomRaise (300 mm) (plus 2 mm) above the wall's inside
  // top edge, hung from the tie by the midspan rod (no support on the wall); the second row is centred at
  // midCentre. The SHS column tie above (its top flush with the column top, flush with both column faces) takes the lining's top
  // fixing, so there is no top girt row.
  const tieBottom = yColumnTop - spec.columnTie.depth;
  const girtBottomLow = yWallIn + 0.002 + spec.girt.bottomRaise;
  const girtTops = [girtBottomLow + spec.purlin.flange, spec.girt.midCentre + spec.purlin.flange / 2];
  const girts = [-1, 1].flatMap((sign) =>
    girtTops.map((yTop) => ({
      sign,
      /** Inner flange face (against the lining's metal-backed face) and outer flange face (2 mm past the column's outside face). */
      zIn: sign * zInner,
      zOut: sign * (zInner + spec.purlin.depth),
      yTop,
      yBottom: yTop - spec.purlin.flange,
    })),
  );
  // Tie rod: from a nut just under the bottom girt's web, through the middle girt's web, up to a coupling nut on
  // an M12 stud welded under the SHS column tie, rodInset in from the outer flange. No girt support under the
  // bottom girt (Tan, 28 Sep 7:50 PM): the rod hangs it from the tie.
  const girtRods = [-1, 1].map((sign) => ({
    sign,
    z: sign * (zInner + spec.purlin.depth - spec.girt.rodInset),
    y0: girtTops[0] - spec.purlin.wall - 0.02,
    /** Rod top: the end of the welded M12 stud, inside the coupling nut. */
    y1: yColumnTop - spec.columnTie.depth - spec.girt.stud.head - spec.girt.stud.thread,
    /** Underside of the SHS tie, where the stud's head is welded. */
    yTieUnder: yColumnTop - spec.columnTie.depth,
  }));

  // Eave netting: in the plane of the columns' outside face, where the column tie (outside flush) and the
  // column-line roof purlin (its web's bottom corner is at zFace) both sit. It closes the gap from the
  // top of the tie up to the underside of that purlin, bay by bay between the rafters.
  const tieTop = yColumnTop;
  const purlinUnder = (zAbs: number) => yRidge - rise * (zAbs / zTip) + halfD / cos;
  const eaveNetting = [-1, 1].map((sign) => ({
    sign,
    z: sign * (zFace + spec.netting.offset),
    y0: tieTop,
    y1: purlinUnder(zFace),
  }));
  // Gable netting (or sheet): the end-frame outline from ceiling level up to the underside of the roof
  // panel (purlin tops), across the outside faces of the columns.
  const roofUnder = (zAbs: number) => purlinUnder(zAbs) + pD;
  const gable: FramePoint[] = [
    { z: -zFace, y: yColumnTop },
    { z: zFace, y: yColumnTop },
    { z: zFace, y: roofUnder(zFace) },
    { z: 0, y: roofUnder(0) },
    { z: -zFace, y: roofUnder(zFace) },
  ];

  const walls = [-1, 1].map((sign) => ({
    sign,
    zOut: sign * zFace,
    zIn: sign * (zFace - spec.wall.thickness),
    yBase: yEdge,
    yIn: yEdge + spec.wall.inside,
    yOut: yEdge + spec.wall.outside,
  }));

  return {
    cos,
    sin,
    halfD,
    yEdge,
    yCenter,
    yColumnTop,
    yBeam,
    yRafterAtColumn,
    yRidge,
    yTip,
    zCol,
    zTip,
    zFace,
    plateTop,
    padTop,
    columns,
    plates,
    pads,
    rafters,
    beam,
    verticals,
    wWebs,
    purlins,
    roof,
    ceiling,
    ridgeCap,
    walls,
    zInner,
    lining,
    girts,
    girtRods,
    tieBottom,
    eaveNetting,
    gable,
  };
}

export type FrameLayout = ReturnType<typeof frameLayout>;

/**
 * What each part is, for the Measure tool's part readout. Sections match the steel order and the fact list.
 * "length" parts report the drawn length of the picked piece; "size" parts report its overall size.
 */
export const partInfo: Record<PartId, { name: string; section: string; measure: "length" | "size"; lengthLabel?: string }> = {
  floor: { name: "Floor slab", section: "Concrete 4 in (100 mm) thick, BRC A10 mesh · top 6 in above ground at the ridge line, 4 in at the column face (fall to the walls) · runs 150 mm past the columns' outside face so the base plates are buried · poured with the pads, before the wall", measure: "size" },
  padBase: { name: "Pad base", section: "4 ft × 4 ft × 4 in (1219 × 1219 × 102 mm) reinforced concrete under each 609 mm pad, centred · BRC A10 at 7 in (178 mm) each way, mid-depth · also the pad's blinding", measure: "size" },
  padMesh: { name: "Pad base mesh", section: "BRC A10: 10 mm bars at 7 in (178 mm) each way, 7 × 7 per base, at mid-depth of the 4 in base", measure: "size" },
  floorMesh: { name: "Floor mesh", section: "BRC A10: 10 mm bars at 7 in (178 mm) each way (Tan) · one layer at mid-depth of the 4 in slab, about 40 mm top cover · sheet laps about one square + 50 mm", measure: "size" },
  walls: { name: "Side wall", section: "Reinforced concrete, 125 mm, flush with both column faces · one layer Y10 at 320 mm each way at mid-thickness (about 57 mm cover) · 914 mm (36 in) above the floor on the inside edge, falling to 864 mm outside", measure: "length" },
  wallRebar: { name: "Wall rebar", section: "Y10 at 320 mm each way, one layer at mid-thickness · 3 horizontal bars welded to the column sides, 19 verticals per bay running straight down 6 in (152 mm) below the floor top, through the 4 in slab, no starter bars", measure: "size" },
  concrete: { name: "Concrete pad", section: "609 × 609 × 609 mm (2 ft cube) concrete block · top 113.6 mm below the floor top (plate 4 in below the floor) · poured with the slab · no strip footing (removed 29 Sep)", measure: "size" },
  plates: { name: "Base plate", section: "Plate 300×300×12 (assumed; 16–20 mm advised for a fixed base) · 4 × M20 anchor bolts · top 4 in below the floor, buried in the slab", measure: "size" },
  anchorBolts: {
    name: "Anchor bolt",
    section: "M20 cast-in, 4 per base plate on a 200 mm square · 400 mm embedded in the 609 mm pad (204.5 mm from each side) · 50 mm above the plate for washer and nut, all buried in the floor slab (about 50 mm cover)",
    measure: "length",
  },
  columns: { name: "Column", section: "SHS 125×125×4.5", measure: "length" },
  sloping: { name: "Rafter", section: "RHS 50×125×3 · square cut at eave, 10° plumb cut at ridge", measure: "length", lengthLabel: "Top edge" },
  horizontal: { name: "Horizontal beam", section: "RHS 50×125×3", measure: "length" },
  splices: { name: "Beam splice", section: "Splice sleeve over RHS 50×125", measure: "length" },
  ties: { name: "Column tie", section: "SHS 125×125×3.0 · eave strut, flush with both column faces, welded to the column sides · lining fixed to its inside face", measure: "length" },
  verticals: { name: "Web vertical", section: "SHS 50×50×2.3", measure: "length" },
  wWebs: { name: "W web diagonal", section: "SHS 50×50×2.3", measure: "length" },
  purlins: { name: "Roof purlin", section: "AJIYA ASC 12516 C 127×51×15×1.6 · open side up the slope, facing inside · 6 m per bay, butt-jointed over each inner rafter; end pieces carry the 5 ft gable overhang", measure: "length" },
  cleats: { name: "Purlin bracket", section: "5 in bracket · 220 mm · B 63.5 · H 89 · 4 slots", measure: "size" },
  roof: {
    name: "Roof sheet",
    section: "Mega Rib 35 PUR 25 mm, zincalume TCT 0.47 mm · foam fills the ribs, 25 mm under the pans, metal backing · last 5 in bare · 723 mm cover",
    measure: "length",
    lengthLabel: "Sheet run down the slope",
  },
  ceiling: { name: "Ceiling sheet", section: "Mega Rib 35, zincalume TCT 0.47 mm, no foam · 723 mm cover", measure: "size" },
  capping: { name: "Ridge cap", section: "24 in girth zincalume 0.47 mm · 8 ft pieces", measure: "length", lengthLabel: "Run" },
  sagRods: { name: "Purlin tie rod", section: "12 mm rod", measure: "length" },
  roofBraces: { name: "Roof X cable", section: "12 mm galvanized wire rope", measure: "length" },
  ceilingLong: { name: "Long ceiling purlin", section: "AJIYA ASC 12516 C 127×51×15×1.6", measure: "length" },
  ceilingBolts: { name: "Ceiling purlin bolt", section: "M10 bolt", measure: "length" },
  ceilingCross: { name: "Cross purlin", section: "Lipped C 100×50×15×1.2 G450 (lighter section, saving applied) · spans about 2.53 m between long purlins · hung with a 27 mm packer", measure: "length" },
  wallGirts: { name: "Wall girt", section: "AJIYA ASC 12516 C 127×51×15×1.6 · between columns, web on top, open side down · bottom row raised 300 mm off the wall top, hung from the SHS tie by the midspan M12 rod (no support on the wall)", measure: "length" },
  girtRods: {
    name: "Girt tie rod",
    section: "M12 threaded rod · bay midspan, from the bottom girt through the middle girt up to the SHS 125 column tie, screwed into a coupling nut on an M12 stud welded under the tie · 25 mm in from the girts' outer flange · nuts both sides of each girt web",
    measure: "length",
  },
  girtRodStuds: {
    name: "Rod stud + coupling nut",
    section: "M12 × 40 bolt, grade 4.6 mild steel (weldable, not 8.8), in a 16 mm hole in the SHS tie's bottom wall, head against the underside, threads down · grind off zinc, weld all round to seal the hole, paint afterwards · M12 coupling nut joins the tie rod",
    measure: "size",
  },
  wallLining: { name: "Wall lining sheet", section: "Mega Rib 35 PUR 25 mm, zincalume TCT 0.47 mm (roof panel) · ribs vertical · ribs in, metal-backed foam face out · 723 mm cover · foam the full length (no bare strip) · laps 50 mm (2 in) down over the concrete wall's inner face, 2 mm clear of it, joint at the wall top edge sealed · exposed foam at the foot sealed (PU/silicone bead) against wash-down water · no rib closure strips needed: the foam fills the ribs to the panel ends", measure: "length", lengthLabel: "Sheet length" },
  eaveNetting: {
    name: `Eave netting · ${meshText}`,
    section: `Stainless 304 welded wire mesh, ${Math.round(spec.netting.mesh * 1000)} mm holes · screwed direct to steel · outside face of the columns, tie top to purlin underside`,
    measure: "size",
  },
  gableNetting: {
    name: spec.gableClosure === "sheet" ? gableLabel : `${gableLabel} · ${meshText}`,
    section: spec.gableClosure === "sheet" ? "Sheet · end frame, ceiling level to roof underside" : `Stainless 304 welded wire mesh, ${Math.round(spec.netting.mesh * 1000)} mm holes · screwed direct to steel · outside face of the end truss, ceiling level to roof underside`,
    measure: "size",
  },
};

/** Wall lining and girt sizes for the facts panel and the part readout. */
export const liningInfo = (() => {
  const f = frameLayout(false);
  const l = f.lining[1];
  const girtRows = f.girts.filter((g) => g.sign > 0).map((g) => ({ bottom: g.yBottom, top: g.yTop }));
  return {
    run: liningRun,
    sheetsPerSide: liningSheetsPerSide,
    sheets: liningSheetsPerSide * 2,
    sheetLength: l.y1 - l.y0,
    /** How far the lining's pans and rib crests stand in from the concrete wall's inside face. */
    panInsideWall: f.zInner - l.zPan,
    crestInsideWall: f.zInner - l.zCrest,
    /** Panel thickness as drawn: backing face to rib crest. */
    panelThickness: l.zFoamFace - l.zCrest,
    /** Clear width between the lining's rib crests, and between its pans. */
    clearInside: 2 * l.zCrest,
    clearAtPans: 2 * l.zPan,
    girtLength: spec.bay - spec.column.side,
    girtRows,
    girtPastColumn: f.girts.find((g) => g.sign > 0)!.zOut - f.zFace,
    girts,
    /** Clear gap from the concrete wall's inside top edge up to the lining's foot. */
    /** How far the lining laps down past the concrete wall's inside top edge, and its clearance to the wall face. */
    wallLap: f.walls[1].yIn - l.y0,
    wallFaceClear: spec.lining.faceGap,
  };
})();

/** Eave and gable netting sizes for the facts panel. */
export const nettingInfo = (() => {
  const f = frameLayout(true);
  const n = f.eaveNetting[1];
  const bays = spec.length / spec.bay;
  const runPerSide = bays * (spec.bay - spec.rafter.width);
  const height = n.y1 - n.y0;
  const g = f.gable;
  const gableArea = Math.abs(g.reduce((sum, p, i) => {
    const q = g[(i + 1) % g.length];
    return sum + p.z * q.y - q.z * p.y;
  }, 0)) / 2;
  return {
    runPerSide,
    height,
    eaveAreaPerSide: runPerSide * height,
    eaveArea: 2 * runPerSide * height,
    gableArea,
    gableAreaTotal: 2 * gableArea,
    gableHeight: g[3].y - g[0].y,
    gableWidth: g[1].z - g[0].z,
    closure: spec.gableClosure,
  };
})();

/** "125 mm" under a metre, otherwise "6.000 m". */
export function formatLength(value: number): string {
  const v = Math.abs(value);
  return v < 1 ? `${Math.round(v * 1000)} mm` : `${v.toFixed(3)} m`;
}
