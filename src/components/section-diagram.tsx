import { derived, frameLayout, metres, spec, type FrameBar, type FramePoint } from "@/shed/geometry";

/** Same colours as the three.js materials in shed-viewer.tsx. */
const colour = {
  steel: "#b7c0c8",
  splice: "#6e787e",
  web: "#8ea398",
  concrete: "#9a958c",
  floor: "#7d7870",
  purlin: "#d7dbe0",
  roof: "#d5dbe2",
  foam: "#e6d7a2",
  netting: "#b4bbc1",
  ceiling: "#c5ccd2",
  cap: "#e4e8ea",
  girtEdge: "#56616a",
  knee: "#8a949b",
  bolt: "#1d4ed8",
  dim: "var(--color-primary)",
};

// The gable frame, as seen from the End view: the same member list the 3D viewer builds.
const frame = frameLayout(true);

const view = { zMin: -6.9, zMax: 6.9, yMin: -1.72, yMax: 6.22 };
const W = 290;
const k = W / (view.zMax - view.zMin);
const H = Math.round((view.yMax - view.yMin) * k);
const sx = (z: number) => (z - view.zMin) * k;
const sy = (y: number) => (view.yMax - y) * k;
const pt = (p: FramePoint) => `${sx(p.z).toFixed(2)},${sy(p.y).toFixed(2)}`;
const pts = (list: FramePoint[]) => list.map(pt).join(" ");
const add = (p: FramePoint, v: FramePoint, s: number): FramePoint => ({ z: p.z + v.z * s, y: p.y + v.y * s });

/** Outline of a straight member of in-plane depth `depth` between two centreline points. */
function barOutline(bar: FrameBar, depth: number): FramePoint[] {
  const dz = bar.b.z - bar.a.z;
  const dy = bar.b.y - bar.a.y;
  const len = Math.hypot(dz, dy) || 1;
  const n = { z: -dy / len, y: dz / len };
  return [add(bar.a, n, depth / 2), add(bar.b, n, depth / 2), add(bar.b, n, -depth / 2), add(bar.a, n, -depth / 2)];
}

function rect(z0: number, z1: number, y0: number, y1: number): FramePoint[] {
  return [
    { z: z0, y: y0 },
    { z: z1, y: y0 },
    { z: z1, y: y1 },
    { z: z0, y: y1 },
  ];
}

/** A dimension line between two points, offset along `normal`, with extension lines and a label. */
function Dim({
  a,
  b,
  normal,
  offset,
  label,
  textOffset = 0.1,
  anchor = "middle",
  at = 0.5,
}: {
  a: FramePoint;
  b: FramePoint;
  normal: FramePoint;
  offset: number;
  label: string;
  /** Text baseline distance from the line, along `normal`. Negative puts it on the member side. */
  textOffset?: number;
  anchor?: "start" | "middle" | "end";
  /** Where along the line the text sits, 0 = a, 1 = b. */
  at?: number;
}) {
  const a2 = add(a, normal, offset);
  const b2 = add(b, normal, offset);
  const ext = 0.08;
  const t = { z: b2.z - a2.z, y: b2.y - a2.y };
  const len = Math.hypot(t.z, t.y) || 1;
  const u = { z: t.z / len, y: t.y / len };
  const tick = 0.1;
  const tickDir = { z: (u.z + normal.z) / Math.SQRT2, y: (u.y + normal.y) / Math.SQRT2 };
  const mid = add(add(a2, u, len * at), normal, textOffset);
  // SVG y points down, so the screen angle is the negative of the model angle.
  let angle = (-Math.atan2(u.y, u.z) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  return (
    <g stroke={colour.dim} strokeWidth="0.6" fill="none">
      <line x1={sx(add(a, normal, 0.05).z)} y1={sy(add(a, normal, 0.05).y)} x2={sx(add(a2, normal, ext).z)} y2={sy(add(a2, normal, ext).y)} opacity="0.7" />
      <line x1={sx(add(b, normal, 0.05).z)} y1={sy(add(b, normal, 0.05).y)} x2={sx(add(b2, normal, ext).z)} y2={sy(add(b2, normal, ext).y)} opacity="0.7" />
      <line x1={sx(a2.z)} y1={sy(a2.y)} x2={sx(b2.z)} y2={sy(b2.y)} />
      {[a2, b2].map((p, i) => (
        <line
          key={i}
          x1={sx(add(p, tickDir, -tick / 2).z)}
          y1={sy(add(p, tickDir, -tick / 2).y)}
          x2={sx(add(p, tickDir, tick / 2).z)}
          y2={sy(add(p, tickDir, tick / 2).y)}
          strokeWidth="1"
        />
      ))}
      <text
        x={sx(mid.z)}
        y={sy(mid.y)}
        transform={`rotate(${angle.toFixed(2)} ${sx(mid.z).toFixed(2)} ${sy(mid.y).toFixed(2)})`}
        textAnchor={anchor}
        fill={colour.dim}
        stroke="none"
        fontSize="9"
      >
        {label}
      </text>
    </g>
  );
}

export function SectionDiagram() {
  const col = spec.column.side;
  const web = spec.web.side;
  const chordD = spec.rafter.depth;
  const pD = spec.purlin.depth;
  const pB = spec.purlin.flange;
  const rib = spec.roof.rib;
  const { zCol, zFace, yEdge, yColumnTop } = frame;
  const inner = zCol - col / 2;
  const zToe = zFace + spec.floor.toe;

  // Dimension geometry.
  const right = frame.rafters[1];
  const left = frame.rafters[0];
  const rightNormal = { z: frame.sin, y: frame.cos };
  const leftNormal = { z: -frame.sin, y: frame.cos };
  const aboveRoof = spec.purlin.depth + spec.roof.roofFoam + spec.roof.rib + 0.36;
  const ridgeTop = right.outline[2];
  const tipTopR = right.outline[1];
  const tipTopL = left.outline[1];
  // Point on the left rafter's top edge directly above the column centreline.
  const topAt = (z: number) => frame.yRidge + frame.halfD / frame.cos - Math.abs(z) * Math.tan(derived.pitch);
  const overColumn = { z: -zCol, y: topAt(zCol) };
  const heightZ = -(zFace + 0.3);

  return (
    <figure className="flex flex-col gap-1.5">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Cross section of one portal frame, drawn from the same member layout as the 3D model"
        fontFamily="var(--font-sans)"
      >
        {/* Ground line */}
        <line x1={sx(view.zMin + 0.2)} y1={sy(0)} x2={sx(view.zMax - 0.2)} y2={sy(0)} stroke="var(--color-border)" strokeWidth="0.8" />

        {/* Pads, slab, base plates, columns */}
        {frame.pads.map((p) => (
          <g key={`padbase${p.z}`}>
            <polygon
              points={pts(rect(p.z - spec.padBase.side / 2, p.z + spec.padBase.side / 2, p.top - spec.concrete.depth - spec.padBase.depth, p.top - spec.concrete.depth))}
              fill={colour.concrete}
              opacity="0.85"
            />
            <line
              x1={sx(p.z - spec.padBase.side / 2 + 0.05)}
              y1={sy(p.top - spec.concrete.depth - spec.padBase.depth / 2)}
              x2={sx(p.z + spec.padBase.side / 2 - 0.05)}
              y2={sy(p.top - spec.concrete.depth - spec.padBase.depth / 2)}
              stroke="#8a5a3c"
              strokeWidth="0.8"
              strokeDasharray="2 1.5"
            />
          </g>
        ))}
        {frame.pads.map((p) => {
          const h = spec.concrete.side / 2 - spec.padCage.cover;
          const yb = p.top - spec.concrete.depth + spec.padCage.cover;
          const yt = p.top - spec.padCage.cover;
          return (
            <g key={`pad${p.z}`}>
              <polygon
                points={pts(rect(p.z - spec.concrete.side / 2, p.z + spec.concrete.side / 2, p.top - spec.concrete.depth, p.top))}
                fill={colour.concrete}
                opacity="0.85"
              />
              {/* Open-top Y12 cage: U-bar and the two rings (Tan, 29 Sep 5:18 PM) */}
              <polyline
                points={pts([{ z: p.z - h, y: yt }, { z: p.z - h, y: yb }, { z: p.z + h, y: yb }, { z: p.z + h, y: yt }])}
                fill="none"
                stroke="#8a5a3c"
                strokeWidth="0.9"
              />
              {spec.padCage.rings.flatMap((r) =>
                [-1, 1].map((s) => (
                  <circle key={`ring${r}${s}`} cx={sx(p.z + s * (h - 0.012))} cy={sy(p.top - spec.concrete.depth + r)} r="0.9" fill="#8a5a3c" />
                )),
              )}
            </g>
          );
        })}
        {/* Floor slab (4 in, following the fall) */}
        <polygon
          points={pts([
            { z: -zToe, y: 0 },
            { z: -zFace, y: 0 },
            { z: 0, y: frame.yCenter - spec.floor.thickness },
            { z: zFace, y: 0 },
            { z: zToe, y: 0 },
            { z: zToe, y: yEdge },
            { z: zFace, y: yEdge },
            { z: 0, y: frame.yCenter },
            { z: -zFace, y: yEdge },
            { z: -zToe, y: yEdge },
          ])}
          fill={colour.floor}
        />
        {/* Floor mesh at mid-depth (dashed) and the wall's vertical bars running 6 in below the floor top */}
        <polyline
          points={pts(
            [-zToe + 0.05, -zFace, 0, zFace, zToe - 0.05].map((z) => ({
              z,
              y: (Math.abs(z) >= zFace ? yEdge : frame.yCenter - ((frame.yCenter - yEdge) * Math.abs(z)) / zFace) - spec.floor.thickness / 2,
            })),
          )}
          fill="none"
          stroke="#8a5a3c"
          strokeWidth="0.8"
          strokeDasharray="2 1.5"
        />
        {[-1, 1].map((sign) => (
          <line
            key={`wallbar${sign}`}
            x1={sx(sign * (zFace - spec.wall.thickness / 2))}
            y1={sy(yEdge - spec.wallMesh.below)}
            x2={sx(sign * (zFace - spec.wall.thickness / 2))}
            y2={sy(yEdge + spec.wall.inside - spec.wallMesh.topCover)}
            stroke="#8a5a3c"
            strokeWidth="1"
          />
        ))}
        {frame.plates.map((p) => (
          <polygon
            key={`plate${p.z}`}
            points={pts(rect(p.z - spec.basePlate.side / 2, p.z + spec.basePlate.side / 2, p.top - spec.basePlate.thickness, p.top))}
            fill={colour.steel}
            stroke={colour.steel}
            strokeWidth="0.6"
          />
        ))}
        {frame.columns.map((c) => (
          <polygon key={`col${c.z}`} points={pts(rect(c.z - col / 2, c.z + col / 2, c.bottom, c.top))} fill={colour.steel} />
        ))}

        {/* Ceiling sheet (option A, Tan 1 Oct 2026): plain Mega Rib 30, no foam, ribs down (crests at 4.0065 clear), hung 1 mm under the beam */}
        <line
          x1={sx(frame.ceiling.z0)}
          y1={sy(frame.ceiling.y - spec.ceilingSheet.rib / 2)}
          x2={sx(frame.ceiling.z1)}
          y2={sy(frame.ceiling.y - spec.ceilingSheet.rib / 2)}
          stroke={colour.ceiling}
          strokeWidth="1.1"
          strokeDasharray="2.4 1.2"
        />

        {/* Wall lining: the roof panel on the inside faces of the columns, ribs in (skin line), foam out */}
        {frame.lining.map((l) => (
          <g key={`lining${l.sign}`}>
            <polygon
              points={pts(rect(Math.min(l.zFoamFace, l.zPan), Math.max(l.zFoamFace, l.zPan), l.y0, l.y1))}
              fill={colour.foam}
              stroke={colour.foam}
              strokeWidth="0.4"
            />
            <line
              x1={sx((l.zPan + l.zCrest) / 2)}
              y1={sy(l.y0)}
              x2={sx((l.zPan + l.zCrest) / 2)}
              y2={sy(l.y1)}
              stroke={colour.roof}
              strokeWidth="0.9"
            />
          </g>
        ))}
        {/* Wall girts between the columns: C marks, web on top and open side down */}
        {frame.girts.map((g) => {
          const dir = Math.sign(g.zOut - g.zIn);
          const toe = spec.purlin.lip * 1.6;
          return (
            <polyline
              key={`girt${g.sign}${g.yTop}`}
              points={pts([
                { z: g.zIn + dir * toe, y: g.yBottom },
                { z: g.zIn, y: g.yBottom },
                { z: g.zIn, y: g.yTop },
                { z: g.zOut, y: g.yTop },
                { z: g.zOut, y: g.yBottom },
                { z: g.zOut - dir * toe, y: g.yBottom },
              ])}
              fill="none"
              stroke={colour.girtEdge}
              strokeWidth="0.55"
            />
          );
        })}
        {/* SHS 125 column tie between the columns (behind the section cut): dashed outline over the column top */}
        {frame.columns.map((c) => (
          <polygon
            key={`tie${c.z}`}
            points={pts(rect(c.z - col / 2, c.z + col / 2, frame.tieBottom, yColumnTop))}
            fill="none"
            stroke={colour.girtEdge}
            strokeWidth="0.55"
            strokeDasharray="1.2 0.8"
          />
        ))}
        {/* Ceiling edge angle (behind the section cut, between the columns): flat leg from the wall plane over the gap and the sheet's edge, 127 mm leg down on the wall side */}
        {frame.columns.map((c) => {
          const ce = spec.ceilingEdge;
          const dir = -Math.sign(c.z);
          const wall = c.z + dir * (col / 2);
          const yTop = frame.ceiling.top + ce.thickness;
          return (
            <polyline
              key={`edge${c.z}`}
              points={pts([
                { z: wall, y: yTop - ce.up },
                { z: wall, y: yTop },
                { z: wall + dir * ce.flat, y: yTop },
              ])}
              fill="none"
              stroke={colour.girtEdge}
              strokeWidth="0.55"
              strokeDasharray="1.2 0.8"
            />
          );
        })}

        {/* Horizontal beam (two bars) and its splice */}
        {frame.beam.pieces.map((bar, i) => (
          <polygon key={`beam${i}`} points={pts(barOutline(bar, chordD))} fill={colour.steel} />
        ))}
        <polygon points={pts(barOutline(frame.beam.splice, chordD + frame.beam.spliceOversize))} fill={colour.splice} />

        {/* Web members: verticals and the two upside-down W */}
        {[...frame.verticals, ...frame.wWebs].map((bar, i) => (
          <polygon key={`web${i}`} points={pts(barOutline(bar, web))} fill={colour.web} stroke={colour.web} strokeWidth="0.25" />
        ))}

        {/* Rafters: square cut at the eave (3 mm end cover plate), plumb cut at the ridge */}
        {frame.rafters.map((r) => (
          <g key={`rafter${r.sign}`} fill={colour.steel}>
            <polygon points={pts(r.outline)} />
          </g>
        ))}
        {/* RHS end cover plates, seal-welded: rafter eave tips and beam ends */}
        {frame.endPlates.map((ep, i) => {
          const h = spec.rafter.depth / 2;
          return (
            <line key={`ep${i}`} x1={sx(ep.centre.z - ep.up.z * h)} y1={sy(ep.centre.y - ep.up.y * h)} x2={sx(ep.centre.z + ep.up.z * h)} y2={sy(ep.centre.y + ep.up.y * h)} stroke={colour.knee} strokeWidth="0.8" />
          );
        })}

        {/* Knee (OPTION 2 fork joint): cap plate on the column top, the near fin over the heel, and its 4 bolts */}
        {frame.knee.map((kn) => (
          <g key={`knee${kn.z}`}>
            <polygon points={pts(rect(kn.z - kn.capSide / 2, kn.z + kn.capSide / 2, kn.capBottom, kn.capTop))} fill={colour.knee} />
            <polygon points={pts(rect(kn.z0, kn.z1, kn.y0, kn.y1))} fill={colour.knee} fillOpacity="0.85" stroke={colour.girtEdge} strokeWidth="0.3" />
            {kn.bolts.map((b) => (
              <circle key={`kb${b.z}${b.y}`} cx={sx(b.z)} cy={sy(b.y)} r="0.9" fill={colour.bolt} />
            ))}
          </g>
        ))}

        {/* Purlins sitting on the rafters: C marks, web on the eave side, open side up the slope (facing inside) */}
        {frame.purlins.map((p) => {
          const lip = spec.purlin.lip * 1.6;
          const top = add(p.origin, p.normal, pD);
          return (
            <polyline
              key={`purlin${p.sign}${p.zAbs}`}
              points={pts([
                add(add(p.origin, p.upslope, pB), p.normal, lip),
                add(p.origin, p.upslope, pB),
                p.origin,
                top,
                add(top, p.upslope, pB),
                add(add(top, p.upslope, pB), p.normal, -lip),
              ])}
              fill="none"
              stroke={colour.purlin}
              strokeWidth="0.7"
            />
          );
        })}

        {/* Eave netting: outside face of the columns, from the tie top up to the purlin underside */}
        {frame.eaveNetting.map((n) => (
          <line
            key={`net${n.sign}`}
            x1={sx(n.z)}
            y1={sy(n.y0)}
            x2={sx(n.z)}
            y2={sy(n.y1)}
            stroke={colour.netting}
            strokeWidth="0.8"
            strokeDasharray="1.2 0.9"
          />
        ))}

        {/* Roof panel (option A, Tan 1 Oct 2026): foam filling the ribs (drawn up to the mid-rib skin line), 25 mm under the
            pans, metal backing underneath; the last bareTip at the eave is bare sheet */}
        {frame.roof.map((r) => {
          const at = (t: number, h: number) => add(add(r.origin, r.upslope, t), r.normal, h);
          return (
            <g key={`roof${r.sign}`}>
              <polygon
                points={pts([at(r.from + r.bareTip, r.foamBottom), at(r.to, r.foamBottom), at(r.to, r.skin + rib / 2), at(r.from + r.bareTip, r.skin + rib / 2)])}
                fill={colour.foam}
                stroke={colour.foam}
                strokeWidth="0.4"
              />
              <line
                x1={sx(at(r.from, r.skin + rib / 2).z)}
                y1={sy(at(r.from, r.skin + rib / 2).y)}
                x2={sx(at(r.to, r.skin + rib / 2).z)}
                y2={sy(at(r.to, r.skin + rib / 2).y)}
                stroke={colour.roof}
                strokeWidth="1.1"
              />
            </g>
          );
        })}

        {/* Ridge cap */}
        {[-1, 1].map((sign) => {
          const crease = { z: 0, y: frame.ridgeCap.yCrease };
          const end = { z: sign * frame.cos * frame.ridgeCap.wing, y: frame.ridgeCap.yCrease - frame.sin * frame.ridgeCap.wing };
          const hem = { z: end.z, y: end.y - frame.ridgeCap.lip };
          return <polyline key={`cap${sign}`} points={pts([crease, end, hem])} fill="none" stroke={colour.cap} strokeWidth="1" />;
        })}

        {/* Dimensions, all outside the members */}
        <Dim
          a={ridgeTop}
          b={tipTopR}
          normal={rightNormal}
          offset={aboveRoof}
          label={`rafter ${metres(spec.rafterLength)} (top edge)`}
          at={0.47}
        />
        <Dim
          a={tipTopL}
          b={overColumn}
          normal={leftNormal}
          offset={aboveRoof}
          label={`overhang ${metres(derived.overhangSlope)}`}
          anchor="start"
          at={0}
        />
        <Dim
          a={{ z: -zFace, y: yEdge }}
          b={{ z: -zFace, y: yColumnTop }}
          normal={{ z: -1, y: 0 }}
          offset={0.3}
          label={`${metres(spec.eaveAtColumn)} to column top`}
        />
        <Dim
          a={{ z: 0.9, y: frame.yCenter }}
          b={{ z: 0.9, y: frame.ceiling.y - spec.ceilingSheet.rib }}
          normal={{ z: 1, y: 0 }}
          offset={0}
          label={`${metres(spec.ceilingClear)} floor to ceiling`}
        />
        <Dim
          a={{ z: -inner, y: -0.3 }}
          b={{ z: inner, y: -0.3 }}
          normal={{ z: 0, y: -1 }}
          offset={0.45}
          label={`${metres(spec.columnCentres - col)} clear inside`}
          textOffset={-0.1}
        />
        <Dim
          a={{ z: -zCol, y: -0.3 }}
          b={{ z: zCol, y: -0.3 }}
          normal={{ z: 0, y: -1 }}
          offset={1.15}
          label={`${metres(spec.columnCentres)} column centres`}
          textOffset={-0.1}
        />
      </svg>
      <figcaption className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] leading-none text-muted">
        {[
          ["Steel frame", colour.steel],
          ["Webs", colour.web],
          ["Purlins", colour.purlin],
          ["Roof panel foam", colour.foam],
          ["Ceiling", colour.ceiling],
          ["Wall lining (roof panel)", colour.foam],
          ["Wall girts, SHS tie (dashed)", colour.girtEdge],
          ["Eave mesh (SS304)", colour.netting],
          ["Concrete", colour.concrete],
          ["Knee fork plates (6 mm, flush outside) + M20 bolts; RHS end plates", colour.knee],
          ["Tie and girt brackets project along the wall from each column (see the 3D view)", colour.girtEdge],
        ].map(([label, fill]) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: fill }} />
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
