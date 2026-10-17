/**
 * Safety / savings / solar notes from the preliminary design review (hand checks, 28 Sep 2026; full fresh pass 7:54 PM against the current model).
 * Plain words for the owner. Each item has an id the 3D viewer uses to highlight the related members.
 */
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
  | "kneeJoint";

export type SafetyItem = {
  id: SafetyFocus;
  title: string;
  /** Short figure shown as a tag: utilisation, cost or weight. */
  tag?: string;
  body: string;
  /** What the highlight shows in the model. */
  shows: string;
  engineer?: boolean;
  /** Set when the owner has applied a fix; the item stays listed with what is still open. */
  status?: string;
};

export type SafetySection = { id: string; title: string; tone: "danger" | "saving" | "solar" | "ok" | "note"; items: SafetyItem[] };

export const safetyBanner =
  "Preliminary hand checks, not an engineer's design. Confirm with a structural engineer before building or buying.";

export const safetySections: SafetySection[] = [
  {
    id: "gaps",
    title: "1 · Safety gaps (most important first)",
    tone: "danger",
    items: [
      {
        id: "frameFixity",
        title: "Frames sideways: the column bases are only partly fixed",
        status: "OPEN on the hand check · bases only ≈40–60% fixed · Tan (1 Oct 2026): the same design with no solar has stood and operated for 2 years",
        tag: "OPEN · columns ≈115–140%",
        body:
          "Tan removed the strip footing (29 Sep 4:22 PM), then added a 4 ft × 4 ft × 4 in reinforced base under each pad (4:32 PM). Tan (1 Oct 2026): a shed of this design with no solar panels has been standing and operating for 2 years, so everyday load and the storms of those years have already been carried. That proof belongs to the details that were built. It does not cover a design-level wind, and it does not cover solar (columns about 125–150%, heel about 80 kN). The hand check below is still the code-level picture, and it remains the biggest item on paper. Wind across the shed is carried only by the frames: the columns bend like upside-down L's, and the column check needs each base fixed, about 19 kNm per base. The 1.22 m base helps: on the windward column (lifted by up to 15.6 kN) the pad, base, slab over it and its share of wall leave about 13 kN pressing down, so it can take about 8 kNm before it starts to rock, about 15 kNm if the compacted soil over the base's ledge is counted; the leeward column (pressed down) can take about 25 kNm. Its rotational stiffness on compacted soil (assumed 20 MN/m³) is only about 2 times the column's. So the bases are about 40–60% fixed, not fixed. Columns SHS 125×4.5: about 115–140% with this partial fixity (about 125–150% with solar); fully pinned it would be about 170–190%; fixed about 89–94%. The truss heel also takes more of the frame moment. The 4 in slab is too thin to help, and the concrete wall cannot be relied on (cold joint, short straight bars into the slab, 125 mm thin). Cheapest fixes (preliminary, rough cost including excavation, rebar and concrete): (1) a reinforced ground beam across each frame joining its two pads, about 300 × 450 mm under the slab, 3 Y16 top and bottom, R10 links: 18 beams, about 23 m³ and about 2.7 t of rebar, about RM 20–30k; about 12 times stiffer than the column, so the bases act about 90% fixed (columns about 90–95%). Recommended. (2) Enlarge the new pad bases to about 1.5 × 1.5 m × 250 mm with Y12 at 150 mm each way (A10 is too light for that) and count the compacted soil over them: rocking safety factor about 1.6, bases about 80% fixed, columns about 95–105%, borderline; about 15 m³ more concrete, about RM 10–15k. (3) Put the strip footing back (about 86 m³ plus 3.2 t rebar): works but costs the most. Not enough on their own: heavier columns (SHS 125×6.0 about 100–115% with this fixity; SHS 150×150×6.0 about 70–80%, about 1.5 t more steel, about RM 9k, but the heel welds get worse and the frames sway more); knee braces (help the heel, not the column base); relying on the wall.",
        shows: "Columns, pads and their 4 ft bases, and the concrete wall (X-ray)",
        engineer: true,
      },
      {
        id: "sideBracing",
        title: "Side-wall X bracing is missing",
        status: "OPEN · not modelled",
        tag: "M16 rod ≈26% · ≈RM 1.5–2.5k",
        body:
          "Still not in the model. Wind on the end walls and the roof X bracing push along the shed, and nothing takes that down to the ground along the sides except the columns bending sideways. Cheapest form: M16 tension rods with turnbuckles (about 26% used) or flat strap X in bays 1 and 17 on both sides, right under the roof-braced end bays, on the outside face clear of the girts. The concrete wall braces everything below its top, so the X only runs from the wall top (about 0.9 m) to the eave, about 3.2 m high (the columns are now 87 mm taller). About RM 1.5–2.5k. Leaving it out and letting the columns stand as posts from the wall pushes them up by about 10% on top of the frame-fixity problem; keep the X.",
        shows: "Proposed X in bays 1 and 17, above the wall (ghost outline, not designed)",
        engineer: true,
      },
      {
        id: "midGirt",
        title: "Middle wall girt in inward wind",
        status: "OPEN · changed: option B dropped, reverted to ASC 12516 (Tan, 7:43 PM); one M12 rod at midspan up to the SHS tie (welded stud + coupler) · brace is real, girt still over",
        tag: "OPEN ≈145–200% (≈103–141% at site wind)",
        body:
          "The M12 rod at midspan now runs from the bottom girt through the middle girt up to the SHS 125 tie, screwed into a coupling nut on an M12 bolt welded under the tie. That makes it a real brace: whichever way the girt twists, one part of the rod is pulled (upward it leans on the bottom girt, which since the girt support was removed has nothing under it, so that direction is only partly braced), and the tie is stiff enough (about 170 N/mm at midspan against about 50 N/mm needed). But the 140–195% I gave before already assumed a working midspan brace; before this fix the true figure was worse. So the girt still works at about 145–160% with the lining's help and up to about 200% without it (about 103–141% at the site wind of 0.57 kPa); the columns went up 87 mm for the 4.000 m ceiling (Tan, 9:02 PM), which adds about 44 mm to the wall this girt carries, about 3% more. Sag: the rod now hangs both girts from the tie, under 2 mm. Wind deflection about 31 mm (span/190), OK. Top connection: rod pull about 1.2 kN (girt weight plus bracing force) against about 27 kN for the rod and about 29 kN for a 3 mm weld all round the bolt head (both about 4–5%); the 3 mm tie wall bending locally about 60% by a rough, cautious check (punching about 4%). Use a grade 4.6 mild steel bolt, not 8.8; grind off the zinc before welding; weld all round to seal the hole; paint afterwards. Added bending on the tie about 1.8 kNm, about 10%, so the tie goes from about 25% to about 35%. What would fix it (checked, not applied): middle row C150×65×2.0 with this one rod (about 72%); C150×65×1.6 with rods at the third points (about 70–80%); LYSAGHT C15015 (152×64×1.5) with rods at the third points (about 83–90%). More rods on the ASC 12516 alone (third points about 133%) is not enough.",
        shows: "Middle girt row, the midspan tie rods and their welded studs under the tie",
        engineer: true,
      },
      {
        id: "tipPurlin",
        title: "Eave-edge purlins on uplift",
        status: "OPEN · re-checked with Tan's 6 m cut plan",
        tag: "OPEN ≈84–115% · fix ≈RM 1k",
        body:
          "The purlin near the rafter tip gets edge-zone suction plus wind pushing up under the eave overhang. Re-checked for Tan's cut plan (6 m pieces, simple spans, which is what this check always assumed): about 84–115% in every inner bay, so the ASC 12516 tip line is still over. In the end bays the 5 ft overhang on the long end piece actually helps (it lifts the other way at the end rafter): about 70–95% in the span, overhang root about 30–45%. The column-line purlin is about 55–82%: OK. Cheapest fix: ASC 12520 (2.0 mm) for the tip line on both slopes, same cut plan (34 × 6 m + 4 end pieces), about 160 kg more, about RM 1k; it brings the tip line to about 69–94%. Do both eave lines (tip and column line, about RM 2k) if the engineer's wind is higher. A sleeve over the rafters would also help but is harder to detail than simply buying the 2.0 mm purlin.",
        shows: "The 2 eave-edge purlin lines each side",
        engineer: true,
      },
      {
        id: "bottomGirt",
        title: "Bottom wall girt, no support under it",
        status: "OPEN · changed: girt support removed (Tan, 7:50 PM); ASC 12516 hung from the tie by the midspan M12 rod",
        tag: "OPEN ≈110–150% (≈78–108% at site wind)",
        body:
          "Heights: the concrete wall top is 914 mm above the floor (inside edge); the girt's underside is 1.216 m and its top 1.267 m above the floor. With the girt support gone, nothing on the wall holds the girt: it spans the full 5.875 m between columns and carries about 1.06 m of wall (from halfway up to the middle girt down to the lining's foot, which only laps the wall and is not fixed to it). Wind pushing in (free outside flange squeezed, midspan rod as a brace): about 110–150% (about 110% with the lining's help, about 150% without; about 78–108% at the site wind of 0.57 kPa). Wind pulling out (lining side squeezed, held by the lining screws): about 60–65%. Wind deflection about 24 mm (span/245), OK. Sag: the midspan rod hangs it from the SHS tie, under 2 mm, so sag is covered. Fix options (checked, not applied): a concrete support cast with the wall at midspan, with one Y10 U-bar and the girt bolted to it with a small angle cleat (about 26–36%); C150×65×2.0 for this row (about 56%); C150×65×1.6 with the midspan rod (about 83%). Screwing the lining's 50 mm skirt to the wall face on its own (about 75–105%), or more rods on the ASC 12516, is not enough.",
        shows: "Bottom girt row and the midspan tie rods",
        engineer: true,
      },
      {
        id: "noSiteWeld",
        title: "No site welding: the wall bars are still welded on site",
        status: "OPEN · Tan (30 Sep 2026): no welding on site, shop welding OK · ties, girts and the truss-to-column knee done; the wall bars not changed yet",
        tag: "OPEN · 1 item",
        body:
          "Tan's rule from 30 Sep: no welding on site; welding in the fabricator's shop is fine. The column ties, the wall girts and the truss-to-column knee now follow it (see 'Tie and girt connections' under Checked, and 'Truss-to-column knee' above). One joint in the model still needs site welding and is not changed yet: the wall's Y10 horizontal bars are welded to the column sides before the wall pour, 3 bars each side of each column, about 200 site welds. A possible fix, not applied: short Y10 stubs (weldable grade) welded to the columns in the shop, with the wall bars lap-tied to them on site. Everything else welded in the model is shop work: the truss heels and splice, the knee cap plates, fins and heel doublers, the purlin brackets and cable eye plates on the rafters, the base plates on the columns, and the M12 rod studs under the ties.",
        shows: "Wall rebar (X-ray)",
        engineer: true,
      },
      {
        id: "kneeJoint",
        title: "Truss-to-column knee: OPTION 2 fork joint (Tan) · FAILING with 6 mm cap and fins",
        status: "FAILING as modelled: Tan (30 Sep 2:28 PM) set the cap and fins to 6 mm; the fin base is about 227% and the cap about 151%. Fix before fabrication (16 mm fins + a 10 mm cap, or add gussets). ENGINEER MUST DESIGN: it carries the frame moment",
        tag: "FAILING: 6 mm fin base ≈227% · 6 mm cap ≈151% · bolts ≈37%",
        body:
          "FAILING AS MODELLED (Tan, 30 Sep 2:28 PM: cap and fins 6 mm). Rough checks at 6 mm: fin base in bending about 227% (elastic; 151% even if fully plastic), and a 6 mm fin 225 mm tall is far too slender (it would buckle at its compressed end: height/thickness 37.5, the limit is about 13); the cap spreads each fin's pull of about 87 kN into only about 36 mm of the 4.5 mm column wall, about 151%; the cap bending under uplift about 72%; fin bearing from the M20 bolts about 70% (the inner bolts are 30 mm from the fin end); the fin-to-cap weld is no stronger than the fin, so it fails with it; the cap-to-column full-penetration weld about 83%. SMALLEST FIXES: (1) keep the 6 mm cap and fins and add 4 vertical gussets 6 × 30 × 150 mm per knee, welded to the outside of each fin and to the cap, right over the column's outside and inside walls: fin base about 100% elastic / 80% plastic (at the limit, engineer to decide), cap spread about 87%, and the gussets stop the buckling; (2) two 6 mm fins side by side (12 mm) plus the same gussets: about 76%; (3) on their own, without gussets: fins 16 mm (14 mm is the minimum, about 97%) and a cap of at least 10 mm with 16 mm fins (12 mm with thinner fins), about 85–87%. With 6 mm fins the bolts are M20 × 100 (grip 66 mm). Tan chose OPTION 2, FLUSH layout, 54 mm fork with NO heel doublers (30 Sep 12:28 PM; drawings 132 and 133). ENGINEER MUST APPROVE: without doublers the 3 mm RHS walls take the bolt loads, so the margins are smaller than with doublers. SHOP: a 6 mm cap plate (Tan, 2:28 PM), 128 × 128, 1.5 mm over the 125 SHS all round (a small ledge that also takes a fillet over the full-penetration weld to the column top); 3.5 mm clear of the tie ends and 1.5 mm inside the eave netting. Two vertical fins, 215 × 225 × 6 mm (Tan, 2:28 PM), full-penetration welded upright on the cap, 54 mm clear apart: RHS 50 + a 2 mm steel shim each side. Their outer ends are FLUSH with the column's outside face; inside they run 90 mm past the column's inner face, above the ceiling sheet (1 mm clear); the lining stops under the ceiling, and the ceiling purlins are at the quarter points across and 2 m / 4 m from the frames, so there is no clash. On the heel, at each bolt, a bored sleeve OD 42.4 × 21 mm bore × 50 goes through 43 mm holes in both RHS walls and is welded all round on both faces in the shop, ends flush: the bolt bears on the sleeve (a standard CHS 42.4×5 has a 32.4 mm bore, which would leave about 6 mm of play, so it must be the bored sleeve), and the preload clamps through it (about 129 MPa; without it the 3 mm walls would fold in). SITE: the truss drops between the fins with a blasted 2 mm shim each side (measure each heel, add 1 mm shims to fill; a fin cannot be pulled in: at 6 mm it bends for good at its base after about 0.6 mm at the lower row), then 4 × M20 × 100 grade 8.8 bolts (grip 66 mm) go horizontally through fins, shims, walls and sleeves in a 120 × 125 group: the outer bolts are 65 mm in from the column's outside face (2.5 mm inside the column centre), the inner ones 122.5 mm inside it; lower row in the beam, upper row in the rafter. The column steel stops 6 mm lower, so the truss seat, the tie, the lining and the 4.000 m floor-to-ceiling height do not change. Rough checks (design knee moment about 20 kNm, uplift 16 kN, shear 10 kN; the group is now 62.5 mm off the column axis, so it sees about 22 kNm): worst bolt about 69 kN, about 37% in double shear. Outer lower bolt at the beam end (65 mm): sleeve bearing on the 3 mm walls about 62%, shear-out of the wall about 66%, sleeve welds (3 mm all round) about 53%; as a bolt straight on the wall it would be about 67%. Fin base about 227% at 6 mm (it was about 85% with 16 mm fins): FAILS. SLIP: preloaded bolts (part-turn or load-indicating washers) in 21 mm holes (1 mm clearance), faying faces blasted bare (the fins, the shims and the RHS walls; not painted or galvanised there). Slip resistance about 44–66 kN per bolt (μ 0.2–0.3) against about 69 kN at the full design moment, about 104–157%: it holds in service but will probably slip at ultimate load, a little worse than before. If it slips, the 1 mm holes let the frame top move about 50 mm before the bolts bear; reamed fitted bolts (0.3 mm) would bring that to about 15 mm, or M24 bolts would add slip margin. Clashes checked: the T2 tie angles and bolts are under the tie, about 125 mm lower; the tie top is flush with the cap top; the purlins, the ceiling purlins and the netting are clear. Every open truss RHS end has a 3 mm seal-welded end cover plate (rafter eave tips and beam ends; the beam-end plate is flush with the column's outside face between the fins). In all: 36 caps, 72 fins, 72 shims, 144 bored sleeves, 144 preloaded M20 × 100 bolts; at 6 mm about 0.37 t and about RM 5.1–7.8k (rough), about 330 kg and RM 2.9–3.8k less than with 16 mm plates, but it fails; the gussets of fix (1) add 144 × 0.21 kg (about 30 kg, about RM 1.4–2.2k). This joint carries the frame moment (if it acts as a hinge, the columns go to about 170–190%), so a BEM-registered engineer must design and sign it off, including the thin-wall bearing, the sleeve welds, the preload method, the shims and the slip check.",
        shows: "Knee cap plates, fins, fork shims and knee bolts at every column top",
        engineer: true,
      },
      {
        id: "connections",
        title: "Truss heel welds and beam splices",
        status: "OPEN · detail and inspection · weld in the shop only (no site welding); the truss-to-column knee is the OPTION 2 fork joint (see above)",
        tag: "64 kN (80 kN with solar)",
        body:
          "Where each rafter meets the ceiling beam at the column, and at the beam splice, about 64 kN (about 80 kN with solar) passes through. They need full-strength welds, designed and inspected (butt or full-size fillet welds by a coded welder, checked before painting). Cheapest way to lose the splice risk: order the ceiling beam as one 12 m bar (see Savings).",
        shows: "Truss heels (both ends of every frame) and beam splices",
        engineer: true,
      },
      {
        id: "endFrames",
        title: "End frames and end walls",
        status: "OPEN · trivial cost for the bolts; end-wall framing not modelled",
        tag: "≈3 bolts per end frame",
        body:
          "The end-frame ceiling beam has no ceiling-purlin bolts holding it sideways, so it can buckle when wind lifts the roof: add about 3 bolts or cleats per end frame (trivial cost). Wind on the end wall also needs its own posts or framing; the model has none.",
        shows: "End-frame ceiling beams and the end-wall openings",
        engineer: true,
      },
      {
        id: "concreteWall",
        title: "Concrete side wall: bars into the slab, cover, mesh welds",
        status: "OPEN (minor) · the Y10 bars welded to the columns are site welds, still open under the no-site-weld rule (see 'No site welding') · Tan's change (29 Sep 4:27 PM): no starter bars, the wall verticals run straight down 6 in (152 mm) below the floor top · short anchorage, bottom 52 mm in soil",
        tag: "22.2 m³ · anchorage ≈25%",
        body:
          "Cast after the floor has cured, standing on the slab. Tan (4:27 PM): no starter bars; the wall's vertical Y10 bars (19 per bay, 646 in all) run straight down 6 in (152 mm) below the finished floor top. The slab is only 4 in (about 102 mm) thick and sits on compacted soil with no blinding (Tan, 4:28–4:30 PM), so the bottom 52 mm of every bar ends in the soil: it gives no grip there and will rust. Only about 100 mm is in concrete, about 25% of a Y10's full tension anchorage (about 400 mm; 152 mm would have been about 38%). That is fine for dowels that locate the wall and stop it sliding, but weak against pull-out, so the wall must not be counted on to hold down or clamp the columns; the welded horizontal bars to the columns carry the wall against wind and overturning. Holding them in place: because the slab is poured first, the verticals have to be set before that pour, tied to the A10 mesh at the wall line and held by a timber template or string line (their tops left sticking up about 0.87 m above the floor for the wall pour); do not drill the 4 in holes. Cheapest better detail (preliminary): stop the bars 40–50 mm above the slab underside and bend a 150–200 mm foot along the slab, tied to the mesh (all in concrete, no rust path, about twice the grip); or cast a small thickening (about 150 × 150 mm) under the wall line so the straight 152 mm is fully in concrete. If bars are missed at the pour, drill 12 mm holes and resin-anchor short bars about 100 mm deep instead of the 4 in holes. Treat the wall-floor joint as a cold joint: roughen the slab under the wall and seal the inside edge, or add a water bar. Modelled 125 mm thick, flush with both column faces, 914 mm (36 in) above the floor on the inside edge, falling to 864 mm outside; about 22.2 m³, rebar about 769 kg including the 6 in below the floor (laps extra). Cover: the single mesh in the middle gives about 57 mm each side, more than the 40–50 mm usually asked for wet animal houses, so cover is fine. Use C30 or better with a low water content, cure it well, seal the joint where the steel columns go into the concrete and paint or galvanise them there (the wet line at the wall top and floor is where they would rust first), and make a cove at the floor. One central layer gives weaker crack control at both faces, so expect some fine cracks. Mesh welds: 3 bars each side of each column; the job is small (about 16 kN uplift, a few kN sideways) and each well-welded Y10 is good for well over 10 kN, so it is adequate if the bars are a weldable grade and welded with about 50 mm fillet runs to the column side, not tack-welded end on. Bracing: the wall braces the columns up to its top, so the side X bracing in bays 1 and 17 only needs to run from the wall top to the eave. Column fixity: see the first safety gap; the wall is what holds the frames sideways as modelled, so the engineer must design it (and its missing strip footing) for that. Wall top: no flashing (Tan); the sloped concrete cap sheds water, the lining laps 50 mm (2 in) down over the wall's inner face, 2 mm clear, with that joint sealed at the wall top edge; its exposed foam edge is sealed with PU/silicone or a small trim, and no rib closure strips are needed (Tan, 29 Sep 4:34–4:37 PM): the PU foam fills the ribs right to the panel ends, so there are no open rib voids; just keep the exposed foam edge at the foot sealed with a PU/silicone bead against wash-down water.",
        shows: "Wall rebar mesh (X-ray through the wall)",
        engineer: true,
      },
      {
        id: "footings",
        title: "Pads, 4 ft pad bases, anchor bolts, buried base plates",
        status: "OK for bearing and uplift · soil tested 97 kPa allowable (Tan, 1 Oct 2026) · strip removed 4:22 PM, 4 ft pad bases 4:32 PM, compacted soil 4:30 PM, Y12 pad cage 5:18 PM",
        tag: "bearing ≈24–27% of 97 kPa · edge ≈46–57% · uplift ≈61–71%",
        body:
          "No strip footing (Tan, 29 Sep 4:22 PM). Each column now has a 609 × 609 × 609 mm pad (top 113.6 mm below the floor; 12 mm plate with its top 4 in below the finished floor, buried in the 4 in A10 slab, which fills the 12 mm over each pad) standing on a 4 ft × 4 ft × 4 in (1219 × 1219 × 102 mm) reinforced base with BRC A10 at 7 in each way (Tan, 4:32 PM; about 5.4 m³ and 348 kg of mesh for all 36). Each pad is now reinforced (Tan, 5:18 PM): an open-top Y12 cage, 50 mm cover, 8 U-bars (4 each way at about 170 mm, up two faces to 50 mm below the top) and 2 rings at 200 and 400 mm; about 14.6 kg per pad, 525 kg for all 36. The 4 M20 bolts drop through the open top inside the cage: their bottoms are about 209 mm above the pad bottom, about 150 mm clear of the bottom bars, and 140 mm or more inside the legs and rings, so no clash (the inner U-bar lines at 186 and 323 mm pass under the bolts at 204.5 and 404.5 mm, well below their ends). The cage gives crack control (shrinkage and the bolt and bearing loads) and ties the pad together, and the rings round the bolts raise the cone breakout a little (about 10–20%, preliminary). It does NOT fix the frame base fixity: that is set by the pad's size, weight and the soil, not by bars inside it (see the frame item). All on compacted soil (Tan, 4:30 PM). Bearing: the 1.22 m base spreads the column load over 4 times the area: about 23 kPa, about 26 kPa with solar (was about 82–95 kPa on the 609 mm cube); about 45–55 kPa under the rocking edge in wind; against the tested allowable bearing of 97 kPa (Tan, 1 Oct 2026): about 24–27% under the whole base, about 46–57% under the rocking edge in wind. OK. On the old 609 mm cube the same loads would have been about 85–98% of 97 kPa, so the 4 ft base is what keeps bearing comfortable. This test confirms pressure only. The bases are still about 40–60% fixed, because that figure uses an assumed soil stiffness of 20 MN/m³, which a bearing value does not measure. The base bends about 15% of its strength and punching is small. Uplift: the base adds about 3.6 kN (plus about 3.6 kN of slab over its larger footprint). Middle columns: pad, base, slab and one bay of wall, after the 0.9 factor, about 25 kN against up to 15.6 kN, about 61% (about 40% if the soil over the base's 305 mm ledge is counted). Corner and end columns (half a bay of wall): about 22 kN, about 71% (about 46% with the soil): now OK, so the corner pads no longer need enlarging. Anchor bolts, in the 609 mm pad (204.5 mm from each side): steel about 35–60%, pull-out about 40%; cone breakout about 40–65% with the 8–15 kNm the base now takes (about 85% if a ground beam makes the base fixed; then run its bars past the bolts). Buried plates: good for corrosion (about 50 mm of concrete over the nuts), but they cannot be re-tightened later, so level, grout and tighten them before the slab goes in (or leave a 4 in pocket at each plate). Coat each column from the plate to about 300 mm above the floor and seal the column-floor joint with a PU sealant groove. Also advised: a plastic sheet (DPM) under the slab. The pad base doubles as the pad's blinding, so no separate blinding is needed. The wall bars now run straight down into the slab (see the wall item); the 4 in drilled holes stay dropped.",
        shows: "Column pads with their Y12 cages, their 4 ft bases and mesh, base plates, anchor bolts and the floor mesh",
        engineer: true,
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
        title: "Columns from 12 m bars: no longer works",
        status: "Saving lost: columns now 4.214 m",
        tag: "was ≈RM 5.5–6.6k",
        body:
          "Was: cut the 4.012 m columns to 3.985 m and get 3 from each 12 m bar. Now the plates are buried 4 in below the floor and the ceiling is set to 4.000 m clear, so each column is 4.214 m (4.188 + 26 mm since the PU ceiling panel, Tan 7:12 PM): 3 no longer fit in 12 m (12.64 m), and 2 per 12 m bar wastes more than one per 6 m bar. Keep 37 × 6 m bars (one column each, about 1.79 m offcut each, about 1 t of offcuts in all). Ask the supplier whether SHS 125×4.5 comes in 12.6 m lengths; if it does, the old saving comes back.",
        shows: "All 36 columns",
      },
      {
        id: "ceilingCross",
        title: "Lighter ceiling cross purlins",
        tag: "applied · −366 kg · ≈RM 2.2–2.6k",
        status: "Applied: now lipped C 100×50×15×1.2 · checked about 71–85%, sag about 6 mm",
        body:
          "34 × 10.25 m (348.5 m) changed from ASC 12516 (3.17 kg/m) to lipped C 100×50×15×1.2 G450 (2.12 kg/m): 1.11 t down to 0.74 t, saving about 366 kg, RM 2.2–2.6k at RM 6–7/kg (less than the first RM 3–4.5k guess). Check over the 2.53 m span, carrying ceiling sheet, services allowance and a 1.1 kN person or point load at midspan: bending about 71–85%, total sag about 6 mm (about L/420). Wind on the ceiling: about 21–49%. The bottom stays at the same level so the ceiling is unchanged; the top sits 27 mm below the long purlins, taken up by the hanging cleat. Do not use them as a walkway or hang heavy fans or pipes without a check.",
        shows: "Ceiling cross purlins",
        engineer: true,
      },
      {
        id: "beamSplice",
        title: "Ceiling beam from one 12 m bar, no splice",
        tag: "RM 1.5–2.5k",
        body: "Removes 18 splice sleeves and a critical tension joint. Same steel, less welding.",
        shows: "Beam splices",
      },
      {
        id: "cutLength",
        title: "C sections ordered cut to length",
        tag: "≈RM 300",
        body: "Order girts cut at 5.865 m (5 mm clear of each column, web holes punched by the supplier for the shelf-cleat bolts) and the other C sections at their exact lengths instead of 6 m bars.",
        shows: "Wall girts and ceiling C purlins",
      },
      {
        id: "overhangs",
        title: "Optional: shorter overhangs",
        tag: "each RM 1.5–2k",
        body:
          "The 5 ft gable overhang sits in the worst wind corner; about 0.6 m would save panel and purlin. The eave sheet hangs about 607 mm past the last purlin; about 300 mm is the usual limit. Both trade shade and rain cover for cost and safety.",
        shows: "Gable overhangs and the eave sheet overhang",
        engineer: true,
      },
      {
        id: "tieLighter",
        title: "Column tie could be lighter later",
        tag: "RM 2–2.9k",
        body:
          "The SHS 125×125×3.0 tie works at about 35–36% now that it also carries the girt rods (about 25% as eave strut plus about 1.8 kNm from the rods). Decide after the side-wall bracing is designed (it sets the tie's load as eave strut). A lighter section may lose the flush outside face for the netting.",
        shows: "Column ties",
        engineer: true,
      },
      {
        id: "keepPurlins",
        title: "Keep 7 roof purlin lines per side",
        body:
          "Wider spacing (6 lines) would save about 0.67 t, but with solar coming and the eave purlins already tight it is not worth the risk.",
        shows: "Roof purlins",
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
        body:
          "Green: bays 2–16, clear of the eaves. Red, no panels: the gable overhangs, the first ~1 m of bays 1 and 17, and a ~2.4 m strip along each eave edge (high wind suction). About 104 panels / 270 m² fit in bays 2–16 on one slope.",
        shows: "Green solar zone and red no-go zones on the roof",
      },
      {
        id: "solarBays",
        title: "Bays 1 and 2 are not weaker",
        body:
          "All 17 bays carry the extra 0.15 kPa (purlins about 53–62%, trusses about 66%). Bay 2 is identical to the middle bays; bay 1's end frame carries only about 75% of a normal frame. Bays 16/17 mirror 2/1. The only end-bay differences are the gable wind corner and the end-frame fixes above.",
        shows: "Bays 1–2 and 16–17",
      },
      {
        id: "solarRails",
        title: "Fix rails into the purlins",
        body:
          "Screw the panel rails through to the purlins, not just the sheet, and spread them over the purlin lines. The engineer should check the case of panels on one slope only.",
        shows: "Roof purlins",
        engineer: true,
      },
    ],
  },
  {
    id: "ok",
    title: "4 · Checked, OK for now",
    tone: "ok",
    items: [
      {
        id: "purlinCut",
        title: "Roof purlin cut plan: 6 m per bay (Tan)",
        status: "Tan's plan applied · simple spans",
        tag: "210 × 6 m + 28 × 7.55 m",
        body:
          "Applied in the model and the parts list. Each of the 14 purlin lines (7 per slope) is cut into 15 × 6 m pieces for the inner bays plus one longer piece in each end bay that runs on past the end rafter to carry the 5 ft gable overhang: 210 × 6 m (cut 5.995 m for a 5 mm gap) + 28 × about 7.55 m, 1,470 m, about 4.66 t (same steel as before). The 6 m pieces are the standard AJIYA length and the longest piece, about 7.55 m, is well under a 12 m lorry. Joint: butt joint on the rafter centre, both purlin ends bolted to the same 4-slot purlin bracket, 2 × M12 each (AJIYA's standard 'four-bolt cleat' butt joint); 224 joints, 252 brackets, 1,008 M12 bolts. Treat these joints as pinned, so every bay is a simple span, which is what the purlin checks assume. No sleeve is needed except where the tip line is over (buy ASC 12520 there instead). Two numbers to confirm with Tan: (1) he said 14 long pieces; there are 14 lines and a 5 ft overhang at both gables, so it is 14 at each end, 28 in all; (2) 6 m + 5 ft = 7.524 m gives 5 ft past the end rafter's centre, while the model's overhang is 5 ft past its outside face, so the modelled end piece is about 7.546 m; either is fine, 7.524 m just makes the overhang about 25 mm shorter. The ceiling long purlins were already one 6.1 m piece per bay, bolted at every frame, so they need no change.",
        shows: "The long end pieces with the gable overhang and the first inner joints",
        engineer: true,
      },
      {
        id: "tieBeam",
        title: "SHS 125×3 column tie",
        status: "OK",
        tag: "≈36%",
        body:
          "Works at about 35–36%: about 25% as the eave strut plus about 10% from the 34 girt rods hung under it (about 1.2 kN each). It is no longer welded to the columns: it sits on shop-welded seat angles and is bolted down on site (see 'Tie and girt connections'). Stiff enough to brace the girts (about 170 N/mm at midspan against about 50 N/mm needed). New small point: the ceiling cross purlin ends sit on top of the tie (drawn touching it); fix each with a small cleat or bolt to the tie so they cannot slide off, which also restrains the tie.",
        shows: "Column ties",
        engineer: true,
      },
      {
        id: "shopConnections",
        title: "Tie and girt connections: welded in the shop, bolted on site",
        status: "Applied (Tan, 30 Sep 2026) · no welding on site · no holes through the columns",
        tag: "L75×75×6 · tie ≈66% (welds) · girt ≈14%",
        body:
          "Column tie (Tan chose T2 with the angles shop-welded): each tie is cut 5 mm short of each column. In the SHOP, a seat angle L75×75×6 (Tan, 30 Sep 2:24 PM), 115 mm long, is welded to the column side face under each tie end: the upright leg is against the column, with a 5 mm fillet down both sides and across the bottom (no weld at the heel, where the tie end sits), and the flat leg sits under the tie. There are no holes through the column. On SITE, the tie sits on the angles and is bolted down with 2 × M16 × 35 grade 8.8 bolts at each end, down through the tie's bottom face into the flat leg, 45 mm from the column face (30 mm to the angle's toe) and 60 mm apart. The heads are inside the tie, set through the open end before lifting (held with tape or a magnet); the washer and nut go under the angle. Push-in plastic end caps then close the tie ends. Rough check (design loads about ±25 kN along the tie as eave strut, 1.5 kN down, 2 kN sideways): bolt shear about 12.5 kN each against about 60 kN (about 21%); bearing on the 6 mm leg about 27% and on the 3 mm tie wall (40 mm to the tie end) about 41%; the 5 mm fillets about 66% (the eave-strut pull goes through the upright-leg welds); the upright leg bending about 65%; the flat leg about 16%. In all: 68 angles, 136 M16 bolts, 68 end caps. Wall girts (G1): in the SHOP, an angle L75×75×6, 80 mm long (Tan, 2:24 PM), is welded to the column side face at each girt end, upright leg pointing down (5 mm fillet down both sides and across the bottom); its flat leg sits inside the C under the web, between the lips (80 mm vs about 94 mm clear). The girts are cut 5.865 m, with their web holes punched by the supplier. On SITE, each girt drops onto its cleats and is fixed with 2 × M12 bolts at each end, down through the web and the flat leg (slots 14×22, 45 mm from the column, 40 mm apart across the web) with the nut underneath. Rough check: about 4.5 kN of wind at each end of the middle girt; bolt shear about 14%; bearing in the 1.6 mm web about 12%; angle and welds under 5%. The girts themselves are never welded. In all: 136 girt angles, 272 M12 bolts. Tie and girt connection parts about 163 kg and about RM 2.9–4.4k in all (rough; L75×75×6). The engineer must confirm the eave-strut force once the side-wall bracing is designed.",
        shows: "Tie seat angles, tie bolts and end caps, girt angle brackets and girt bolts",
        engineer: true,
      },
      {
        id: "trusses",
        title: "Trusses: rafters, ceiling beam and webs",
        status: "OK · members; joints open (see gaps)",
        tag: "≈66% with solar",
        body:
          "Rafters, ceiling beam, verticals and W webs work at about 66% with the future solar load (a bit less without). The weak spots are the joints, not the members: see the truss heel welds and beam splice in the safety gaps, and the end-frame bolts.",
        shows: "Rafters, ceiling beams, verticals and W webs",
        engineer: true,
      },
      {
        id: "roofPurlins",
        title: "Roof purlins (away from the eaves)",
        status: "OK · simple 6 m spans; tip line open (see gaps)",
        tag: "≈53–62% · column line ≈55–82%",
        body:
          "Checked as simple 6 m spans (Tan's cut plan). ASC 12516 purlins away from the eaves work at about 53–62% with the future solar load (dead + solar + roof live load); the column-line purlin about 55–82% in uplift. End bays with the 5 ft overhang: span about 47–62%, overhang root about 15% under dead + solar, about 30–45% in uplift at the gable corner: no worse than the inner bays. Only the tip line is over (see gaps). New small point: as simple 6 m spans they are a bit soft; dead + live, or dead + solar, sags about 34 mm (span/180), more than the span/200 AJIYA's own span table works to. Not a strength problem, but keep the solar rails screwed to every purlin, and ASC 12520 would bring it to about 28 mm. Keep both sag-rod rows in every bay and fix sheets with the supplier's screw pattern, closer at the edges.",
        shows: "Roof purlins",
        engineer: true,
      },
      {
        id: "roofBracing",
        title: "Roof X cables, bays 1, 6, 12 and 17",
        status: "OK · fittings to detail",
        tag: "≈35% (rough)",
        body:
          "Rough check about 35%. They only work if they are tight: use proper end fittings (eye plates or cleats welded to the rafters) and turnbuckles, and tension them after the roof steel is square. They need the side-wall X bracing in bays 1 and 17 to pass their load to the ground.",
        shows: "Roof X bracing",
        engineer: true,
      },
      {
        id: "ceilingSheet",
        title: "PU ceiling panel with the netted roof space · NO-WALK",
        status: "OK · confirm with the supplier's span table",
        tag: "≈70–95% (rough)",
        body:
          "SUPPORT CHAIN (fixed Tan 7:25 PM; the cross purlins had no contact with the long purlins, a 27 mm gap with only a notional packer): truss beam → long purlins (on the beam top) → L50×50×5 hanger angle at every crossing (2 × M10 each end, no welding) → cross purlins C100 (bottom flange on the ceiling backing, ends bearing on the SHS ties) → PU ceiling. Hanger ≈3.6 kN max vs ≈14 kN for 2 × M10 in the 1.2 mm web. Tan 7:12 PM: the ceiling is now the metal-backed Mega Rib 35 PUR 25 panel (the insulation moved down from the roof, which is now plain Mega Rib 35), ribs DOWN with the crests at 4.000 m clear, rib sheet 0.35 TCT, foam and flat metal backing up (backing unchanged; confirm the liner thickness on the quote). The wall lining rib sheet is 0.40 TCT. NO-WALK: the hung ceiling is not trafficable at any thickness on its ≈2 m span (a 1.1 kN foot load fails it locally); lay boards or a catwalk on the cross purlins for any roof-space access. Rough screw pull-through ≈0.05–0.17 kN per screw, OK. The ceiling spans about 2 m between cross purlins. Because the roof space is open to outside air through the eave and gable netting, wind pressure reaches both sides of the ceiling and it sees only part of the roof wind: rough check about 70–95%. Check the supplier's span table for 2 m spans, screw at least every second rib at every purlin, and keep the netting open (do not seal the roof space). The lighter C100 cross purlins under it are checked in Savings (about 71–85%, sag about 6 mm).",
        shows: "Ceiling sheet and eave netting",
        engineer: true,
      },
    ],
  },
  {
    id: "note",
    title: "Note",
    tone: "note",
    items: [
      {
        id: "steelTotal",
        title: "Total steel is about 18.1 t",
        body:
          "The 11.47 t steel order covers only the hollow sections and wall girts. The roof C purlins (about 4.66 t, 210 × 6 m + 28 end pieces), long ceiling purlins (about 0.99 t), lighter cross purlins (about 0.74 t, was 1.11 t), M12 girt rods (about 78 kg, now up to the tie, plus 34 welded M12 studs and coupling nuts) and M20 anchor bolts (about 164 kg, 400 mm deep) come on top: about 18.10 t (18.47 t with the old cross purlins). Plates, cleats and sag rods are extra. Concrete (strip footing removed, 29 Sep 4:22 PM): floor slab about 110 m³, with its BRC A10 mesh (10 mm at 7 in each way, 59 × 577 bars) about 7.45 t, about 8.2 t with sheet laps; 36 pads about 8.2 m³ with their open-top Y12 cages about 525 kg (Tan, 5:18 PM); 36 pad bases (4 ft × 4 ft × 4 in) about 5.4 m³ with A10 mesh about 348 kg; wall about 22.2 m³ with rebar about 769 kg (verticals now 6 in below the floor, no starter bars): about 146 m³ of concrete and about 9.8 t of rebar in all. Columns are now 4.188 m (still one per 6 m bar, so the steel order is unchanged); floor to ceiling-sheet underside is 4.000 m.",
        shows: "All C purlins and girts",
      },
    ],
  },
];
