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
  // Tan, 1 Oct 2026 (option A): the PU 25 panel is the ROOF again and the ceiling is a plain 0.35 sheet, so the column top
  // drops back the 26 mm it rose for the PU ceiling panel (30 Sep 7:12 PM); the ceiling's rib crests stay at 4.000 m clear.
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
   * Pad cage (Tan, 29 Sep 5:18 PM): open-top Y12 cage in each 609 mm pad, 50 mm to the bar centre lines all round.
   * 8 U-bars, `perWay` each way, evenly 50 to 559 mm (about 170 mm): each crosses the bottom and turns up two opposite
   * faces to 50 mm below the pad top (no top bars). The second direction sits one bar diameter above the first at the
   * bottom and its legs sit one diameter inside the first's, so the corner legs do not clash. Plus 2 horizontal Y12
   * rings inside the legs at `rings` above the pad bottom, closed with a `ringLap` overlap. The 4 M20 anchor bolts
   * (200 mm square, bottoms about 209 mm above the pad bottom) drop through the open top inside the cage, clear of it.
   */
  padCage: { bar: 0.012, cover: 0.05, perWay: 4, rings: [0.2, 0.4], ringLap: 0.3, kgPerM: 0.888 },
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
   * inside and outside column faces, top flush with the column top. The wall lining's top fixes into its inside face.
   * Connection (Tan, 30 Sep 2026: no site welding, shop welding OK): the tie is cut `endGap` short of each column
   * face, sits on a shop-welded seat angle (spec.tieAngle) and is bolted down on site; plastic end caps close its ends.
   */
  columnTie: { width: 0.125, depth: 0.125, wall: 0.003, endGap: 0.005 },
  /**
   * Ceiling hangers (Tan, 30 Sep 7:25 PM: the cross purlins had NO contact with the long purlins, a 27 mm gap with only a
   * notional packer). At every crossing of a cross purlin under a long purlin: one L50×50×5 angle, upright, shop cut and
   * punched (no welding); SITE: 2 × M10 grade 4.6 into the long purlin's web and 2 × M10 into the cross purlin's web.
   * The cross-purlin leg has vertical `slot` holes (11 × 30), so each cross purlin can be set to a string line (±10 mm,
   * taking out the long purlins' sag) before the bolts are tightened; then `lockScrews` self-drilling screws through the
   * leg into the cross purlin web stop it sliding down the slots.
   */
  ceilingHanger: { leg: 0.05, thickness: 0.005, bolt: 0.01, bottomGap: 0.02, topGap: 0.02, slot: { width: 0.011, length: 0.03 }, lockScrews: 2 },
  /**
   * Ceiling edge angle along each wall: a cold-formed galvanised angle, `flat` × `up` × `thickness`. The flat leg lies on the
   * SHS column tie's top (`onTie` of it, clear of the eave netting), its heel and the `up` leg on the tie, and runs
   * `flat - onTie` past the tie's inside face into the house, over the ceiling sheet's edge pan (the sheet stops at the
   * lining's pan line, 28 mm in from the tie). Cut to fit between the cross purlins and the columns, `gap` clear of each,
   * so 3 pieces per bay per side. SITE: self-drilling screws down into the tie at `screwPitch`, and up through the
   * ceiling's edge pan into the flat leg at `screwPitch`, on a sealant bead, so the edge is held and sealed all along.
   */
  ceilingEdge: { flat: 0.1, up: 0.05, thickness: 0.0016, onTie: 0.03, gap: 0.005, screwPitch: 0.3 },
  /**
   * Tie seat angle (T2, Tan 30 Sep 2026; L75×75×6, Tan 2:24 PM): `length` across the column (centred, 5 mm in from
   * each face), upright leg SHOP-welded to the column side face (5 mm fillet down both sides and across the bottom; no weld
   * at the heel, where the tie end sits), flat leg under the tie. No holes through the column. SITE: `bolts` × M16
   * grade 8.8 per tie end, down through the tie's bottom face into the flat leg, `boltAt` from the column face,
   * `gauge` apart across the tie; heads inside the tie (set through the open end before lifting), washer and nut
   * under the leg. `cap`: push-in plastic end cap flange in the gap.
   */
  tieAngle: { leg: 0.075, thickness: 0.006, length: 0.115, bolts: 2, bolt: 0.016, boltAt: 0.045, gauge: 0.06, cap: 0.002 },
  /**
   * Girt bracket (G1, Tan 30 Sep 2026; L75×75×6, Tan 2:24 PM): an angle `width` long across the wall. The upright
   * leg is SHOP-welded to the column side face, pointing DOWN (5 mm fillet down both sides and across the bottom);
   * the flat leg (`leg` out from the column) sits inside the C, right under the girt web, between the lips (80 mm
   * against about 94 mm between the lip tips of the C127, 118 mm for a C152). Two 14×22 slots `boltAt` from the
   * column face, `gauge` apart across the web. SITE: the girt (cut `girt.endGap` short at each end, web holes punched
   * by the supplier) drops onto the brackets, 2 × M12 bolts down through the web and the flat leg, nut underneath.
   */
  girtCleat: { leg: 0.075, thickness: 0.006, width: 0.08, bolts: 2, boltAt: 0.045, gauge: 0.04, bolt: 0.012 },
  /**
   * Truss heel to column top, fork joint (engineer must design: it carries the frame moment, about 20 kNm). SHOP: a
   * `capSide` square `cap` plate (128 × 128, 1.5 mm over the 125 SHS all round, a small ledge for the fillet),
   * full-penetration welded to the column top; two vertical `fin` plates, `finWidth` (125 mm, the column width)
   * across the house × `finHeight`, full-penetration welded upright on the cap, one each side of the truss.
   * Tan, 17 Oct 2026: cap plate 6 mm, the two fork plates 6 mm thick × 125 mm wide, and only 2 bolt holes: one in the
   * upper row (top tie, through the rafter) and one in the lower row (bottom tie, through the horizontal beam).
   * The fins sit directly against the RHS (50 mm apart; any clearance is for the shop drawing, none is modelled). NO heel doublers. FLUSH layout: the fins' outer ends are on the column's outside face;
   * the bolts sit `boltEnd` in from it (65 mm, for bearing and tear-out on the 3 mm RHS walls) and the fins end
   * `finEdge` past the bolts, level with the column's inner face. On the heel, a bored `tube` sleeve at each bolt
   * (OD 42.4, 21 mm bore, 50 long) through 43 mm holes in both RHS walls, SHOP-welded all round on both faces.
   * SITE: the truss drops between the fins and 2 M20 grade 8.8 bolts (the code's existing bolt size; Tan did not
   * give a new one) go horizontally through both fins and the heel, in `hole` (21 mm) holes, preloaded.
   * Rows `boltRows` above the cap top (lower row in the beam, upper row in the rafter). The column steel stops `cap`
   * below the truss seat, so the seat, ceiling (4.000 m clear), tie and lining are unchanged.
   * History kept for the checks: the 30 Sep 6 mm fork (215 mm wide, 4 bolts) FAILED the rough checks (fin base about
   * 227% elastic, the cap's spread into the column wall about 151%; review/knee6mm_calc). Those checks are not
   * computed by this code and have NOT been redone for the 125 mm wide, 2-bolt fork.
   * Grip is 62 mm (2 × 6 fins + 50 RHS); the bolt stays M20 × 110.
   */
  knee: {
    cap: 0.006,
    capSide: 0.128,
    fin: 0.006,
    finHeight: 0.225,
    /** Fork plate width across the house (Tan, 17 Oct 2026): 125 mm. */
    finWidth: 0.125,
    boltEnd: 0.065,
    finEdge: 0.06,
    bolt: 0.02,
    boltNominal: 0.11,
    hole: 0.021,
    boltRows: [0.0625, 0.1875],
    tube: { od: 0.0424, bore: 0.021, length: 0.05 },
  },
  /**
   * End cover plates (Tan, 30 Sep 11:59 AM): every open RHS 50×125 end of the truss gets a `thickness` plate cut to
   * the RHS outline, SHOP seal-welded all round (3 mm fillet): the rafter's square-cut eave tip and the ceiling
   * beam's end at the column (flush with the column's outside face, between the fins). The RHS is cut
   * `thickness` short so the plate makes up the length. The ridge joint, the splice and the webs are welded all round
   * in the shop, so they are already sealed; the tie ends have plastic caps.
   */
  endPlate: { thickness: 0.003 },
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
   * Tan, 1 Oct 2026 (option A, reversing the 30 Sep 7:12 PM swap): this PUR 25 sandwich is the ROOF again, rib sheet
   * 0.47 TCT; the CEILING is the plain Mega Rib 35 profile alone, zincalume 0.35 TCT, no foam, ribs down. The wall lining
   * stays PUR 25 with a 0.40 TCT rib sheet. Backing sheets: confirm the thickness on the quote.
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
    /** Foam under the roof sheet's pans: the PUR 25 panel is the roof (option A, Tan 1 Oct 2026). 0 draws a plain roof sheet. */
    roofFoam: 0.025,
    skin: 0.00047,
    lift: 0.001,
    /**
     * Sheet run past the rafter's eave tip, along the slope. Tan, 1 Oct 2026: cut from 1.5 ft (457 mm) to 150 mm (the
     * rafter is unchanged), so the sheet cantilevers 300 mm past the tip purlin's web (about the usual limit) instead of 607 mm.
     */
    eaveOverhang: 0.15,
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
   * over the lining to the lining's pan line; the lining stops `ceilingGap` under the ceiling's (downward) rib crests.
   */
  lining: { faceGap: 0.002, wallLap: 0.05, ceilingGap: 0.002 },
  /**
   * Wall girts behind the lining, AJIYA ASC 12520 (C 127×51×15×2.0, same profile as the 1.6 ceiling purlins), one per bay between the
   * columns. Web horizontal at the top, open side (toes) down so water cannot collect in it; the 127 mm depth
   * runs out through the 125 mm column, inner flange against the lining's metal-backed face. Three rows (Tan, 17 Oct 2026): the
   * lowest girt's bottom `bottomRaise` (4 in) above the wall top, the other two at the same pitch up to the SHS tie (girtPlan). The
   * lining's top fixes into the SHS column tie. Rods hang the girts from the tie (no girt support on the wall top).
   * Tie rods (Tan, 28 Sep, 3 PM: carried up to the SHS tie, replacing "bottom to middle girt only"): two M12
   * threaded rod pieces per bay at midspan (one per girt gap): piece 1 from under the bottom girt's web to a coupling nut on the middle
   * girt's web, piece 2 from that nut through the top girt's web up to the SHS 125 column tie. Tan's top detail: a 16 mm hole in the tie's bottom wall, an M12 × 40 grade 4.6 bolt welded
   * there with its head against the underside and threads pointing down, and an M12 coupling nut joining the rod to
   * it. `rodInset` in from the girts' outer flange (23 mm in from the tie's outside face). Nuts both sides of each
   * girt web. `stud`: head height, thread below the head, coupling nut length and across-flats.
   */
  girt: {
    rows: 3,
    /** Wall girt section: AJIYA ASC 12520, C 127×51×15×2.0 (Tan, 17 Oct 2026; same profile as 12516, thicker steel). */
    section: { depth: 0.127, flange: 0.051, lip: 0.015, wall: 0.002 },
    /** Tan, 17 Oct 2026: 3 girts, the lowest one's BOTTOM 4 in (101.6 mm) above the top of the concrete wall (inside edge). The other two are spaced at the same pitch up to the SHS tie, which is the top support (see girtPlan). */
    bottomRaise: 4 * 0.0254,
    /** Tie rods per bay per side: one per girt gap (Tan, 17 Oct 2026: 2 tie rods). */
    rodsPerBay: 2,
    /** Tan, 17 Oct 2026: 2 rod LINES per girt span at the third points (not 1 at midspan); each line is `rodsPerBay` pieces, one per girt gap. */
    rodLines: 2,
    rodDiameter: 0.012,
    rodInset: 0.025,
    /** Clear gap at each girt end to the column face (girts cut 5.865 m, Tan 30 Sep 2026). */
    endGap: 0.005,
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
/** Ceiling edge angles: 3 pieces per bay per side, between the columns and the two cross purlins. */
const ceilingEdges = ceilingCross * 3;
/** Ceiling edge angle cut lengths in one bay: column face to the first cross purlin, between the two, second to the next column. */
export const ceilingEdgeCuts = (() => {
  const g = spec.ceilingEdge.gap;
  const f = spec.crossPurlin.flange;
  const c = spec.column.side / 2;
  return [2 - f - c - 2 * g, 2 - f - 2 * g, 2 - c - 2 * g];
})();
const ceilingEdgeMetres = (spec.length / spec.bay) * 2 * ceilingEdgeCuts.reduce((a, b) => a + b, 0);
const walls = (spec.length / spec.bay) * 2;
/** Lining runs the same length as the ceiling sheet (between the end rafters). */
const liningRun = spec.length - spec.rafter.width;
const liningSheetsPerSide = Math.ceil(liningRun / spec.roof.cover - 1e-9);
/**
 * Wall girt plan (Tan, 17 Oct 2026: 3 girts, lowest bottom 4 in above the wall top). Heights are absolute y (m).
 * The lowest girt's bottom is exactly bottomRaise above the wall's inside top edge. The SHS column tie (the lining's
 * top fixing) counts as the top support, so the three girt centres and the tie's underside are at an even pitch.
 */
const girtPlan = (() => {
  const wallTop = spec.floor.edge + spec.wall.inside;
  const tieUnder = spec.floor.edge + spec.eaveAtColumn - spec.columnTie.depth;
  const h = spec.purlin.flange;
  const bottom0 = wallTop + spec.girt.bottomRaise;
  const c0 = bottom0 + h / 2;
  const pitch = (tieUnder - c0) / spec.girt.rows;
  const tops = Array.from({ length: spec.girt.rows }, (_, i) => c0 + i * pitch + h / 2);
  return { wallTop, tieUnder, pitch, tops, h };
})();
/** One girt per bay per row per side, cut to fit between the columns (like the column ties). */
const girts = spec.girt.rows * (spec.length / spec.bay) * 2;
/** Girt tie rods: spec.girt.rodsPerBay pieces per bay per side (one per girt gap, the top one on to the SHS tie). */
const girtRodStuds = (spec.length / spec.bay) * 2 * spec.girt.rodLines;
const girtRods = girtRodStuds * spec.girt.rodsPerBay;
/** Rod lines sit at the third points of the girt span: offsets from the bay centre along the wall (m). */
export const girtRodDx = Array.from({ length: spec.girt.rodLines }, (_, i) =>
  ((i + 1) / (spec.girt.rodLines + 1) - 0.5) * (spec.bay - spec.column.side - 2 * spec.girt.endGap),
);
/** One M12 coupling nut on the top of each lower girt web that joins two rod pieces. */
const girtRodJoins = girtRodStuds * (spec.girt.rodsPerBay - 1);
const anchorBolts = (spec.length / spec.bay + 1) * 2 * 4;
/** Connections (Tan, 30 Sep 2026: no site welding). One shelf cleat per girt end; one seat angle per tie end. */
const ties = (spec.length / spec.bay) * 2;
const girtCleats = girts * 2;
const girtBolts = girtCleats * spec.girtCleat.bolts;
const tieAngles = ties * 2;
const tieBolts = tieAngles * spec.tieAngle.bolts;
const tieCaps = ties * 2;
const kneeJoints = (spec.length / spec.bay + 1) * 2;
/** 2 bolts per knee: one in the beam (bottom tie), one in the rafter (top tie). */
const kneeBolts = kneeJoints * spec.knee.boltRows.length;
/** Rafter eave tips (2 per frame) + ceiling beam ends at the columns (2 per frame). */
const endPlates = (spec.length / spec.bay + 1) * 4;
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
  { id: "padCage", label: "Pad cage Y12", count: frames * 2 },
  { id: "concrete", label: "Pads", count: frames * 2 },
  { id: "plates", label: "Plates", count: frames * 2 },
  { id: "anchorBolts", label: "Anchor bolts", count: anchorBolts },
  { id: "columns", label: "Columns", count: frames * 2 },
  { id: "kneeFins", label: "Knee forks", count: kneeJoints },
  { id: "kneeBolts", label: "Knee bolts M20", count: kneeBolts },
  { id: "endPlates", label: "RHS end plates", count: endPlates },
  { id: "sloping", label: "Rafters", count: frames * 2 },
  { id: "horizontal", label: "Horiz. beams", count: frames * 2 },
  { id: "splices", label: "Beam splices", count: frames },
  { id: "ties", label: "Ties", count: (frames - 1) * 2 },
  { id: "tieAngles", label: "Tie angles L75", count: tieAngles },
  { id: "tieBolts", label: "Tie bolts M16", count: tieBolts },
  { id: "tieCaps", label: "Tie end caps", count: tieCaps },
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
  { id: "ceilingHangers", label: "Ceiling hangers", count: ceilingCross * 3 },
  { id: "ceilingEdge", label: "Ceiling edge angles", count: ceilingEdges },
  { id: "wallGirts", label: "Wall girts", count: girts },
  { id: "girtCleats", label: "Girt brackets L75", count: girtCleats },
  { id: "girtBolts", label: "Girt bolts M12", count: girtBolts },
  { id: "girtRods", label: "Girt tie rods", count: girtRods },
  { id: "girtRodStuds", label: "Rod studs + couplers", count: girtRodStuds + girtRodJoins },
  { id: "wallLining", label: "Wall lining", count: liningSheetsPerSide * 2 },
  { id: "eaveNetting", label: "Eave netting", count: (spec.length / spec.bay) * 2 },
  { id: "gableNetting", label: gableLabel, count: 2 },
] as const;

export type PartId = (typeof parts)[number]["id"];
/** Ceiling hanger angle length: from inside the cross purlin (bottom on the ceiling sheet's pans, 1 mm under the column top) up inside the long purlin (on the beam top). */
export const ceilingHangerLength =
  0.001 + spec.rafter.depth + spec.purlin.depth - spec.ceilingHanger.bottomGap - spec.ceilingHanger.topGap;
const ceilingHangers = ceilingCross * 3;

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
  { section: "ASC 12520 C 127×51×15×2.0 · wall girts", bars: girts + 1, kg: lippedCKg(spec.girt.section.depth, spec.girt.section.flange, spec.girt.section.lip, spec.girt.section.wall) },
];
/** Cold-formed C sections supplied cut to length (not in the 6 m bar order above). */
const c12516 = lippedCKg(0.127, 0.051, 0.015, 0.0016);
const cp = spec.crossPurlin;
const cCross = lippedCKg(cp.depth, cp.flange, cp.lip, cp.wall);
const cutLines: { section: string; metres: number; kg: number; pieces?: string }[] = [
  { section: "ASC 12516 · roof purlins", metres: roofPurlinCut.metres, kg: c12516, pieces: `${roofPurlinCut.lines * roofPurlinCut.inner} × 6 m (cut ${roofPurlinCut.bayCut.toFixed(3)}) + ${roofPurlinCut.lines * roofPurlinCut.ends} × ${roofPurlinCut.endCut.toFixed(3)} m end pieces = ` },
  { section: "ASC 12516 · long ceiling purlins", metres: ceilingLong * (spec.bay + 0.1), kg: c12516 },
  { section: "C 100×50×15×1.2 · ceiling cross purlins", metres: ceilingCross * (spec.columnCentres + spec.column.side), kg: cCross },
  {
    section: "Cold-formed galvanised angle 100×50×1.6 · ceiling edge along both walls",
    metres: ceilingEdgeMetres,
    kg: (spec.ceilingEdge.flat + spec.ceilingEdge.up - spec.ceilingEdge.thickness) * spec.ceilingEdge.thickness * 7850,
    pieces: `${ceilingEdges} pieces (per bay per side ${ceilingEdgeCuts.map((c) => c.toFixed(3)).join(" + ")} m) = `,
  },
];
export const cutOrder = cutLines.map((l) => ({
  section: l.section,
  order: `${l.pieces ?? ""}${l.metres.toFixed(1)} m · ${l.kg.toFixed(2)} kg/m · ${((l.metres * l.kg) / 1000).toFixed(2)} t`,
}));
/** Old ASC 12516 cross purlins against the lighter C (kg), for the saving note. */
export const crossPurlinSaving = cutLines[2].metres * (c12516 - cCross);
/** Rods and bolts, gross section: M12 girt tie rods (bottom girt web up to the top of the SHS tie) and M20 anchor bolts. */
const rodKg = (d: number) => Math.PI * (d / 2) ** 2 * 7850;
/** Rod piece spans (y0, y1): piece 0 from under the bottom girt's web to the coupler on the next girt's web; the last piece from that coupler up to the stud under the tie. */
const girtRodSpans = (() => {
  const { tops, tieUnder } = girtPlan;
  const st = spec.girt.stud;
  const n = spec.girt.rodsPerBay;
  return Array.from({ length: n }, (_, i) => ({
    y0: i === 0 ? tops[0] - spec.girt.section.wall - 0.02 : tops[i] + st.coupler / 2,
    y1: i < n - 1 ? tops[i + 1] + st.coupler / 2 : tieUnder - st.head - st.thread,
  })).map((r) => ({ ...r, length: r.y1 - r.y0 }));
})();
export const girtRodPlan = girtRodSpans;
const girtRodLengthTotal = girtRodSpans.reduce((a, r) => a + r.length, 0);
const anchorLength = spec.anchorBolt.embed + spec.basePlate.thickness + spec.anchorBolt.projection;
export const smallSteel = [
  { section: "M12 rod · girt tie rods", order: `${girtRods} pieces (${girtRodSpans.map((r, i) => `${girtRodStuds} × ${r.length.toFixed(3)} m for gap ${i + 1}`).join(", ")}) · ${((girtRodStuds * girtRodLengthTotal * rodKg(0.012)) / 1000).toFixed(3)} t` },
  { section: "M12 × 40 bolts, grade 4.6 (welded studs) + M12 coupling nuts", order: `${girtRodStuds} studs under the tie + ${girtRodStuds + girtRodJoins} coupling nuts (${girtRodStuds} at the tie, ${girtRodJoins} joining the rod pieces on the middle girt)` },
  {
    section: "M12 bolts + nuts + washers · roof purlin brackets",
    order: `${roofPurlinCut.bolts} (4 per bracket × ${roofPurlinCut.brackets}; at the ${roofPurlinCut.joints} butt joints 2 per purlin end)`,
  },
  { section: "L50×50×5 · ceiling hangers (cross purlins to long purlins, Tan 7:25 PM)", order: `${ceilingHangers} × ${ceilingHangerLength.toFixed(3)} m · ${((ceilingHangers * ceilingHangerLength * 3.77) / 1000).toFixed(3)} t · ${ceilingHangers * 4} × M10 × 30 grade 4.6 · 11 × 30 vertical slots in the cross-purlin leg · ${ceilingHangers * spec.ceilingHanger.lockScrews} × 12-14 × 20 self-drilling lock screws · ≈ RM 1.4–2.5k (rough)` },
  {
    section: "Self-drilling screws, Class 4 · ceiling edge angles",
    order: `≈ ${Math.ceil((2 * ceilingEdgeMetres) / spec.ceilingEdge.screwPitch)} (into the tie and up through the sheet's edge pan, each at ${Math.round(spec.ceilingEdge.screwPitch * 1000)} mm) + sealant bead along both walls · edge angles and screws ≈ RM 2–3k (rough)`,
  },
  { section: "M20 · anchor bolts", order: `${anchorBolts} × ${anchorLength.toFixed(3)} m · ${((anchorBolts * anchorLength * rodKg(0.02)) / 1000).toFixed(3)} t` },
];
const smallSteelMass = (girtRodStuds * girtRodLengthTotal * rodKg(0.012) + anchorBolts * anchorLength * rodKg(0.02)) / 1000;
/**
 * Connection parts (Tan, 30 Sep 2026: shop-welded, site-bolted). Masses: plate and angle from their size (7850 kg/m³,
 * holes ignored); bolt sets (bolt + nut + 2 washers) about 0.13 kg for M16 × 35 and 0.066 kg for M12 × 30.
 * RM: rough Malaysian prices, supplied, cut, drilled, shop-welded and galvanised/painted; bolts HDG; get quotes.
 */
export const connectionQuantities = (() => {
  const gc = spec.girtCleat;
  const ta = spec.tieAngle;
  const cleatKg = (2 * gc.leg - gc.thickness) * gc.thickness * gc.width * 7850;
  const kn = spec.knee;
  const capKg = kn.capSide ** 2 * kn.cap * 7850;
  const endPlateKg = spec.rafter.width * spec.rafter.depth * spec.endPlate.thickness * 7850;
  const finLength = kn.boltEnd + kn.finEdge;
  const finKg = finLength * kn.finHeight * kn.fin * 7850;
  const tubeKg = (Math.PI / 4) * (kn.tube.od ** 2 - kn.tube.bore ** 2) * kn.tube.length * 7850;
  const angleKgPerM = (2 * ta.leg - ta.thickness) * ta.thickness * 7850;
  const angleKg = angleKgPerM * ta.length;
  const lines = [
    { id: "girtCleats", name: "Girt brackets, angle L75×75×6 × 80, upright leg SHOP-welded to the column side face (pointing down), flat leg inside the C under the web, 2 × 14×22 slots", count: girtCleats, each: cleatKg, rm: [10, 14] },
    { id: "girtBolts", name: "M12 × 30 bolt + nut + 2 washers, grade 4.6 HDG, girt web to cleat, SITE", count: girtBolts, each: 0.066, rm: [1, 1.5] },
    { id: "tieAngles", name: "Tie seat angles, L75×75×6 × 115, SHOP-welded to the columns (5 mm fillet), 2 × 18 mm holes 45 mm from the column", count: tieAngles, each: angleKg, rm: [10, 15] },
    { id: "tieBolts", name: "M16 × 35 bolt + nut + 2 washers, grade 8.8 HDG, tie bottom to angle, SITE", count: tieBolts, each: 0.13, rm: [3, 5] },
    { id: "tieCaps", name: "Plastic push-in end caps for SHS 125×125", count: tieCaps, each: 0, rm: [3, 5] },
    { id: "kneeCaps", name: "Knee cap plates 128 × 128 × 6 (Tan, 17 Oct 2026), 1.5 mm over the SHS all round, SHOP full-penetration welded to the column tops", count: kneeJoints, each: capKg, rm: [19, 26] },
    { id: "kneeFins", name: "Knee fork plates 125 × 225 × 6 (Tan, 17 Oct 2026), SHOP full-penetration welded upright on the cap plate, 50 mm clear apart (against the RHS), outer end flush with the column outside face, 125 mm wide so the inner end is level with the column inner face, 2 × 21 mm holes (one in the rafter row, one in the beam row)", count: kneeJoints * 2, each: finKg, rm: [48, 64] },
    { id: "kneeTubes", name: "Bearing/crush sleeves OD 42.4 × 21 mm bore × 50 (turned from bar or heavy-wall tube; a standard CHS 42.4×5 bore of 32.4 would leave 6 mm of play), through 43 mm holes in both RHS walls, SHOP-welded all round both faces, ends flush", count: kneeBolts, each: tubeKg, rm: [8, 14] },
    { id: "kneeBolts", name: "M20 × 110 grade 8.8 PRELOADED (pretensioned) bolt + nut + 2 hardened washers, HDG, SITE, in 21 mm holes: 1 in the rafter (top tie) + 1 in the beam (bottom tie) per knee; grip 62 mm (the code's existing bolt size, Tan gave none)", count: kneeBolts, each: 0.48, rm: [7, 10.5] },
    { id: "endPlates", name: "RHS end cover plates 50 × 125 × 3, SHOP seal-welded all round on every open truss RHS end (36 rafter eave tips + 36 beam ends)", count: endPlates, each: endPlateKg, rm: [4, 8] },
  ].map((l) => ({ ...l, kg: l.count * l.each, rmLow: l.count * l.rm[0], rmHigh: l.count * l.rm[1] }));
  const kg = lines.reduce((s, l) => s + l.kg, 0);
  const rmLow = lines.reduce((s, l) => s + l.rmLow, 0);
  const rmHigh = lines.reduce((s, l) => s + l.rmHigh, 0);
  const knee = lines.filter((l) => l.id.startsWith("knee"));
  const kneeKg = knee.reduce((s, l) => s + l.kg, 0);
  const kneeRm = [knee.reduce((s, l) => s + l.rmLow, 0), knee.reduce((s, l) => s + l.rmHigh, 0)];
  return { cleatKg, angleKg, angleKgPerM, capKg, endPlateKg, finLength, finKg, tubeKg, lines, kg, rmLow, rmHigh, kneeKg, kneeRm, kneeJoints };
})();
const rmK = (v: number) => `RM ${(v / 1000).toFixed(1)}k`;
export const connectionOrder = [
  ...connectionQuantities.lines.map((l) => ({
    section: l.name,
    order: `${l.count}${l.kg > 0 ? ` · ≈ ${Math.round(l.kg)} kg` : ""} · ≈ ${rmK(l.rmLow)}–${rmK(l.rmHigh).slice(3)} (rough)`,
  })),
  {
    section: "Knee joints (OPTION 2 fork, engineer must design) subtotal",
    order: `${connectionQuantities.kneeJoints} joints · ≈ ${Math.round(connectionQuantities.kneeKg)} kg · ≈ ${rmK(connectionQuantities.kneeRm[0])}–${rmK(connectionQuantities.kneeRm[1]).slice(3)} (rough) · preloaded 8.8 bolts, 1 mm clearance holes, so the knee cannot slip`,
  },
  {
    section: "Connections total: tie, girt, knee parts and RHS end plates (extra to the total steel)",
    order: `≈ ${Math.round(connectionQuantities.kg)} kg · ≈ ${rmK(connectionQuantities.rmLow)}–${rmK(connectionQuantities.rmHigh).slice(3)} (rough)`,
  },
];
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
  const pc = spec.padCage;
  const cSpan = spec.concrete.side - 2 * pc.cover;
  const cLeg = spec.concrete.depth - 2 * pc.cover;
  const uA = cSpan + 2 * cLeg;
  const uB = cSpan - 2 * pc.bar + 2 * (cLeg - pc.bar);
  const ringLen = 2 * (cSpan - 4 * pc.bar) + 2 * (cSpan - 2 * pc.bar) + pc.ringLap;
  const padCagePerPadM = pc.perWay * (uA + uB) + pc.rings.length * ringLen;
  const padCageKg = frames * 2 * padCagePerPadM * pc.kgPerM;
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
    cageUA: uA,
    cageUB: uB,
    cageRing: ringLen,
    padCagePerPadKg: padCagePerPadM * pc.kgPerM,
    padCageKg,
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

  // The column steel stops one knee cap plate below the truss seat (Tan, 30 Sep 2026: OPTION 2 fork knee).
  const columns = [-zCol, zCol].map((z) => ({ z, bottom: plateTop, top: yColumnTop - spec.knee.cap }));
  // Fork knee: cap plate, two fins either side of the heel (x offsets from the frame line); the
  // fins and the RHS (no doublers, Tan 12:28 PM), and the 4 bolt positions (z across the house, y up).
  const kn = spec.knee;
  const finInner = spec.rafter.width / 2;
  const knee = [-zCol, zCol].map((z) => {
    // Flush layout: fins end on the column's outside face; bolts `boltEnd` in from it, then 2 × boltZ further in.
    const sg = Math.sign(z);
    const zOut = z + sg * (col / 2);
    const zBoltOut = zOut - sg * kn.boltEnd;
    const zFinIn = zBoltOut - sg * kn.finEdge;
    const zc = zBoltOut;
    return {
    z,
    zc,
    capSide: kn.capSide,
    capBottom: yColumnTop - kn.cap,
    capTop: yColumnTop,
    finX: [-1, 1].map((s) => s * (finInner + kn.fin / 2)),
    z0: Math.min(zOut, zFinIn),
    z1: Math.max(zOut, zFinIn),
    y0: yColumnTop,
    y1: yColumnTop + kn.finHeight,
    bolts: kn.boltRows.map((dy) => ({ z: zc, y: yColumnTop + dy })),
    boltLength: 2 * (finInner + kn.fin) + 0.036,
    boltNominal: kn.boltNominal,
    };
  });
  const plates = [-zCol, zCol].map((z) => ({ z, top: plateTop }));
  const pads = [-zCol, zCol].map((z) => ({ z, top: padTop }));

  // Square cut at the eave tip (closed by a 3 mm end cover plate, see endPlates), plumb cut at the ridge.
  const rafters = [-1, 1].map((sign) => {
    const up = { z: sign * sin, y: cos };
    const tip = { z: sign * zTip, y: yTip };
    const tipTop = add(tip, up, halfD);
    const tipBot = add(tip, up, -halfD);
    const plumbHalf = halfD / cos;
    const ridgeTop = { z: 0, y: yRidge + plumbHalf };
    const ridgeBot = { z: 0, y: yRidge - plumbHalf };
    return { sign, tip, outline: [tipBot, tipTop, ridgeTop, ridgeBot] };
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
  // RHS end cover plates (Tan, 30 Sep 11:59 AM): `centre` is the outer face centre of the member end, `axis` points
  // out of the end, `up` is the 125 mm direction. Rafter square-cut eave tips, then the beam ends at the columns.
  const endPlates = [
    ...rafters.map((r) => ({ kind: "rafterTip" as const, centre: r.tip, axis: { z: r.sign * cos, y: -sin }, up: { z: r.sign * sin, y: cos } })),
    ...[zBeam0, zBeam1].map((z) => ({ kind: "beamEnd" as const, centre: { z, y: yBeam }, axis: { z: Math.sign(z), y: 0 }, up: { z: 0, y: 1 } })),
  ];

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
    foamTop: pD + spec.roof.lift + spec.roof.roofFoam,
    skin: pD + spec.roof.lift + spec.roof.roofFoam + 0.001,
  }));

  // Inner wall lining (roof panel), ribs in. The flat metal-backed face (outside) stands just clear of the girts on the
  // columns' inside-face plane, which is also the wall's inside face; 25 mm of foam, then the skin pan, and the
  // rib crests one rib height further into the house.
  const zInner = zCol - col / 2;
  const zFoamFace = zInner - spec.lining.faceGap;
  const zPan = zFoamFace - spec.roof.foam - 0.001;
  const zCrest = zPan - spec.roof.rib;
  // Option A (Tan, 1 Oct 2026): plain Mega Rib 35 ceiling sheet, 0.35 TCT, no foam, RIBS DOWN. Its pans are its top face,
  // 1 mm under the truss, so `top` and `y` are the same level; the crests hang 35 mm lower, at 4.000 m clear.
  const yCeilingTop = yColumnTop - 0.001;
  const yCeiling = yCeilingTop;
  // The ceiling runs over the lining to the lining's pan line. Its ribs hang DOWN (crests at `crest`), so the lining
  // stops 2 mm under the ceiling rib crests (buildability check 7:54 PM: stopping it at the pan put the lining's top
  // 33 mm up among the ceiling ribs, a clash); the ceiling's rib crests bear on the lining top via the sealant line.
  const yCeilingCrest = yCeiling - spec.roof.rib;
  const ceiling = { y: yCeiling, top: yCeilingTop, crest: yCeilingCrest, z0: -zPan, z1: zPan };

  const wing = (spec.ridgeCap.girth - 2 * spec.ridgeCap.lip) / 2;
  const capLift = pD + spec.roof.lift + spec.roof.roofFoam + spec.roof.rib + 0.002;
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
    y1: yCeilingCrest - spec.lining.ceilingGap,
  }));

  // Girts: web on top, toes down. The bottom row's bottom sits bottomRaise (4 in) above the wall's inside
  // top edge, hung from the tie by the midspan rods (no support on the wall); the other rows follow girtPlan. The SHS column tie above (its top flush with the column top, flush with both column faces) takes the lining's top
  // fixing, so there is no top girt row.
  const tieBottom = yColumnTop - spec.columnTie.depth;
  const girtTops = girtPlan.tops;
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
  const girtRods = [-1, 1].flatMap((sign) => girtRodDx.flatMap((dx) =>
    girtRodSpans.map((span, piece) => ({
      sign,
      dx,
      piece,
      z: sign * (zInner + spec.purlin.depth - spec.girt.rodInset),
      y0: span.y0,
      /** Rod top: for the last piece the end of the welded M12 stud, inside the coupling nut. */
      y1: span.y1,
      /** Underside of the SHS tie, where the stud's head is welded. */
      yTieUnder: yColumnTop - spec.columnTie.depth,
      /** Coupling nut on the girt web at the top of this piece (none on the last piece, which ends at the tie stud). */
      yCoupler: piece < girtRodSpans.length - 1 ? girtTops[piece + 1] : null,
    })),
  ));

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
    knee,
    endPlates,
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
  padCage: { name: "Pad cage", section: "Open-top Y12 cage in the 609 mm pad, 50 mm cover to bar centres · 8 U-bars (4 each way at ≈170 mm, bottom and up two faces to 50 mm below the top) + 2 rings at 200 and 400 mm · anchor bolts drop inside, clear of the bars", measure: "size" },
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
  columns: { name: "Column", section: "SHS 125×125×4.5 · stops 6 mm under the truss seat for the knee cap plate", measure: "length" },
  kneeFins: { name: "Knee fork (cap plate + 2 fork plates, one shop-welded piece)", section: "6 mm cap plate 128 × 128 (1.5 mm over the 125 SHS all round, a small ledge for the fillet, 3.5 mm clear of the tie ends, 1.5 mm inside the eave netting), SHOP full-penetration weld to the column top + two fork plates 125 wide × 225 × 6, 50 mm clear apart (directly against the RHS, no doublers), SHOP full-penetration weld upright on the cap (Tan, 17 Oct 2026) · FLUSH: outer end on the column's outside face, 125 mm wide so the inner end is level with the column's inner face · 2 × 21 mm holes: one through the rafter (top tie), one through the horizontal beam (bottom tie), 65 mm in from the outside face · the earlier 6 mm fork (215 wide, 4 bolts) failed the rough checks (fin base about 227%, cap about 151%); not recomputed for this fork · engineer must approve", measure: "size" },
  kneeBolts: { name: "Knee bolt", section: "M20 × 110 grade 8.8 (grip 62 mm; the code's existing bolt, Tan gave no new size), PRELOADED (pretensioned, part-turn or DTI washers) with hardened washers, ON SITE · horizontal through both fork plates, the RHS walls and the bored sleeve (OD 42.4, 21 mm bore, welded into the RHS) · 21 mm holes · 2 per knee: the upper one through the rafter (top tie), the lower one through the horizontal beam (bottom tie) · faying faces blasted, not painted · lower bolt 65 mm from the beam end", measure: "length" },
  endPlates: { name: "RHS end cover plate", section: "3 mm plate cut to the RHS 50 × 125 outline, SHOP seal-welded all round (3 mm fillet) · on every open truss RHS end: the rafter eave tips and the ceiling beam ends (flush with the column's outside face, between the heel doublers) · RHS cut 3 mm short so the plate makes up the length · if the frames are hot-dip galvanised, the galvaniser must add vent holes (then plug them)", measure: "size" },
  sloping: { name: "Rafter", section: "RHS 50×125×3 · square cut at eave (3 mm end cover plate, seal-welded), 10° plumb cut at ridge (welded all round, sealed)", measure: "length", lengthLabel: "Top edge" },
  horizontal: { name: "Horizontal beam", section: "RHS 50×125×3", measure: "length" },
  splices: { name: "Beam splice", section: "Splice sleeve over RHS 50×125", measure: "length" },
  ties: { name: "Column tie", section: "SHS 125×125×3.0 · eave strut, flush with both column faces · cut 5 mm short of each column, sits on a shop-welded seat angle, 2 × M16 bolted down on site at each end · plastic end caps · lining fixed to its inside face", measure: "length" },
  tieAngles: { name: "Tie seat angle", section: "L75×75×6 × 115 mm (Tan, 30 Sep 2:24 PM) · upright leg SHOP-welded to the column side face (5 mm fillet down both sides and across the bottom; the heel top is left clear for the tie's 5 mm gap), flat leg under the tie · no holes through the column · 2 × 18 mm holes for the M16 bolts, 45 mm from the column face (30 mm to the toe), 60 mm apart", measure: "size" },
  tieBolts: { name: "Tie bolt", section: "M16 × 35 grade 8.8 HDG, put in ON SITE · down through the tie's bottom face into the seat angle's flat leg, 45 mm from the column face, 60 mm apart · head inside the tie (set through the open end before lifting), washer and nut under the angle", measure: "length" },
  tieCaps: { name: "Tie end cap", section: "Push-in plastic end cap, SHS 125×125×3 · keeps water and birds out of the tie · fitted on site after bolting", measure: "size" },
  verticals: { name: "Web vertical", section: "SHS 50×50×2.3", measure: "length" },
  wWebs: { name: "W web diagonal", section: "SHS 50×50×2.3", measure: "length" },
  purlins: { name: "Roof purlin", section: "AJIYA ASC 12516 C 127×51×15×1.6 · open side up the slope, facing inside · 6 m per bay, butt-jointed over each inner rafter; end pieces carry the 5 ft gable overhang", measure: "length" },
  cleats: { name: "Purlin bracket", section: "5 in bracket · 220 mm · B 63.5 · H 89 · 4 slots", measure: "size" },
  roof: {
    name: "Roof sheet",
    section: "Mega Rib 35 PUR 25 mm (metal-backed), rib sheet zincalume TCT 0.47 mm (option A, Tan 1 Oct 2026: the insulation is in the roof) · PU foam fills the ribs and runs 25 mm under the pans, flat metal backing underneath (confirm its thickness on the quote) · the last 5 in at the eave is bare sheet: close and seal the exposed foam edge there · 723 mm cover",
    measure: "length",
    lengthLabel: "Sheet run down the slope",
  },
  ceiling: { name: "Ceiling sheet", section: "Plain Mega Rib 35, zincalume TCT 0.35 mm, no foam (option A, Tan 1 Oct 2026) · ribs DOWN (crests at 4.000 m clear), pans up, 1 mm under the truss beams, screwed up to the cross purlins · seal the side laps, the joints to the lining tops and round the truss beams: the house runs under fan suction and leaks pull roof-space air in · a colour-coated underside is advised against ammonia and wash-down · not walkable, no roof-space walking access · 723 mm cover", measure: "size" },
  capping: { name: "Ridge cap", section: "24 in girth zincalume 0.47 mm · 8 ft pieces", measure: "length", lengthLabel: "Run" },
  sagRods: { name: "Purlin tie rod", section: "12 mm rod", measure: "length" },
  roofBraces: { name: "Roof X cable", section: "12 mm galvanized wire rope", measure: "length" },
  ceilingLong: { name: "Long ceiling purlin", section: "AJIYA ASC 12516 C 127×51×15×1.6", measure: "length" },
  ceilingBolts: { name: "Ceiling purlin bolt", section: "M10 bolt", measure: "length" },
  ceilingCross: { name: "Cross purlin", section: "Lipped C 100×50×15×1.2 G450 (lighter section, saving applied) · bottom flange ON the ceiling sheet's pans (1 mm under the column top) and its ends BEAR on the SHS column ties · hung from the 3 long purlins by L50 hanger angles (2 × M10 each end, Tan 7:25 PM; was a 27 mm gap with a notional packer) · 4 spans of ≈2.53 m · 2 × self-drilling screws through the flange into each tie", measure: "length" },
  ceilingHangers: { name: "Ceiling hanger", section: "L50×50×5 angle, shop cut and punched (no welding) · one at every cross/long purlin crossing · SITE: 2 × M10 grade 4.6 into the long purlin web (round holes) + 2 × M10 into the cross purlin web through 11 × 30 VERTICAL SLOTS in the hanger leg · set each cross purlin to a string line (±10 mm, about 10 mm high at the crossings to allow for the sag the sheet adds), tighten, then 2 × 12-14 × 20 self-drilling lock screws through the leg into the cross purlin web so it cannot slide down the slots · about 1 kN per hanger with no one on the ceiling; 2 lock screws ≈2.5–3 kN (rough, engineer to confirm)", measure: "length" },
  ceilingEdge: { name: "Ceiling edge angle", section: "Cold-formed galvanised angle 100×50×1.6 · flat leg on the SHS tie top (30 mm on the tie, upright leg there), 70 mm past the tie's inside face over the ceiling sheet's edge pan · cut to fit between the columns and the cross purlins (5 mm clear), 3 pieces per bay per side · SITE: self-drilling screws down into the tie at 300 mm, and up through the edge pan into the flat leg at 300 mm on a sealant bead, so the sheet edge is held and sealed all along both walls", measure: "length" },
  wallGirts: { name: "Wall girt", section: "AJIYA ASC 12520 C 127×51×15×2.0 · cut 5.865 m (5 mm clear of each column), web holes punched by the supplier · web on top, open side down, dropped onto shop-welded L75×75×6 brackets and bolted on site (2 × M12 each end) · bottom row raised 300 mm off the wall top, hung from the SHS tie by the midspan M12 rod (no support on the wall)", measure: "length" },
  girtCleats: { name: "Girt bracket", section: "Angle L75×75×6 × 80 mm (Tan, 30 Sep 2:24 PM) · upright leg SHOP-welded to the column side face, pointing down (5 mm fillet down both sides and across the bottom) · flat leg inside the C under the web, between the lips (80 mm vs about 94 mm clear) · 2 × 14×22 slots 45 mm from the column, 40 mm apart across the web", measure: "size" },
  girtBolts: { name: "Girt bolt", section: "M12 × 30 grade 4.6 HDG, put in ON SITE · down through the girt web and the bracket's flat leg (45 mm from the column, 40 mm apart), washer and nut underneath · girts are never welded", measure: "length" },
  girtRods: {
    name: "Girt tie rod",
    section: "M12 threaded rod · 2 lines per bay at the third points of the girt span, each line from the bottom girt through the middle girt up to the SHS 125 column tie, screwed into a coupling nut on an M12 stud welded under the tie · 25 mm in from the girts' outer flange · nuts both sides of each girt web",
    measure: "length",
  },
  girtRodStuds: {
    name: "Rod stud + coupling nut",
    section: "M12 × 40 bolt, grade 4.6 mild steel (weldable, not 8.8), in a 16 mm hole in the SHS tie's bottom wall, head against the underside, threads down · grind off zinc, weld all round to seal the hole, paint afterwards · M12 coupling nut joins the tie rod",
    measure: "size",
  },
  wallLining: { name: "Wall lining sheet", section: "Mega Rib 35 PUR 25 mm, RIB sheet zincalume TCT 0.40 mm (Tan 7:12 PM; backing unchanged, confirm the liner thickness on the quote) · ribs vertical · ribs in, metal-backed foam face out · 723 mm cover · foam the full length (no bare strip) · laps 50 mm (2 in) down over the concrete wall's inner face, 2 mm clear of it, joint at the wall top edge sealed · exposed foam at the foot sealed (PU/silicone bead) against wash-down water · no rib closure strips needed: the foam fills the ribs to the panel ends", measure: "length", lengthLabel: "Sheet length" },
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
  const wallTopIn = f.walls[1].yIn;
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
    girtLength: spec.bay - spec.column.side - 2 * spec.girt.endGap,
    girtRows,
    wallTopIn,
    girtPitch: girtPlan.pitch,
    tieUnder: girtPlan.tieUnder,
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
