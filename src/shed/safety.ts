/**
 * Safety review of the current model: for each item, the problem and the recommendation only (no change history).
 * Plain words for the owner. Each item has an id the 3D viewer uses to highlight the related members.
 */
import { girtCheck } from "./girtcheck";

const pct = (v: number) => Math.round(v * 100);

export type SafetyFocus =
  | "frameFixity"
  | "footings"
  | "concreteWall"
  | "midGirt"
  | "bottomGirt"
  | "sideBracing"
  | "tipPurlin"
  | "endFrames"
  | "connections"
  | "columnBars"
  | "ceilingCross"
  | "beamSplice"
  | "cutLength"
  | "overhangs"
  | "tieLighter"
  | "keepPurlins"
  | "solarZone"
  | "solarBays"
  | "solarRails"
  | "steelTotal"
  | "tieBeam"
  | "trusses"
  | "roofPurlins"
  | "roofBracing"
  | "ceilingSheet"
  | "purlinCut"
  | "noSiteWeld"
  | "shopConnections"
  | "kneeJoint"
  | "fireEarth";

export type SafetyItem = {
  id: SafetyFocus;
  title: string;
  /** Short figure shown as a tag: utilisation, cost or weight. */
  tag?: string;
  /** What is wrong or at risk. Left out for items that are only advice. */
  problem?: string;
  recommendation: string;
};

export type SafetySection = { id: string; title: string; tone: "danger" | "saving" | "solar" | "ok" | "note"; items: SafetyItem[] };

export const safetyBanner =
  "Preliminary hand checks, not an engineer's design. Percentages are rough; most are at about 0.8 kPa design wind (the MS 1553 site value for open farmland is about 0.57 kPa, which gives lower figures). A BEM-registered engineer must set the wind and design before building or buying.";

export const safetySections: SafetySection[] = [
  {
    id: "gaps",
    title: "1 · Problems to fix (most important first)",
    tone: "danger",
    items: [
      {
        id: "frameFixity",
        title: "Column bases are only partly fixed",
        tag: "columns ≈100–140%",
        problem:
          "Wind across the house is carried only by the frames bending, which needs each column base held fixed (about 20–30 kNm). On the windward side the 609 mm pad on its 4 ft base is being lifted, so it can resist only about 8–15 kNm before it tips. The SHS 125×4.5 columns then reach about 100% at 0.57 kPa and about 140% at 0.8 kPa, the eave sways about 75–105 mm, and the knee and the truss heel are overloaded. The 4 in slab and the 125 mm wall cannot fix the bases.",
        recommendation:
          "A reinforced ground beam across every frame (about RM 20–30k) joining its two pads, about 300 × 450 mm with 3 Y12 top and bottom and R8 links, bars anchored into the pads. Columns then about 86% at 0.57 kPa, sway about 33 mm, and the knee moment halves. With it, upgrade the base to carry the fixed-base moment: 20 mm base plates, M20 grade 8.8 (or M24) anchor bolts, and hairpin bars round the anchors tied into the ground-beam bars (plain concrete round two bolts holds only about 63–90 kN against 127–185 kN needed), about RM 3.5–5.5k. If the engineer adopts about 0.8 kPa, use SHS 125×6 columns too (same outside size, so no other detail changes; about +0.8 t). Engineer to design and sign off.",
      },
      {
        id: "trusses",
        title: "Truss: no diagonals between each column and the quarter point",
        tag: "verticals ≈114–210%",
        problem:
          "From each column to the quarter point (about 2.5 m) the truss has only two short SHS 50 verticals and no diagonals, so that part works by bending. The vertical nearest each column reaches about 114% under roof load and about 165% under wind uplift, and its weld to the 3 mm chord is weaker than the vertical. With solar the verticals reach about 150–210% and the chords next to the heel about 100%.",
        recommendation:
          "Add 3 SHS 50×50×2.3 diagonals each side (rafter at the quarter point down to the beam at the first vertical, then on to the second vertical, then to just inside the fork), about 19 kg per truss. Every truss member then works at about 50–90%. On the standing shed, add them before any solar, bolted, or welded only with the panels below protected and a fire watch. Engineer to sign off.",
      },
      {
        id: "kneeJoint",
        title: "Truss-to-column knee: fins too thin, bolts carry more than assumed",
        tag: "fins ≈114%",
        problem:
          "The knee is a fork: a 12 mm cap plate on the column and two 12 mm fins, 54 mm apart, with 4 × M20 × 110 grade 8.8 preloaded bolts through the truss heel. The cap is OK (about 76%), but the fins are below the 14 mm minimum: fin base about 114% (elastic) and too slender (225 mm tall, height/thickness about 19 against about 13). The bolts carry the truss thrust as well as the frame moment, about 60–110 kN each.",
        recommendation:
          "Add 4 edge gussets per knee, 6 × 30 × 150 mm, welded to the outside of the fins and to the cap over the column walls, or use 16 mm fins (about 85%). Design the bolts, the bored sleeves in the heel and the 3 mm RHS walls for about 110 kN per bolt; preload them, blast the faying faces, keep 1 mm hole clearance. This joint carries the frame moment: the engineer must design and sign it off.",
      },
      {
        id: "connections",
        title: "Truss heel and ceiling-beam splice",
        tag: "13 mm clash",
        problem:
          "At each heel the rafter's underside cuts 12.9 mm into the end of the ceiling beam, and inside the fork the gap opens to 25 mm, so there is no seat to weld the rafter to the beam. The rafter thrust (about 64 kN, about 100 kN at design load with solar) then has to pass through the fork bolts. The ceiling beam is also spliced in its tension zone (a 6 m bar and a 4.25 m bar).",
        recommendation:
          "Bevel the beam end so the rafter sits on it and weld the heel full-strength in the shop (coded welder, inspected before painting), or add a heel gusset inside the fins, and design the fork as the heel joint (see the knee). Cut each ceiling beam from one 12 m bar so there is no splice (same steel, about RM 1.5–2.5k less work). Engineer to sign off.",
      },
      {
        id: "sideBracing",
        title: "No side-wall bracing",
        tag: "≈RM 1.5–2.5k",
        problem:
          "Wind on the end walls and the roof bracing push along the house, and nothing takes that to the ground along the sides except the columns bending (about 10% more on columns that are already the weak point).",
        recommendation:
          "M16 tension-rod X with turnbuckles in bays 1 and 17 on both sides, under the roof-braced end bays, on the outside face clear of the girts, from the wall top to the eave (about 3.2 m high), with shop-welded end plates on the columns. Engineer to design.",
      },
      {
        id: "midGirt",
        title: "Middle and top wall girts overloaded in inward wind",
        tag: `≈${pct(girtCheck.rows[1].cases[1].bending)}–${pct(girtCheck.rows[1].cases[0].bending)}%`,
        problem: `The ASC 12516 middle and top girts (3 girts, ${(girtCheck.span).toFixed(3)} m span) each carry about ${girtCheck.rows[1].tributary.toFixed(2)} m of wall. Rough code check, flange braced only at the midspan rod (${girtCheck.bracedLength.toFixed(2)} m): bending ${pct(girtCheck.rows[1].cases[1].bending)}% at 0.57 kPa and ${pct(girtCheck.rows[1].cases[0].bending)}% at 0.8 kPa; deflection ${pct(girtCheck.rows[1].cases[1].deflection)}% / ${pct(girtCheck.rows[1].cases[0].deflection)}% of L/150. Yield alone would be ${pct(girtCheck.rows[1].cases[0].yieldOnly)}% at 0.8 kPa, so the failure is flange buckling and deflection. C125/ASC 12516 1.6 FAILS these two rows.`,
        recommendation:
          "Add rods at the third points of the span, or use a deeper or thicker C for these two rows (not re-computed here), or bring the girt pitch down. Engineer to size. Use grade 4.6 studs under the tie, zinc ground off before welding, painted after.",
      },
      {
        id: "bottomGirt",
        title: "Bottom wall girt in inward wind",
        tag: `≈${pct(girtCheck.rows[0].cases[1].bending)}–${pct(girtCheck.rows[0].cases[0].bending)}%`,
        problem: `The ASC 12516 bottom girt (4 in above the wall top) carries about ${girtCheck.rows[0].tributary.toFixed(2)} m of wall, with the wall top and the middle girt as supports. Rough code check: bending ${pct(girtCheck.rows[0].cases[1].bending)}% at 0.57 kPa and ${pct(girtCheck.rows[0].cases[0].bending)}% at 0.8 kPa; deflection ${pct(girtCheck.rows[0].cases[1].deflection)}% / ${pct(girtCheck.rows[0].cases[0].deflection)}% of L/150. This row passes.`,
        recommendation: "No change needed on this row from the rough check; engineer to confirm.",
      },
      {
        id: "endFrames",
        title: "End walls are not designed",
        tag: "engineer",
        problem:
          "There is no end-wall framing: the front (doors, pads) and the back (the fan wall) need posts, girts and frames round the fan and pad openings, and their wind must reach the roof bracing. The side-wall pad openings change the side walls in those bays too. The end-frame ceiling beams have no ceiling-purlin bolts holding them sideways, so they can buckle under uplift.",
        recommendation:
          "The engineer designs both end walls and the pad and fan openings (including the fan weights and a path for the end-wall wind into the roof bracing), and adds about 3 bolts or cleats per end frame to hold the end ceiling beam.",
      },
      {
        id: "ceilingSheet",
        title: "Ceiling sheet and long ceiling purlins",
        tag: "sag ≈18 mm",
        problem:
          "The long ceiling purlins (ASC 12516, 6 m simple spans) sag about 18 mm under the ceiling's own weight. The 0.35 plain ceiling sheet spans about 2 m, and the house runs under fan suction, so any gaps pull roof-space air in. The ceiling is not built for foot traffic.",
        recommendation:
          "Lap the long ceiling purlins over the frames (or use C 150) to cut the sag. Use the slotted hangers to set each cross purlin to a string line, about 10 mm high at the long purlins for the sag the sheet adds, then lock them with the 2 screws per hanger. Screw the sheet's edge pans up into the edge angles on the ties, on a sealant bead, all along both walls. Confirm the 0.35 TCT span at 2 m in the AJIYA table (rough check about 25–65%) and screw every pan. Seal the side laps, the joints to the lining tops and round the truss beams. A colour-coated underside is advised against ammonia and wash-down. Keep the eave and gable netting open. No one walks on the ceiling.",
      },
      {
        id: "concreteWall",
        title: "Concrete wall, floor drainage and column bases",
        tag: "site welds · drains",
        problem:
          "The wall's horizontal Y10 bars are welded to the columns on site (about 200 site welds), and its vertical bars end straight in the soil under the 4 in slab (about 25% anchorage, rust path). The floor falls to the wall line with no outlets, so wash-down water pools exactly where the columns and their buried base plates are.",
        recommendation:
          "Give the vertical bars a 150–200 mm foot along the slab, tied to the mesh. Either leave the wall unconnected to the columns (it stands on the slab by itself; seal the joint at each column) or lap its bars to short Y10 stubs shop-welded to the columns. Add an outlet through the wall at floor level in every bay, or a drain channel. Coat or galvanise each column from 300 mm below to 300 mm above the floor and seal the column, wall and floor joints; C30 concrete, cured well, a cove at the floor.",
      },
      {
        id: "footings",
        title: "Soil untested; buried base plates",
        tag: "soil test",
        problem:
          "Bearing (about 23–26 kPa on the 4 ft bases) and uplift (about 61–71%) are fine on the assumed 100 kPa soil, but the soil has not been tested, and the base plates are buried in the slab, so their nuts cannot be re-tightened later.",
        recommendation:
          "A simple soil bearing test (for example a JKR/Mackintosh probe) at a few pad positions. Level, grout and tighten every base plate before the slab is poured (or leave a pocket at each plate). Lay a plastic sheet (DPM) under the slab. With ground beams in place and a good soil test, the 4 ft pad bases can probably be left out (about RM 4.5–5.5k less).",
      },
      {
        id: "fireEarth",
        title: "Fire and lightning",
        tag: "PU · lightning",
        problem:
          "The roof panel and the wall lining have PU foam cores, and the house has many fans, pumps, motors and control panels. Malaysia's lightning density is very high, and base plates buried in concrete are not a dependable earth.",
        recommendation:
          "Fire-retardant PU or PIR panels; cables in conduit, clear of the foam; no welding or grinding near the panels (this matters most for repairs on the standing shed); smoke or heat detection at the control panels. Bond the steel frame and the roof to earth rods at intervals along both sides, and fit surge protection on the control panels.",
      },
    ],
  },
  {
    id: "savings",
    title: "2 · Savings",
    tone: "saving",
    items: [
      {
        id: "columnBars",
        title: "Columns from 12.6 m bars",
        tag: "≈RM 5.5–6.6k",
        problem:
          "Each column is about 4.18 m of SHS 125×4.5, so 3 do not fit in a 12 m bar and the order is one 6 m bar per column (about 1.1 t of offcuts).",
        recommendation: "Ask the supplier for 12.6 m lengths; 3 columns per bar brings the saving back.",
      },
      {
        id: "cutLength",
        title: "C sections ordered cut to length",
        tag: "≈RM 300",
        recommendation:
          "Order the girts cut at 5.865 m (5 mm clear of each column, web holes punched by the supplier) and the other C sections at their exact lengths instead of 6 m bars.",
      },
      {
        id: "overhangs",
        title: "Shorter gable overhang",
        tag: "≈RM 1.5–2k",
        problem: "The 5 ft gable overhang sits in the worst wind corner.",
        recommendation:
          "Cut it to about 0.6 m: saves panel and purlin and removes the worst uplift zone, at the cost of some shade and rain cover at the ends. Engineer to confirm.",
      },
      {
        id: "tieLighter",
        title: "Column tie could be lighter",
        tag: "RM 2–2.9k",
        problem: "The SHS 125×125×3.0 tie works at only about 35–36%.",
        recommendation:
          "Decide after the side bracing is designed (it sets the tie's force as eave strut); a lighter section may lose the flush outside face for the netting.",
      },
      {
        id: "keepPurlins",
        title: "Keep 7 roof purlin lines per side",
        recommendation: "Six lines would save about 0.67 t, but with solar coming it is not worth the risk.",
      },
    ],
  },
  {
    id: "solar",
    title: "3 · Solar (future 60 kW)",
    tone: "solar",
    items: [
      {
        id: "solarZone",
        title: "Where panels can go",
        problem: "Wind suction is highest at the gable overhangs, the end bays and along each eave edge.",
        recommendation:
          "Panels only in bays 2–16, clear of the eaves. No panels on the gable overhangs, the first ~1 m of bays 1 and 17, or a ~2.4 m strip along each eave edge. About 104 panels / 270 m² fit in bays 2–16 on one slope.",
      },
      {
        id: "solarBays",
        title: "Before adding solar",
        problem: "Solar adds about 0.15 kPa on every bay.",
        recommendation:
          "Add the truss diagonals first (see the truss item); with them the trusses work at about 66% and the purlins at about 53–62%.",
      },
      {
        id: "solarRails",
        title: "Fix rails into the purlins",
        recommendation:
          "Screw the panel rails through to the purlins, not just the sheet, spread over the purlin lines. The engineer should check the case of panels on one slope only.",
      },
    ],
  },
  {
    id: "ok",
    title: "4 · Checked, OK (with conditions)",
    tone: "ok",
    items: [
      {
        id: "tipPurlin",
        title: "Eave-edge purlins",
        tag: "≈50–75%",
        recommendation:
          "If the engineer's wind is about 0.8 kPa or more, use ASC 12520 (2.0 mm) for the tip line (about RM 1k). Fix the eave sheets at every rib on both eave purlins, closer at the corners.",
      },
      {
        id: "roofPurlins",
        title: "Roof purlins",
        tag: "≈53–62%",
        problem: "They sag about 34 mm (span/180) under dead + live or dead + solar.",
        recommendation:
          "Screw the solar rails to every purlin. Keep both sag-rod rows in every bay and use the supplier's screw pattern, closer at the edges.",
      },
      {
        id: "purlinCut",
        title: "Roof purlin cut plan",
        tag: "6 m spans",
        recommendation:
          "Confirm the end-piece length: 7.524 m puts the gable overhang 5 ft past the end rafter's centre, 7.546 m past its outside face.",
      },
      {
        id: "tieBeam",
        title: "SHS 125×3 column tie",
        tag: "≈36%",
        recommendation: "Fix each ceiling cross purlin end to the tie with a small cleat or screws so it cannot slide off.",
      },
      {
        id: "shopConnections",
        title: "Tie and girt connections",
        tag: "≈66%",
        recommendation: "The engineer must confirm the eave-strut force once the side bracing is designed.",
      },
      {
        id: "roofBracing",
        title: "Roof X cables, bays 1, 6, 12 and 17",
        tag: "≈35%",
        problem: "Slack cables do nothing, and the roof bracing needs the side-wall bracing to reach the ground.",
        recommendation:
          "Proper end fittings (eye plates welded to the rafters in the shop) and turnbuckles, tensioned after the roof steel is square. Add the side-wall bracing.",
      },
      {
        id: "ceilingCross",
        title: "Ceiling cross purlins C 100×50×15×1.2",
        tag: "≈71–85%",
        recommendation: "Do not hang heavy fans or pipes from them without a check.",
      },
    ],
  },
];
