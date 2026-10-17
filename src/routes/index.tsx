import { createFileRoute } from "@tanstack/react-router";
import { Maximize2, Minimize2, Ruler, ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SafetyPanel } from "@/components/safety-panel";
import { SectionDiagram } from "@/components/section-diagram";
import { ShedViewer, type ShedHandle, type ViewName } from "@/components/shed-viewer";
import { safetySections, type SafetyFocus } from "@/shed/safety";
import { derived, liningInfo, metres, nettingInfo, partTotal, parts, spec, steelOrder, steelOrderMass, cutOrder, connectionOrder, crossPurlinSaving, smallSteel, girtRodPlan, girtRodDx, bracketFit, rodFit, ceilingInfo, ceilingEdgeFit, ceilingEdgePieces, steelTotalMass, wallQuantities, foundationQuantities, roofPurlinCut, type PartId } from "@/shed/geometry";

export const Route = createFileRoute("/")({ component: Home });

const views: { id: ViewName; label: string }[] = [
  { id: "iso", label: "3D" },
  { id: "end", label: "End" },
  { id: "side", label: "Side" },
  { id: "plan", label: "Plan" },
];

const PANELS_KEY = "shed.panelsHidden";

const cornerBase = "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-xs font-medium shadow backdrop-blur-sm sm:h-8 sm:px-2.5";
const cornerButton = `${cornerBase} border-border bg-surface/85 text-fg hover:bg-surface-2`;
const cornerButtonOn = `${cornerBase} border-sky-300 bg-sky-400 text-sky-950 hover:bg-sky-300`;
const safetyCorner = `${cornerBase} border-amber-600/80 bg-amber-950/80 text-amber-200 hover:bg-amber-900`;
const safetyCornerOn = `${cornerBase} border-amber-300 bg-amber-400 text-amber-950 hover:bg-amber-300`;

function Home() {
  const shed = useRef<ShedHandle>(null);
  const [view, setView] = useState<ViewName>("iso");
  const [measuring, setMeasuring] = useState(false);
  const clearMeasure = () => shed.current?.clearMeasure();
  // On first load the netting, roof, capping, ceiling and wall lining layers start hidden (Tan, 17 Oct 2026); each can be switched on.
  const defaultHidden = new Set<PartId>(["eaveNetting", "gableNetting", "roof", "capping", "ceiling", "wallLining"]);
  const [shown, setShown] = useState<Record<PartId, boolean>>(() =>
    Object.fromEntries(parts.map((part) => [part.id, !defaultHidden.has(part.id)])) as Record<PartId, boolean>,
  );

  // Hide the toolbar and info panel so the model can fill a phone screen. Remembered per browser;
  // with nothing stored, narrow screens start with the panels hidden.
  const [panelsHidden, setPanelsHidden] = useState(false);
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(PANELS_KEY);
    } catch {
      // Storage can be blocked; fall back to the screen width.
    }
    setPanelsHidden(stored === null ? window.innerWidth < 768 : stored === "1");
  }, []);
  const togglePanels = () => {
    setPanelsHidden((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(PANELS_KEY, next ? "1" : "0");
      } catch {
        // Ignore: the toggle still works for this visit.
      }
      return next;
    });
  };

  // Safety review panel: open/closed and the item currently highlighted in the model.
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [safetyFocus, setSafetyFocus] = useState<SafetyFocus | null>(null);
  const [showProblem, setShowProblem] = useState(true);
  // Proposed 3D fixes switched on, by fix id (safety.ts `fixes`); the global button sets or clears all of them.
  const [fixIds, setFixIds] = useState<string[]>([]);
  const allFixIds = Array.from(new Set(safetySections.flatMap((s) => s.items.flatMap((i) => (i.fixes ?? []).map((f) => f.id)))));
  const showFixes = allFixIds.length > 0 && allFixIds.every((id) => fixIds.includes(id));
  const setShowFixes = (on: boolean) => setFixIds(on ? allFixIds : []);
  const toggleFixId = (id: string) => setFixIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  useEffect(() => {
    shed.current?.setSafetyLayers(showProblem, fixIds);
  }, [showProblem, fixIds]);
  const toggleSafety = () => setSafetyOpen((open) => !open);
  useEffect(() => {
    if (!safetyOpen) setSafetyFocus(null);
  }, [safetyOpen]);
  useEffect(() => {
    shed.current?.focusSafety(safetyFocus);
  }, [safetyFocus]);
  const setInsets = useCallback((left: number, bottom: number) => shed.current?.setInsets(left, bottom), []);

  const choose = (id: ViewName) => {
    setView(id);
    shed.current?.setView(id);
  };

  return (
    <div className={panelsHidden ? "app-shell panels-hidden" : "app-shell"}>
      <main className="app-stage">
        <div className="relative min-h-0 flex-1">
          <ShedViewer ref={shed} shown={shown} measuring={measuring} />
          {safetyOpen && (
            <SafetyPanel
              active={safetyFocus}
              onSelect={setSafetyFocus}
              onClose={() => setSafetyOpen(false)}
              showProblem={showProblem}
              onProblem={setShowProblem}
              showFixes={showFixes}
              onFixes={setShowFixes}
              fixIds={fixIds}
              onToggleFix={toggleFixId}
              onInsets={setInsets}
            />
          )}
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
            {/* With the panels hidden, Measure and Clear live here so a phone can still reach them. */}
            {panelsHidden && measuring && (
              <button type="button" onClick={clearMeasure} className={cornerButton}>
                <X className="h-3.5 w-3.5" aria-hidden />
                Clear
              </button>
            )}
            {panelsHidden && (
              <button type="button" onClick={toggleSafety} aria-pressed={safetyOpen} className={safetyOpen ? safetyCornerOn : safetyCorner}>
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                Safety
              </button>
            )}
            {panelsHidden && (
              <button
                type="button"
                onClick={() => setMeasuring((m) => !m)}
                aria-pressed={measuring}
                className={measuring ? cornerButtonOn : cornerButton}
              >
                <Ruler className="h-3.5 w-3.5" aria-hidden />
                Measure
              </button>
            )}
            <button type="button" onClick={togglePanels} aria-expanded={!panelsHidden} className={cornerButton}>
              {panelsHidden ? <Minimize2 className="h-3.5 w-3.5" aria-hidden /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden />}
              {panelsHidden ? "Show panels" : "Hide panels"}
            </button>
          </div>
        </div>
        {!panelsHidden && (
          <div className="flex flex-wrap items-center gap-1 border-t border-border bg-surface px-3 py-2">
            <div
              role="group"
              aria-label="Camera view"
              className="mr-1 flex items-center gap-0.5 rounded border border-sky-800/70 bg-sky-950/50 p-0.5"
            >
              {views.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => choose(item.id)}
                  aria-current={item.id === view ? "true" : undefined}
                  className={
                    item.id === view
                      ? "h-5 rounded-sm bg-sky-400 px-2 text-[10px] font-semibold leading-none text-sky-950"
                      : "h-5 rounded-sm px-2 text-[10px] leading-none text-sky-200 hover:bg-sky-800/60"
                  }
                >
                  {item.label}
                </button>
              ))}
              <span className="mx-0.5 h-3.5 w-px bg-sky-800" aria-hidden />
              <button
                type="button"
                onClick={() => setMeasuring((m) => !m)}
                aria-pressed={measuring}
                className={
                  measuring
                    ? "inline-flex h-5 items-center gap-1 rounded-sm bg-sky-400 px-2 text-[10px] font-semibold leading-none text-sky-950"
                    : "inline-flex h-5 items-center gap-1 rounded-sm px-2 text-[10px] leading-none text-sky-200 hover:bg-sky-800/60"
                }
              >
                <Ruler className="h-3 w-3" aria-hidden />
                Measure
              </button>
              {measuring && (
                <button
                  type="button"
                  onClick={clearMeasure}
                  className="h-5 rounded-sm px-2 text-[10px] leading-none text-sky-200 hover:bg-sky-800/60"
                >
                  Clear
                </button>
              )}
              <span className="mx-0.5 h-3.5 w-px bg-sky-800" aria-hidden />
              <button
                type="button"
                onClick={toggleSafety}
                aria-pressed={safetyOpen}
                className={
                  safetyOpen
                    ? "inline-flex h-5 items-center gap-1 rounded-sm bg-amber-400 px-2 text-[10px] font-semibold leading-none text-amber-950"
                    : "inline-flex h-5 items-center gap-1 rounded-sm border border-amber-600/70 bg-amber-950/60 px-2 text-[10px] leading-none text-amber-200 hover:bg-amber-900/70"
                }
              >
                <ShieldAlert className="h-3 w-3" aria-hidden />
                Safety
              </button>
            </div>
            <p className="pr-1 font-mono text-[11px] text-muted">{partTotal} pieces</p>
            {parts.map((part) => (
              <button
                key={part.id}
                type="button"
                aria-pressed={shown[part.id]}
                onClick={() => setShown((current) => ({ ...current, [part.id]: !current[part.id] }))}
                className={
                  shown[part.id]
                    ? "h-6 rounded bg-primary px-2 text-[11px] font-medium leading-none text-bg"
                    : "h-6 rounded bg-surface-2 px-2 text-[11px] leading-none text-muted line-through"
                }
              >
                {part.label} {part.count}
              </button>
            ))}
          </div>
        )}
      </main>
      <aside className="app-panel">
        <div className="flex flex-col gap-4 p-4">
          <header>
            <p className="text-xs font-medium tracking-wide text-primary">Layer house · draft frame</p>
            <h1 className="mt-1 text-xl font-semibold">102 m house, 6 m rafters</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The 6 m rafter is one continuous RHS, welded on top of the horizontal beam. That beam is two bars, 6.00 m and 4.25 m, spliced just past the ridge. The clear width between the inside faces of the columns is 10 m. Columns sit{" "}
              {metres(derived.half)} from the ridge, so the rafter continues{" "}
              {metres(derived.overhangSlope)} past the column ({metres(derived.overhangHoriz)} measured
              horizontally).
            </p>
          </header>
          <SectionDiagram />
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-xs">
            <Fact label="Length" value={metres(spec.length, 0)} />
            <Fact label="Clear width" value="10.00 m inside the columns" />
            <Fact label="Column centres" value={metres(spec.columnCentres)} />
            <Fact label="Bays at 6 m" value={String(derived.bays)} />
            <Fact label="Frames" value={String(derived.frames)} />
            <Fact label="Clear height" value={`${spec.ceilingClear.toFixed(4)} m finished floor to the underside of the ceiling sheet (at the floor's high point on the centre line; ${(spec.ceilingClear + spec.floor.center - spec.floor.edge).toFixed(4)} m at the walls) · column top ${metres(spec.eaveAtColumn)} above the floor at the wall`} />
            <Fact label="Floor" value={`4 in (100 mm) slab on compacted soil, BRC A10 mesh: 10 mm bars at 7 in (178 mm) each way at mid-depth (≈40 mm top cover) · top 6 in above ground at the centre, 4 in at the column face · runs ${Math.round(spec.floor.toe * 1000)} mm past the columns so the base plates are buried · ≈ ${foundationQuantities.floorM3.toFixed(1)} m³ · mesh ${foundationQuantities.longBars} long × ${foundationQuantities.crossBars} cross bars ≈ ${(foundationQuantities.floorMeshBareKg / 1000).toFixed(2)} t, ≈ ${(foundationQuantities.floorMeshKg / 1000).toFixed(2)} t with sheet laps (≈10%)`} />
            <Fact label="Ridge height" value={metres(derived.ridgeHeight)} />
            <Fact label="Eave tip height" value={metres(derived.eaveTipHeight)} />
            <Fact label="Roof overall width" value={metres(derived.roofWidth)} />
            <Fact label="Columns" value={`SHS 125×125×4.5 · ${derived.columns}`} />
            <Fact label="Base plates" value={`300×300×12 (assumed; 16–20 mm advised) · ${derived.columns} · top 4 in below the floor, buried in the slab`} />
            <Fact label="Anchor bolts" value={`4 × M20 per plate · ${derived.columns * 4} · 200 mm square · 400 mm embedded`} />
            <Fact label="Concrete bases" value={`609 × 609 × 609 mm (2 ft cube) · ${derived.columns} · top 113.6 mm below the floor · poured with the slab, no strip footing · ≈ ${foundationQuantities.padsM3.toFixed(1)} m³`} />
            <Fact label="Pad cage" value={`Open-top Y12 cage in each pad, 50 mm cover · 8 U-bars (4 each way at ≈170 mm, cut ≈${foundationQuantities.cageUA.toFixed(2)} m and ${foundationQuantities.cageUB.toFixed(2)} m) + 2 rings at 200 and 400 mm (cut ≈${foundationQuantities.cageRing.toFixed(2)} m incl. 300 mm lap) · for ${derived.columns}: ${8 * 36} U-bars + ${2 * 36} rings · ≈ ${Math.round(foundationQuantities.padCageKg)} kg (Y12 0.888 kg/m) · all foundation + wall rebar ≈ ${((foundationQuantities.floorMeshKg + foundationQuantities.padMeshKg + foundationQuantities.padCageKg + wallQuantities.rebarKg) / 1000).toFixed(1)} t`} />
            <Fact label="Pad bases" value={`4 ft × 4 ft × 4 in (1219 × 1219 × 102 mm) under each pad · ${derived.columns} · BRC A10 at 7 in each way, mid-depth · ≈ ${foundationQuantities.padBaseM3.toFixed(1)} m³ · mesh ≈ ${Math.round(foundationQuantities.padMeshKg)} kg`} />
            <Fact label="Sloping rafters" value={`RHS 50×125×3 · ${derived.rafters}`} />
            <Fact label="Rafter cut" value={`Top ${metres(derived.rafterTopEdge)} · bottom ${metres(derived.rafterBottomEdge)} · ridge plumb cut ${spec.pitchDeg}°`} />
            <Fact label="Horizontal rafters" value="RHS 50×125×3 · 6.00 m + 4.25 m" />
            <Fact label="Column ties" value="SHS 125×125×3.0 · flush with both column faces · cut 5 mm short of each column · lining fixed to it" />
            <Fact label="Tie connection" value="No site welding · SHOP: bracket L75×75×6 cut 6 in (152.4 mm), its L-shaped end welded to the column side face (about 300 mm of fillet on the 4.5 mm SHS wall: not checked, engineer to check; the 152 mm cantilever under the tie is also not checked) · projects straight out along the wall, horizontal leg UP (75 wide, centred on the column face), fin hanging 75 mm down on the inner (house) side · SITE: tie (5 mm from the column) sits on the leg, 2 × M16 × 35 grade 8.8 per end in line along the length at 40 and 100 mm from the column, down through the tie's bottom face · no holes through the column · plastic end caps" />
            <Fact label="Truss to column (knee)" value="Fork joint, engineer must design and approve (it carries the frame moment; no doublers) · 6 mm cap and fork plates (Tan, 17 Oct 2026); the earlier 6 mm fork (215 wide, 4 bolts) failed the rough checks (fin base ≈227%, cap ≈151%) and this one has not been recomputed (see Safety) · SHOP: 6 mm cap plate 128 × 128 on the column top (full-penetration weld, 1.5 mm over the faces) + two 125 × 225 × 6 fork plates welded upright, 50 mm clear apart against the RHS, outer ends FLUSH with the column outside face, inner ends level with the column inner face · heel: NO doublers; bored sleeves OD 42.4 × 21 bore welded through the RHS at each bolt · SITE: 2 × M20 × 110 grade 8.8 PRELOADED bolts (grip 62 mm), 21 mm holes: one through the rafter (top tie), one through the horizontal beam (bottom tie), 65 mm in from the outside face · column steel stops 6 mm under the truss seat, so the 4.000 m ceiling is unchanged · no eave-netting cuts" />
            <Fact label="RHS end plates" value="Tan (30 Sep): every open truss RHS end closed · 3 mm plate cut to the 50 × 125 outline, SHOP seal-welded all round · 36 rafter eave tips + 36 ceiling-beam ends (flush with the column outside face) · RHS cut 3 mm short · ridge, splice and webs are welded all round (already sealed) · tie ends: plastic caps · if hot-dip galvanised, vent holes first" />
            <Fact label="Girt connection" value={`No site welding · SHOP: bracket L75×75×6 cut 4 in (101.6 mm), its L-shaped end welded to the column side face (about 300 mm of fillet on the 4.5 mm SHS wall: not checked, engineer to check), projecting straight out along the wall, horizontal leg UP (75 wide, centred on the column face), fin hanging 75 mm down on the inner (house) side · SITE: girt (5.865 m, starts ${Math.round(bracketFit.girtStartsFromFace * 1000)} mm from the column face, web holes punched by the supplier) dropped over the bracket from above, 2 × M12 per end in line along the wall at 30 and 75 mm from the column face, in 14 × 22 slots long along the wall · fit check (computed): the ${Math.round(bracketFit.legWidth * 1000)} mm leg passes the ${Math.round(bracketFit.lipOpening * 1000)} mm lip opening with ${(bracketFit.spareEachSide * 1000).toFixed(1)} mm to spare each side (${bracketFit.legPasses ? "passes" : "FAILS"}); the fin stays inside the flanges (${bracketFit.finInsideFlanges ? "yes" : "NO"}); bolts on the leg ${bracketFit.boltsOnLeg ? "yes" : "NO"}`} />
            <Fact label="Side-wall bracing" value="Cross bracing still to be designed by an engineer" />
            <Fact label="Rafter webs" value="SHS 50×50×2.3 · 2.5 m verticals · 2 W" />
            <Fact label="Eave purlins" value="ASC 12516 · 7 each side · open side facing inside" />
            <Fact label="Purlin brackets" value="5 in · 220 mm · B 63.5 · H 89 · 4 slots" />
            <Fact label="Roof" value="Mega Rib 35 PUR 25 mm (metal-backed), rib sheet zincalume TCT 0.47 · the insulation is in the roof (option A, Tan 1 Oct 2026) · foam fills the ribs, 25 mm under the pans, flat metal backing underneath (confirm on the quote) · last 5 in at the eave bare: close and seal the foam edge · 723 mm cover" />
            <Fact label="Ceiling" value={`Plain Mega Rib 30, zincalume TCT 0.35, no foam · 750 mm effective cover, ribs at 250 mm, 28.5 mm high, 24 mm crest · ${ceilingInfo.sheets} sheets across the ${metres(ceilingInfo.inner)} inner width, centred (${ceilingInfo.sheets} × 750 = ${Math.round(ceilingInfo.width * 1000)} mm), ${Math.round(ceilingInfo.gapEachWall * 1000)} mm gap to each long wall closed by the edge angle · ${ceilingInfo.area.toFixed(0)} m² of sheet · ribs DOWN (crests at ${spec.ceilingClear.toFixed(4)} m clear), 1 mm under the truss beams · seal the side laps, the lining joints and round the beams · colour-coated underside advised (ammonia, wash-down) · not walkable, no roof-space walking access`} />
            <Fact label="Cross purlins" value="2 m and 4 m in each 6 m bay · hung by L50 hangers with 11 × 30 vertical slots: set each to a string line (about 10 mm high at the long purlins for the sheet's sag), tighten, then 2 lock screws per hanger" />
            <Fact label="Ceiling edge" value={`12 in (305 mm) strip of the same 0.35 mm zincalume folded to an angle on both long walls, full length (${ceilingEdgePieces.length} pieces per wall, cut ${Math.round(spec.ceilingEdge.gap * 1000)} mm clear of each cross purlin) · ${Math.round(spec.ceilingEdge.flat * 1000)} mm flat leg on top of the ceiling sheet from the wall, over the ${Math.round(ceilingEdgeFit.gapEachWall * 1000)} mm gap and ${Math.round(ceilingEdgeFit.lap * 1000)} mm onto the sheet · ${Math.round(spec.ceilingEdge.up * 1000)} mm leg pointing down on the wall side, the lining against it and screwed through it into the tie · silicone / closure strip under the flat leg · developed ${Math.round(ceilingEdgeFit.developed * 1000)} mm of the ${Math.round(ceilingEdgeFit.blank * 1000)} mm blank (confirm the spare ${Math.round(ceilingEdgeFit.spareBlank * 1000)} mm with the folder) · fit (computed): ${Math.round(ceilingEdgeFit.bracketClearAcrossWall * 1000)} mm from the tie and girt brackets across the wall, its top ${(ceilingEdgeFit.purlinClearHeight * 1000).toFixed(2)} mm under the cross purlin's bottom flange, ${(ceilingEdgeFit.liningScrewOverlap * 1000).toFixed(0)} mm of lining overlap for screws, lining top ${Math.round(ceilingEdgeFit.liningTopGap * 1000)} mm under the flat leg, ceiling ribs ${ceilingEdgeFit.ribsClearLining ? "clear of" : "CLASH with"} the lining · ${ceilingEdgeFit.clear ? "no clash" : "CLASH"} · capacity not checked`} />
            <Fact label="Ridge cap" value="24 in × 8 ft zincalume" />
            <Fact label="Purlin tie rods" value="12 mm · two rows per bay" />
            <Fact label="Roof X" value="12 mm cable · 4 bays" />
            <Fact label="Side walls" value="Reinforced concrete, 125 mm, flush with the column faces · 914 mm (36 in) above the floor on the inside, falling to 864 mm outside" />
            <Fact label="Wall concrete" value={`≈ ${wallQuantities.concreteM3.toFixed(1)} m³ · cast on the cured floor · all concrete ≈ ${(wallQuantities.concreteM3 + foundationQuantities.floorM3 + foundationQuantities.padsM3 + foundationQuantities.padBaseM3).toFixed(0)} m³ (floor, pads, pad bases, wall)`} />
            <Fact label="Wall rebar" value={`Y10 at 320 mm each way, one layer at mid-thickness (≈57 mm cover) · ${wallQuantities.meshRows} horizontal bars welded to the columns + ${wallQuantities.meshVerticals} verticals per bay · ≈ ${Math.round(wallQuantities.rebarKg)} kg (laps extra) · verticals run straight down 6 in (152 mm) below the floor top, no starter bars`} />
            <Fact label="Inside the lining" value={`${metres(liningInfo.clearInside)} between rib crests · ${metres(liningInfo.clearAtPans)} between pans`} />
            <Fact
              label="Wall lining"
              value={`Mega Rib 35 PUR 25 mm, rib sheet TCT 0.40 (backing unchanged, confirm the liner on the quote) · ${liningInfo.sheets} sheets × ${metres(liningInfo.sheetLength)} · ribs in, metal-backed face out`}
            />
            <Fact
              label="Wall girts"
              value={`ASC 12520 (C 127×51×15×2.0) · ${liningInfo.girts} × ${metres(liningInfo.girtLength)} · 3 rows, lowest bottom ${Math.round((liningInfo.girtRows[0].bottom - liningInfo.wallTopIn) * 1000)} mm (4 in) above the wall top, then at ${Math.round(liningInfo.girtPitch * 1000)} mm pitch (centres ${liningInfo.girtRows.map((r) => metres((r.top + r.bottom) / 2, 3)).join(", ")}; the SHS tie is the top support) · web on top, open side down`}
            />
            <Fact label="Girt tie rods" value={`M12 · ${derived.bays * 2 * spec.girt.rodLines * spec.girt.rodsPerBay} pieces · ${spec.girt.rodLines} lines per bay per side at the third points of the girt span (±${Math.round(girtRodDx[1] * 1000)} mm from the bay centre), each line one piece per girt gap: ${girtRodPlan.map((r, i) => `gap ${i + 1} ${metres(r.length, 3)}`).join(", ")} · per line: piece 1 hangs the bottom girt from the middle girt; piece 2 starts at a coupling nut on the middle girt web, passes through the top girt up to the SHS tie, where it screws into a coupling nut on an M12 × 40 grade 4.6 bolt welded under the tie in the shop (16 mm hole, weld all round, zinc ground off, painted) · position check (computed): rod lines ${Math.abs(rodFit.offsetFromTieCentre * 1000).toFixed(1)} mm off the tie centre line and ${Math.abs(rodFit.offsetFromGirtCentre * 1000).toFixed(1)} mm off the girt web centre line, at ${rodFit.rodFromColumnFace.map((x) => x.toFixed(2)).join(" and ")} m from the column face, ${(rodFit.nearestBracketEndDistance * 1000).toFixed(0)} mm clear of the bracket ends and ${(rodFit.nearestBoltDistance * 1000).toFixed(0)} mm from the nearest bracket bolt (${rodFit.clearOfBrackets ? "no clash" : "CLASH"})`} />
            <Fact
              label="Lining foot"
              value={`No flashing · laps ${Math.round(liningInfo.wallLap * 1000)} mm (2 in) down over the concrete wall's inner face, ${Math.round(liningInfo.wallFaceClear * 1000)} mm clear of it · seal that joint at the wall top edge · foam runs the full panel length, so seal the exposed foam at the bottom edge (PU/silicone bead or small bottom trim) · no rib closure strips needed: the PU foam fills the ribs right to the panel ends, so there are no open rib voids`}
            />
            <Fact
              label="Roof purlin cut plan"
              value={`Per line (14 lines): ${roofPurlinCut.inner} × 6 m + 2 end pieces × ${metres(roofPurlinCut.endCut)} (6 m bay + 5 ft overhang past the end rafter face) · in all ${roofPurlinCut.lines * roofPurlinCut.inner} × 6 m (cut ${metres(roofPurlinCut.bayCut)} for a ${Math.round(spec.purlin.jointGap * 1000)} mm gap) + ${roofPurlinCut.lines * roofPurlinCut.ends} × ${metres(roofPurlinCut.endCut)} · ${roofPurlinCut.joints} butt joints on the rafter brackets, 2 × M12 per purlin end · ${roofPurlinCut.bolts} M12 bolts in all (4 per bracket)`}
            />
            <Fact
              label="Eave netting"
              value={`2 × ${metres(nettingInfo.runPerSide)} × ${metres(nettingInfo.height)} = ${nettingInfo.eaveArea.toFixed(1)} m² · ${metres(2 * nettingInfo.runPerSide)} run · SS304 welded mesh ${Math.round(spec.netting.mesh * 1000)} mm, screwed direct to steel`}
            />
            <Fact
              label={nettingInfo.closure === "sheet" ? "Gable sheet" : "Gable netting"}
              value={`2 × ${nettingInfo.gableArea.toFixed(2)} m² = ${nettingInfo.gableAreaTotal.toFixed(1)} m² · ${metres(nettingInfo.gableWidth)} wide × ${metres(nettingInfo.gableHeight)} high${nettingInfo.closure === "sheet" ? "" : ` · SS304 welded mesh ${Math.round(spec.netting.mesh * 1000)} mm, screwed direct to steel`}`}
            />
          </dl>
          <h2 className="font-sans text-xs font-medium tracking-wide text-primary">6 m steel order</h2>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-xs">
            {steelOrder.map((line) => (
              <Fact key={line.section} label={line.section} value={line.order} />
            ))}
            <Fact label="Total, bars ordered" value={`≈ ${steelOrderMass.toFixed(2)} t`} />
            {cutOrder.map((line) => (
              <Fact key={line.section} label={`${line.section} (cut to length)`} value={line.order} />
            ))}
            {smallSteel.map((line) => (
              <Fact key={line.section} label={line.section} value={line.order} />
            ))}
            {connectionOrder.map((line) => (
              <Fact key={line.section} label={line.section} value={line.order} />
            ))}
            <Fact
              label="Total steel"
              value={`≈ ${steelTotalMass.toFixed(2)} t · bars, C sections, rods and anchor bolts (plates, sag rods and the connection parts above extra) · lighter cross purlins save ${Math.round(crossPurlinSaving)} kg`}
            />
          </dl>
          <p className="text-sm leading-relaxed text-muted">
            As in your sketch: two short verticals on each side, equally spaced between the W and the column. Each W is upside down, on the beam at 2 points and on the rafter at 3. The horizontal beam sits on the full 125 mm of each column and is spliced from a 6 m bar and a 4.25 m bar. At each column top the truss is held by a fork joint (the engineer must design it): in the shop, a 6 mm, 128 × 128 cap plate is welded on the column top and two fork plates, 125 wide × 225 × 6 mm, are welded upright on it, one each side of the heel and directly against it, flush with the column outside face, and the heel gets bored sleeves at the bolts; on site the truss drops between the fork plates and 2 preloaded M20 grade 8.8 bolts go through them and the heel, one through the rafter (top tie) and one through the horizontal beam (bottom tie) (Tan, 17 Oct 2026). The earlier 6 mm fork with 215 mm plates and 4 bolts failed the rough checks and this one has not been recomputed (see Safety). The column steel stops 6 mm under the truss seat, so the ceiling height is unchanged. Between the columns, just under that beam, a column tie of SHS 125×125×3.0 runs along each eave as the eave strut. It is the full width of the 125 mm column, flush with both its inside and outside faces, its top flush with the column top. There is no welding on site (Tan, 30 Sep): each tie is cut 5 mm short of each column and sits on a bracket, L75×75×6 cut 6 in (152.4 mm), whose L-shaped end is welded to the column side face in the fabricator's shop (the weld on the 4.5 mm wall and the 152 mm cantilever are not checked; the engineer must check them) with no holes through the column; the bracket projects straight out along the wall with its horizontal leg up and a fin hanging down on the inner side, and on site the tie is bolted down with 2 × M16 grade 8.8 bolts per end in line along the length (40 and 100 mm from the column) through the tie's bottom face into the leg, and plastic end caps close the tie ends. Side-wall cross bracing is still to be designed by an engineer; it is not in this model. ASC 12516 C-purlins follow the rafter slope, open side facing back inside, up the slope towards the ridge, with the web on the eave side. The column-line purlin's web is flush with the outside face of the column. A 5 in purlin bracket, 220 mm long with a 63.5 mm base and an 89 mm leg, is welded to the rafter. Four 14×22 slots bolt the purlin web. One is 150 mm from the ridge, one is flush at the column, four are spaced evenly between those two, and one is 150 mm from the tip. Each purlin runs 5 ft past the first rafter and 5 ft past the last. The purlins are not one continuous length: each line is cut into one 6 m piece per bay, butt-jointed over every inner rafter with a 5 mm gap, both ends bolted to the same bracket (2 bolts each), so each bay is a simple span; the piece in each end bay is longer and runs on past the end rafter to carry the 5 ft gable overhang. The roof is the MEGA RIB 35 PUR 25 mm panel, metal zincalume TCT 0.47 mm, on those purlins (option A, Tan, 1 Oct 2026: the insulation is in the roof): PU foam fills the ribs and runs 25 mm under the pans, with a flat metal backing underneath, and the sheet runs 150 mm past the tip of the rafter (Tan, 1 Oct 2026: cut from 1.5 ft so it cantilevers only 300 mm past the last purlin; the rafter is unchanged), its last 5 in bare sheet with the foam edge closed and sealed. The ceiling is plain Mega Rib 35, zincalume TCT 0.35 mm, with no foam, fitted RIBS DOWN (crests at 4.000 m clear) with its pans 1 mm under the truss beam; its side laps, its joints to the lining tops and the gaps round the truss beams are sealed, because the fans hold the house below the roof-space pressure. It is not walkable and no roof-space walking access is provided. Along each wall its edge pan is screwed up, on a sealant bead, into a galvanised edge angle (100×50×1.6) lying on the SHS column tie, so the edge is held and sealed between the cross purlins. The ceiling sheet cannot span the 6 m between frames on its own. The ridge cap is the 24 in zincalume capping, lapped along the ridge. A 12 mm tie rod links each pair of purlins at both third points of every 6 m bay, including across the ridge. A 12 mm galvanized cable forms a roof X in the first bay, the last bay, and the bays near 30 m and 66 m, on both slopes, fixed under the rafter from the column line to the ridge. Three lines of ASC 12516 run the house in 6.1 m pieces, so each one overlaps the horizontal beam at both ends. One piece sits flush on the left of the vertical and the next flush on the right, and an M10 bolt through both webs ties the pair at every frame. Each bay still has two cross purlins at 2 m and 4 m, now bearing on the SHS column ties at their ends and hung from the three long ceiling purlins by L50×50×5 hanger angles (2 × M10 each end, through vertical slots on the cross-purlin side so each cross purlin is set to a string line before tightening, then locked with 2 self-drilling screws) at every crossing, with the ceiling sheet screwed up to their bottom flanges (buildability fix 30 Sep: before, they hung 27 mm clear with only a notional packer). With the horizontal beams, the ceiling supports are 2 m apart. A 125 mm reinforced concrete wall runs both eaves, cast between and against the columns and flush with both of their faces, with one layer of Y10 bars at 320 mm each way in the middle of its thickness; the horizontal bars are welded to the columns before the pour. The wall is cast after the floor has cured, standing on the slab; its vertical bars run straight down 6 in (152 mm) below the finished floor top, through the 4 in slab (set in place before the slab is poured; no holes drilled). The floor is a 4 in slab on compacted soil with BRC A10 mesh (10 mm bars at 7 in each way, at mid-depth), cast in one pour with the column pads; each pad stands on a 4 ft × 4 ft × 4 in reinforced base with the same A10 mesh; there is no strip footing under the walls. The base plates sit on the pads with their tops 4 in below the finished floor, so the plates and anchor bolts are buried in the slab. The finished floor to the underside of the ceiling sheet is 4.000 m at the floor's high point. Its top is 36 in on the inside and 34 in on the outside, so water runs off the shed. Inside, both long walls are lined with the roof panel, MEGA RIB 35 PUR 25 mm, ribs vertical. It is fitted ribs in: the ribbed metal faces into the house and the flat metal-backed face faces out, against the girts. That flat face sits on the columns' inside-face plane, which is also the inside face of the wall, so the pans stand {Math.round(liningInfo.panInsideWall * 1000)} mm and the rib crests {(liningInfo.crestInsideWall * 1000).toFixed(1)} mm in from the concrete wall below. The panel runs from the wall top up to 2 mm under the ceiling's downward rib crests (sealant line). The ceiling sheet runs over it to the lining's pan line, so it closes the top of the wall panel, and it is set out so both of its edges land on a flat pan. Behind its flat metal-backed face, three rows of ASC 12520 wall girts run between the columns like the column ties, web on top and open side down so water cannot collect in them. Each girt is cut 5.865 m, 5 mm clear of each column, with its web holes punched by the supplier; it drops over an L75×75×6 bracket cut 4 in (101.6 mm), whose L-shaped end is welded to the column side face in the shop (not checked, engineer to check), projecting along the wall with its horizontal leg up under the web and a fin hanging down on the inner side, and is fixed on site with 2 × M12 bolts down through the web and the leg at each end, in line along the wall at 30 and 75 mm from the column face, in slots 14 wide × 22 long. The 127 mm depth runs out through the 125 mm column and stands 2 mm past its outside face. The bottom girt's bottom edge is 4 in (101.6 mm) above the wall top with nothing under it on the wall top; the other two follow at the same pitch (about 0.97 m) up to the SHS tie, which is the top support. Two M12 tie-rod lines per bay, at the third points of the girt span, each run in two pieces (one per girt gap, coupled on the middle girt's web) from the bottom girt up through the girts to the SHS column tie, on the tie's centre line, through the centre of each girt web, where each screws into a coupling nut on an M12 grade 4.6 bolt welded under the tie (16 mm hole, head against the underside, threads down, welded all round), so the girts are held straight and hung from the tie. The lining's top edge fixes into the inside face of the SHS column tie, so the lining spans about 0.97 m between supports; it laps 50 mm (2 in) down past the concrete wall's inside top edge like a skirt, 2 mm clear of the wall face, with no rib closure strips: the PU foam fills the ribs right to the panel ends, so there are no open rib voids; the exposed foam edge at the foot is sealed with a PU/silicone bead against wash-down water. There is no flashing: the concrete wall's top is a sloped cap, 914 mm on the inside falling 50 mm to the outside, so it sheds water by itself. The wall panels are foam the full length, with no bare strip, so the foam shows at the foot: it is sealed with a bead of PU or silicone sealant or a small bottom trim so wash-down water cannot soak into it. The panel laps about 2 in down over the wall's inner face, passing 2 mm clear of the concrete because the wall is flush with the columns' inside face; a sealant bead in that joint along the wall's top edge sends water on the back of the panel onto the sloped top. Above the wall, the gap between the top of the column tie and the underside of the roof purlin is closed with stainless steel 304 welded wire mesh with {Math.round(spec.netting.mesh * 1000)} mm holes, screwed direct to the steel with no extra framing, in the plane of the columns' outside face, where the tie and the column-line purlin are both flush. It runs bay by bay between the rafters along both sides, about {Math.round(nettingInfo.height * 1000)} mm high. At both ends, the triangle between ceiling level and the underside of the roof is closed on the outer face of the end truss, {nettingInfo.closure === "sheet" ? "with sheet" : "with the same SS304 mesh for now; it can be switched to sheet later"}.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border pb-2">
      <dt className="font-sans text-muted">{label}</dt>
      <dd className="mt-0.5 text-fg">{value}</dd>
    </div>
  );
}
