"use client";

import { OutfitSlot, PetKind, PropKind } from "@/lib/pets";

type Outfit = Partial<Record<OutfitSlot, string>>;

// Cute, *alive* SVG pets: gentle idle bob + blinking, a wagging tail for the
// happy wolf, softly swaying ears for the rabbit, plus equippable outfits.

export function WolfArt({
  pose = "happy",
  outfit,
  hold,
  size = 190,
}: {
  pose?: "happy" | "droopy" | "waiting";
  outfit?: Outfit;
  hold?: PropKind;
  size?: number;
}) {
  const earDown = pose !== "happy";
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
      <g className="pet-bob">
        <g className={pose === "happy" ? "tail-wag" : undefined}>
          <path
            d={
              pose === "happy"
                ? "M150 150 Q188 120 178 158 Q170 176 146 164 Z"
                : "M150 156 Q184 156 176 182 Q166 190 146 172 Z"
            }
            fill="#40404a"
          />
          <path
            d={
              pose === "happy"
                ? "M156 152 Q178 138 174 158 Q168 168 152 160 Z"
                : "M156 160 Q176 162 170 178 Q162 182 152 170 Z"
            }
            fill="#5a5a64"
          />
        </g>

        <ellipse cx="100" cy="151" rx="45" ry="40" fill="#40404a" />
        <ellipse cx="100" cy="157" rx="24" ry="29" fill="#5a5a64" />
        <ellipse cx="82" cy="185" rx="13" ry="9" fill="#37373f" />
        <ellipse cx="118" cy="185" rx="13" ry="9" fill="#37373f" />

        {earDown ? (
          <>
            <path d="M62 78 L44 112 L84 92 Z" fill="#454550" />
            <path d="M138 78 L156 112 L116 92 Z" fill="#454550" />
          </>
        ) : (
          <>
            <path d="M64 62 L52 20 L92 54 Z" fill="#454550" />
            <path d="M136 62 L148 20 L108 54 Z" fill="#454550" />
            <path d="M70 58 L62 34 L86 54 Z" fill="#7a6b70" />
            <path d="M130 58 L138 34 L114 54 Z" fill="#7a6b70" />
          </>
        )}

        {/* clothes drawn under the head, over the body */}
        <OutfitPiece outfit={outfit} layer="clothes" cx={100} neckY={137} bodyY={150} eyeY={94} petKind="wolf" topW={39} hemW={37} topY={148} hemY={180} />

        <circle cx="100" cy="96" r="48" fill="#4a4a55" />
        <ellipse cx="64" cy="108" rx="14" ry="12" fill="#565661" />
        <ellipse cx="136" cy="108" rx="14" ry="12" fill="#565661" />
        <circle cx="66" cy="112" r="7" fill="#e79aa6" opacity="0.5" />
        <circle cx="134" cy="112" r="7" fill="#e79aa6" opacity="0.5" />

        {pose === "waiting" ? (
          <>
            <path d="M76 96 q8 -8 16 0" stroke="#15151a" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M108 96 q8 -8 16 0" stroke="#15151a" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <g className="pet-blink">
            <ellipse cx="82" cy="94" rx="8" ry="9.5" fill="#17171c" />
            <ellipse cx="118" cy="94" rx="8" ry="9.5" fill="#17171c" />
            <circle cx="85" cy="90" r="2.6" fill="#fff" />
            <circle cx="121" cy="90" r="2.6" fill="#fff" />
          </g>
        )}

        <ellipse cx="100" cy="116" rx="17" ry="12" fill="#61616c" />
        <ellipse cx="100" cy="110" rx="6" ry="4.5" fill="#17171c" />
        <path d="M100 114 v7" stroke="#17171c" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M100 121 q-6 5 -12 3 M100 121 q6 5 12 3" stroke="#2c2c33" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* accessories/hat/scarf on top */}
        <OutfitPiece outfit={outfit} layer="top" cx={100} neckY={137} bodyY={150} eyeY={94} hatTopY={50} />

        {/* a little something the wolf is playing with */}
        {hold && <HeldProp kind={hold} cx={100} y={168} pawColor="#4a4a55" />}
      </g>
    </svg>
  );
}

export function RabbitArt({
  grumpy = false,
  hiding = false,
  happy = false,
  outfit,
  hold,
  size = 190,
}: {
  grumpy?: boolean;
  hiding?: boolean;
  happy?: boolean;
  outfit?: Outfit;
  hold?: PropKind;
  size?: number;
}) {
  // 炸毛缩窝: the bunny curled into a smooth round loaf inside a little nest,
  // ears flopped back, with a teary but cute sulky face. Clean lines — no
  // scalloped/dumpling edge.
  if (hiding) {
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
        <g className="pet-bob">
          {/* little nest */}
          <ellipse cx="100" cy="168" rx="66" ry="20" fill="#efe3d6" />
          <ellipse cx="100" cy="163" rx="60" ry="16" fill="#f6ede2" />
          {/* floppy ears laid back over the loaf */}
          <path d="M74 96 Q60 84 58 104 Q57 122 74 120 Q80 110 84 104 Z" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <path d="M126 96 Q140 84 142 104 Q143 122 126 120 Q120 110 116 104 Z" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <path d="M70 98 Q62 92 62 104 Q62 114 72 114" stroke="#f7ccd9" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M130 98 Q138 92 138 104 Q138 114 128 114" stroke="#f7ccd9" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* smooth curled body (a soft rounded loaf) */}
          <path
            d="M46 138 Q46 104 100 104 Q154 104 154 138 Q154 160 100 160 Q46 160 46 138 Z"
            fill="#ffffff"
            stroke="#ece7e4"
            strokeWidth="2"
          />
          {/* rosy cheeks */}
          <ellipse cx="72" cy="138" rx="11" ry="8" fill="#fbd0dd" />
          <ellipse cx="128" cy="138" rx="11" ry="8" fill="#fbd0dd" />
          {/* teary, upset-but-cute eyes */}
          <circle cx="85" cy="132" r="7.5" fill="#3a3237" />
          <circle cx="115" cy="132" r="7.5" fill="#3a3237" />
          <circle cx="87.5" cy="129" r="2.4" fill="#fff" />
          <circle cx="117.5" cy="129" r="2.4" fill="#fff" />
          {/* welling tears */}
          <path d="M78 138 q-3 6 0 9 q3 -3 0 -9" fill="#bfe0f0" opacity="0.9" />
          <path d="M122 138 q3 6 0 9 q-3 -3 0 -9" fill="#bfe0f0" opacity="0.9" />
          {/* tiny symmetric pink crown mouth */}
          <path d="M95 145 L97.5 141 L100 145 L102.5 141 L105 145 Q105 150 100 151 Q95 150 95 145 Z" fill="#f2a0bb" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
      <g className="pet-bob">
        {/* upright ears, close together on top of the head */}
        <g className={grumpy ? undefined : "ear-sway"}>
          <ellipse cx="90" cy="52" rx="11" ry="30" transform="rotate(-7 90 80)" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <ellipse cx="110" cy="52" rx="11" ry="30" transform="rotate(7 110 80)" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <ellipse cx="90" cy="54" rx="5" ry="20" transform="rotate(-7 90 80)" fill="#f7ccd9" />
          <ellipse cx="110" cy="54" rx="5" ry="20" transform="rotate(7 110 80)" fill="#f7ccd9" />
        </g>

        {/* small tucked body */}
        <ellipse cx="100" cy="160" rx="38" ry="26" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
        <ellipse cx="82" cy="182" rx="11" ry="7" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
        <ellipse cx="118" cy="182" rx="11" ry="7" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />

        <OutfitPiece outfit={outfit} layer="clothes" cx={100} neckY={150} bodyY={156} eyeY={113} petKind="rabbit" topW={25} hemW={31} topY={153} hemY={179} />

        {/* soft rounded face — a gentle oval between too-flat and too-round */}
        <ellipse cx="100" cy="108" rx="52" ry="41" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />

        {grumpy ? (
          <>
            {/* cute-mad: puffed rosy cheeks + short soft frowny brows */}
            <ellipse cx="67" cy="120" rx="13" ry="9" fill="#fbc4d3" />
            <ellipse cx="133" cy="120" rx="13" ry="9" fill="#fbc4d3" />
            <path d="M76 100 l13 4" stroke="#c79aa0" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M124 100 l-13 4" stroke="#c79aa0" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <circle cx="83" cy="113" r="8" fill="#3a3237" />
            <circle cx="117" cy="113" r="8" fill="#3a3237" />
            <circle cx="85.6" cy="110" r="2.4" fill="#fff" />
            <circle cx="119.6" cy="110" r="2.4" fill="#fff" />
            {/* small symmetric pouty crown mouth */}
            <path d="M94 126 L96.5 122 L100 126 L103.5 122 L106 126 Q106 131 100 132 Q94 131 94 126 Z" fill="#f2a0bb" />
            {/* little anger puff by the ear */}
            <path d="M142 90 q6 -2 4 5 q6 -1 2 6" stroke="#e6a7b4" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="67" cy="122" rx="12" ry="8" fill="#fbd0dd" />
            <ellipse cx="133" cy="122" rx="12" ry="8" fill="#fbd0dd" />
            {/* tiny "ii" marks above the nose — the signature blank-cute look */}
            <path d="M95 90 v7 M105 90 v7" stroke="#c3ada2" strokeWidth="2.4" strokeLinecap="round" />
            <g className="pet-blink">
              <circle cx="81" cy="113" r="9" fill="#3a3237" />
              <circle cx="119" cy="113" r="9" fill="#3a3237" />
              <circle cx="84" cy="109.5" r="2.8" fill="#fff" />
              <circle cx="122" cy="109.5" r="2.8" fill="#fff" />
            </g>
            {happy ? (
              <>
                {/* happiest: tiny nose + rounded cat mouth (ω / 猫猫嘴) */}
                <path d="M96 119 L104 119 L100 124 Z" fill="#f2a0bb" />
                <path d="M91 125 Q95.5 132 100 126 Q104.5 132 109 125" stroke="#e08aa0" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              </>
            ) : (
              /* little symmetric pink crown mouth (centred on x=100) */
              <path d="M93 123 L96.5 118 L100 123 L103.5 118 L107 123 Q107 131 100 132 Q93 131 93 123 Z" fill="#f2a0bb" stroke="#e485a6" strokeWidth="1" />
            )}
          </>
        )}
        <path d="M53 118 h-13 M55 124 h-13 M147 118 h13 M145 124 h13" stroke="#e2dcd8" strokeWidth="1.5" strokeLinecap="round" />

        <OutfitPiece outfit={outfit} layer="top" cx={100} neckY={150} bodyY={158} eyeY={113} hatTopY={64} />

        {/* a little something the rabbit is playing with */}
        {hold && <HeldProp kind={hold} cx={100} y={172} pawColor="#ffffff" />}
      </g>
    </svg>
  );
}

// A small prop the pet holds/plays with in front of its belly, with two little
// paws hugging it so it reads as "held". Soft pastel palette + warm outline.
function HeldProp({
  kind,
  cx,
  y,
  pawColor,
}: {
  kind: PropKind;
  cx: number;
  y: number;
  pawColor: string;
}) {
  const OUT = "#b79b86"; // warm soft outline
  let item: React.ReactNode = null;
  if (kind === "plush") {
    item = (
      <g>
        <ellipse cx={cx} cy={y + 6} rx="12" ry="11" fill="#f4dcc6" stroke={OUT} strokeWidth="1.6" />
        <circle cx={cx} cy={y - 7} r="9" fill="#f7e2d0" stroke={OUT} strokeWidth="1.6" />
        <circle cx={cx - 8} cy={y - 14} r="4.5" fill="#f7e2d0" stroke={OUT} strokeWidth="1.4" />
        <circle cx={cx + 8} cy={y - 14} r="4.5" fill="#f7e2d0" stroke={OUT} strokeWidth="1.4" />
        <circle cx={cx - 3.5} cy={y - 8} r="1.4" fill="#7a6455" />
        <circle cx={cx + 3.5} cy={y - 8} r="1.4" fill="#7a6455" />
        <circle cx={cx} cy={y - 4} r="1.6" fill="#e79aa6" />
      </g>
    );
  } else if (kind === "ball") {
    item = (
      <g>
        <circle cx={cx} cy={y} r="12" fill="#f6c2d2" stroke={OUT} strokeWidth="1.6" />
        <path d={`M${cx - 11} ${y - 3} Q${cx} ${y - 8} ${cx + 11} ${y - 3}`} stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d={`M${cx - 11} ${y + 4} Q${cx} ${y + 9} ${cx + 11} ${y + 4}`} stroke="#e79ab4" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    );
  } else if (kind === "balloon") {
    item = (
      <g>
        <path d={`M${cx} ${y + 8} q6 -6 0 -14`} stroke={OUT} strokeWidth="1.2" fill="none" />
        <ellipse cx={cx} cy={y - 10} rx="11" ry="13" fill="#a9d6ea" stroke="#8fc2da" strokeWidth="1.4" />
        <path d={`M${cx - 4} ${y - 14} q3 -4 7 -1`} stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>
    );
  } else if (kind === "book") {
    item = (
      <g>
        <rect x={cx - 13} y={y - 9} width="26" height="19" rx="3" fill="#cfe3cd" stroke={OUT} strokeWidth="1.6" />
        <path d={`M${cx} ${y - 9} v19`} stroke={OUT} strokeWidth="1.4" />
        <path d={`M${cx - 9} ${y - 3} h6 M${cx + 3} ${y - 3} h6`} stroke="#a7c4a3" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    );
  } else if (kind === "carrot") {
    item = (
      <g>
        <path d={`M${cx - 8} ${y - 6} L${cx + 8} ${y - 6} L${cx} ${y + 13} Z`} fill="#f0a860" stroke="#d98f45" strokeWidth="1.4" />
        <path d={`M${cx - 6} ${y - 1} h12 M${cx - 4} ${y + 4} h8`} stroke="#e0975a" strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M${cx} ${y - 6} l-6 -9 M${cx} ${y - 6} l0 -11 M${cx} ${y - 6} l6 -9`} stroke="#8bc06a" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  } else if (kind === "bone") {
    item = (
      <g>
        <rect x={cx - 11} y={y - 3} width="22" height="6" rx="3" fill="#f6efe4" stroke={OUT} strokeWidth="1.4" />
        <circle cx={cx - 11} cy={y - 4} r="4" fill="#f6efe4" stroke={OUT} strokeWidth="1.4" />
        <circle cx={cx - 11} cy={y + 4} r="4" fill="#f6efe4" stroke={OUT} strokeWidth="1.4" />
        <circle cx={cx + 11} cy={y - 4} r="4" fill="#f6efe4" stroke={OUT} strokeWidth="1.4" />
        <circle cx={cx + 11} cy={y + 4} r="4" fill="#f6efe4" stroke={OUT} strokeWidth="1.4" />
      </g>
    );
  }
  return (
    <g>
      {item}
      {/* little paws hugging the prop */}
      <ellipse cx={cx - 13} cy={y + 8} rx="6" ry="5" fill={pawColor} stroke="#e4ddd6" strokeWidth="1.4" />
      <ellipse cx={cx + 13} cy={y + 8} rx="6" ry="5" fill={pawColor} stroke="#e4ddd6" strokeWidth="1.4" />
    </g>
  );
}

// Points string for a 5-pointed star centred at (x, y).
function starPoints(x: number, y: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

// Draws equipped outfit pieces. "clothes" layer sits behind the head; "top"
// layer (hat / scarf / accessory) sits above everything.
function OutfitPiece({
  outfit,
  layer,
  cx,
  neckY,
  bodyY,
  eyeY,
  hatTopY = 50,
  petKind = "wolf",
  topW = 40,
  hemW = 44,
  topY = 146,
  hemY = 182,
}: {
  outfit?: Outfit;
  layer: "clothes" | "top";
  cx: number;
  neckY: number;
  bodyY: number;
  eyeY: number;
  hatTopY?: number;
  // Torso geometry so clothes cover the body: half-widths at the shoulders
  // (top, tucked under the chin) and at the hem (bottom), plus those Y lines.
  // topW < hemW gives an A-line (narrow-top / wide-bottom) silhouette.
  petKind?: PetKind;
  topW?: number;
  hemW?: number;
  topY?: number;
  hemY?: number;
}) {
  if (!outfit) return null;
  const parts: React.ReactNode[] = [];

  if (layer === "clothes") {
    const TW = topW; // half-width at shoulders (narrow)
    const HW = hemW; // half-width at hem (wide → A-line)
    const T = topY;
    const B = hemY;
    // Distinct palettes so the two pets never wear the same colours.
    const rab = petKind === "rabbit";
    const C = {
      vest: rab ? { f: "#f2c3d2", s: "#e0a1b5" } : { f: "#a7c6d8", s: "#89aec6" },
      hoodie: rab ? { f: "#f6cdb6", s: "#e6b096" } : { f: "#a9c4b6", s: "#8caf9d" },
      overalls: rab ? { f: "#f4d68f", s: "#e3bf6e" } : { f: "#9cbcd8", s: "#82a5c6" },
      dress: { f: "#f6c6d8", s: "#e6a6bf" },
      cape: { f: "#ec9a9a", s: "#d97f7f" },
    };
    // A body panel with clean straight-tapered sides and a soft rounded hem.
    // topW≈hemW → a normal straight top; hemW>topW → a gentle A-line.
    const aline = (f: string, s: string, key: string) => (
      <path
        key={key}
        d={`M${cx - TW} ${T} Q${cx} ${T + 12} ${cx + TW} ${T} L${cx + HW} ${B - 6} Q${cx} ${B + 8} ${cx - HW} ${B - 6} Z`}
        fill={f}
        stroke={s}
        strokeWidth="1.6"
      />
    );
    if (outfit.clothes === "vest") {
      parts.push(aline(C.vest.f, C.vest.s, "vest"));
    } else if (outfit.clothes === "cape") {
      // wolf-only hero cape draped behind the shoulders
      parts.push(
        <g key="cape">
          <path d={`M${cx - TW * 0.85} ${T} Q${cx} ${B + 6} ${cx + TW * 0.85} ${T} L${cx + HW + 4} ${B + 10} Q${cx} ${B - 2} ${cx - HW - 4} ${B + 10} Z`} fill={C.cape.f} stroke={C.cape.s} strokeWidth="1.6" />
          <rect x={cx - TW * 0.8} y={T - 5} width={TW * 1.6} height="10" rx="5" fill={C.cape.s} />
        </g>
      );
    } else if (outfit.clothes === "dress") {
      // fitted bodice + extra-flared skirt (very A-line)
      const waist = T + (B - T) * 0.4;
      parts.push(
        <g key="dress">
          <path
            d={`M${cx - TW} ${T} Q${cx} ${T + 12} ${cx + TW} ${T} L${cx + TW} ${waist} L${cx + HW + 3} ${B} Q${cx} ${B + 8} ${cx - HW - 3} ${B} L${cx - TW} ${waist} Z`}
            fill={C.dress.f}
            stroke={C.dress.s}
            strokeWidth="1.6"
          />
          <circle cx={cx - 12} cy={waist + 10} r="2.6" fill="#fff" />
          <circle cx={cx + 8} cy={waist + 17} r="2.6" fill="#fff" />
          <circle cx={cx + 15} cy={waist + 5} r="2.6" fill="#fff" />
          <circle cx={cx - 3} cy={waist + 20} r="2.6" fill="#fff" />
        </g>
      );
    } else if (outfit.clothes === "hoodie") {
      const pocketY = T + (B - T) * 0.58;
      parts.push(
        <g key="hoodie">
          {aline(C.hoodie.f, C.hoodie.s, "hd")}
          <path d={`M${cx - TW * 0.7} ${T} Q${cx} ${T + 15} ${cx + TW * 0.7} ${T}`} stroke={C.hoodie.s} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d={`M${cx - HW * 0.45} ${pocketY} h${HW * 0.9} v10 q${-HW * 0.45} 7 ${-HW * 0.9} 0 Z`} fill={C.hoodie.s} opacity="0.55" />
        </g>
      );
    } else if (outfit.clothes === "overalls") {
      // denim overalls: A-line bib panel + shoulder straps + buttons
      const bibTop = T + 6;
      parts.push(
        <g key="ov">
          <path d={`M${cx - TW} ${bibTop} L${cx + TW} ${bibTop} L${cx + HW} ${B - 6} Q${cx} ${B + 8} ${cx - HW} ${B - 6} Z`} fill={C.overalls.f} stroke={C.overalls.s} strokeWidth="1.6" />
          <path d={`M${cx - TW * 0.5} ${bibTop + 2} L${cx - TW * 0.55} ${T - 8}`} stroke={C.overalls.f} strokeWidth="5" strokeLinecap="round" />
          <path d={`M${cx + TW * 0.5} ${bibTop + 2} L${cx + TW * 0.55} ${T - 8}`} stroke={C.overalls.f} strokeWidth="5" strokeLinecap="round" />
          <circle cx={cx - TW * 0.5} cy={bibTop + 6} r="2.6" fill="#f2d489" />
          <circle cx={cx + TW * 0.5} cy={bibTop + 6} r="2.6" fill="#f2d489" />
        </g>
      );
    }
  }

  if (layer === "top") {
    // scarf
    if (outfit.scarf === "redScarf") {
      parts.push(<path key="rs" d={`M${cx - 26} ${neckY} Q${cx} ${neckY + 12} ${cx + 26} ${neckY} L${cx + 14} ${neckY + 22} L${cx - 14} ${neckY + 22} Z`} fill="#eba0a0" stroke="#dd8b8b" strokeWidth="1.4" />);
    } else if (outfit.scarf === "knit") {
      parts.push(<rect key="kn" x={cx - 30} y={neckY - 4} width="60" height="16" rx="8" fill="#b6cdcf" stroke="#9fbcc0" strokeWidth="1.4" />);
    } else if (outfit.scarf === "bandana") {
      // wolf-only pirate bandana knotted to one side
      parts.push(
        <g key="bd">
          <path d={`M${cx - 26} ${neckY} Q${cx} ${neckY + 14} ${cx + 26} ${neckY} L${cx + 20} ${neckY + 20} Q${cx} ${neckY + 28} ${cx - 20} ${neckY + 20} Z`} fill="#e29494" stroke="#cd7d7d" strokeWidth="1.4" />
          <circle cx={cx - 26} cy={neckY + 6} r="4" fill="#cd7d7d" />
          <path d={`M${cx - 26} ${neckY + 6} l-10 6 l4 -10 z`} fill="#e29494" />
        </g>
      );
    } else if (outfit.scarf === "plaid") {
      // cosy plaid scarf with crossing lines
      parts.push(
        <g key="pd">
          <rect x={cx - 30} y={neckY - 3} width="60" height="17" rx="7" fill="#dcaaa3" stroke="#c9938b" strokeWidth="1.3" />
          <path d={`M${cx - 30} ${neckY + 2} h60 M${cx - 30} ${neckY + 9} h60`} stroke="#f6e8e2" strokeWidth="1.6" opacity="0.85" />
          <path d={`M${cx - 16} ${neckY - 3} v17 M${cx} ${neckY - 3} v17 M${cx + 16} ${neckY - 3} v17`} stroke="#f6e8e2" strokeWidth="1.6" opacity="0.85" />
          <rect x={cx + 7} y={neckY + 11} width="10" height="11" rx="4" fill="#dcaaa3" />
        </g>
      );
    }
    // accessory
    if (outfit.accessory === "collar") {
      parts.push(<rect key="col" x={cx - 30} y={neckY + 2} width="60" height="8" rx="4" fill="#8a6b52" />);
      parts.push(<circle key="bell" cx={cx} cy={neckY + 12} r="6" fill="#e8c25a" stroke="#c79a3a" strokeWidth="1.5" />);
    } else if (outfit.accessory === "glasses") {
      parts.push(<g key="gl" fill="none" stroke="#7a6656" strokeWidth="3"><circle cx={cx - 18} cy={eyeY} r="11" /><circle cx={cx + 18} cy={eyeY} r="11" /><path d={`M${cx - 7} ${eyeY} h14`} /></g>);
    } else if (outfit.accessory === "bowtie") {
      // wolf-only gentleman bow tie at the neck
      parts.push(
        <g key="bt">
          <path d={`M${cx - 2} ${neckY + 8} L${cx - 16} ${neckY + 1} Q${cx - 20} ${neckY + 8} ${cx - 16} ${neckY + 15} Z`} fill="#8f9fc2" stroke="#7688af" strokeWidth="1.2" />
          <path d={`M${cx + 2} ${neckY + 8} L${cx + 16} ${neckY + 1} Q${cx + 20} ${neckY + 8} ${cx + 16} ${neckY + 15} Z`} fill="#8f9fc2" stroke="#7688af" strokeWidth="1.2" />
          <rect x={cx - 4} y={neckY + 3} width="8" height="10" rx="3" fill="#7688af" />
        </g>
      );
    } else if (outfit.accessory === "pearls") {
      // rabbit-only pearl necklace
      parts.push(
        <g key="pl">
          {[-24, -16, -8, 0, 8, 16, 24].map((dx, i) => (
            <circle key={i} cx={cx + dx} cy={neckY + 10 + (Math.abs(dx) < 10 ? 4 : dx === 0 ? 4 : Math.abs(dx) <= 16 ? 2 : 0)} r="3.4" fill="#fbf3f6" stroke="#e6cdd6" strokeWidth="1" />
          ))}
        </g>
      );
    } else if (outfit.accessory === "medal") {
      // wolf-only champion medal on a ribbon
      parts.push(
        <g key="md">
          <path d={`M${cx - 9} ${neckY} L${cx} ${neckY + 16} L${cx + 9} ${neckY}`} stroke="#e79aa2" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx={cx} cy={neckY + 24} r="9" fill="#f2d68a" stroke="#d8b45e" strokeWidth="1.5" />
          <polygon points={starPoints(cx, neckY + 24, 5, 2.2)} fill="#fff6da" />
        </g>
      );
    }
    // hat
    if (outfit.hat === "bow") {
      parts.push(
        <g key="bow">
          <path d={`M${cx - 2} ${hatTopY} L${cx - 20} ${hatTopY - 11} Q${cx - 24} ${hatTopY} ${cx - 20} ${hatTopY + 11} Z`} fill="#ef9bb2" />
          <path d={`M${cx + 2} ${hatTopY} L${cx + 20} ${hatTopY - 11} Q${cx + 24} ${hatTopY} ${cx + 20} ${hatTopY + 11} Z`} fill="#ef9bb2" />
          <rect x={cx - 5} y={hatTopY - 6} width="10" height="12" rx="4" fill="#d4708c" />
        </g>
      );
    } else if (outfit.hat === "crown") {
      parts.push(<path key="cr" d={`M${cx - 20} ${hatTopY + 4} L${cx - 20} ${hatTopY - 10} L${cx - 8} ${hatTopY} L${cx} ${hatTopY - 14} L${cx + 8} ${hatTopY} L${cx + 20} ${hatTopY - 10} L${cx + 20} ${hatTopY + 4} Z`} fill="#e8c25a" stroke="#c79a3a" strokeWidth="1.2" />);
    } else if (outfit.hat === "flower") {
      const fl = (x: number, c: string) => <g key={"f" + x}><circle cx={x} cy={hatTopY} r="5" fill={c} /><circle cx={x - 5} cy={hatTopY} r="3.4" fill={c} /><circle cx={x + 5} cy={hatTopY} r="3.4" fill={c} /><circle cx={x} cy={hatTopY - 5} r="3.4" fill={c} /><circle cx={x} cy={hatTopY + 5} r="3.4" fill={c} /><circle cx={x} cy={hatTopY} r="2" fill="#f4d06a" /></g>;
      parts.push(<g key="fl">{fl(cx - 16, "#f2a7c0")}{fl(cx, "#f6c8d6")}{fl(cx + 16, "#e8a0bf")}</g>);
    } else if (outfit.hat === "beret") {
      parts.push(
        <g key="br">
          <ellipse cx={cx} cy={hatTopY + 4} rx="24" ry="12" fill="#dd93a4" stroke="#cb8395" strokeWidth="1.2" />
          <ellipse cx={cx} cy={hatTopY + 1} rx="21" ry="10" fill="#e8a9b8" />
          <circle cx={cx + 2} cy={hatTopY - 7} r="4" fill="#d08a9a" />
        </g>
      );
    } else if (outfit.hat === "star") {
      parts.push(
        <polygon key="st" points={starPoints(cx, hatTopY - 1, 13, 5.5)} fill="#f6c85a" stroke="#dba838" strokeWidth="1" />
      );
    } else if (outfit.hat === "strawberry") {
      // rabbit-only strawberry beanie, capping the top of the head
      parts.push(
        <g key="sb">
          <path d={`M${cx - 21} ${hatTopY + 6} Q${cx} ${hatTopY - 15} ${cx + 21} ${hatTopY + 6} Q${cx} ${hatTopY + 18} ${cx - 21} ${hatTopY + 6} Z`} fill="#ec8f8f" stroke="#dd7b7b" strokeWidth="1.3" />
          <path d={`M${cx - 9} ${hatTopY - 8} L${cx} ${hatTopY - 16} L${cx + 9} ${hatTopY - 8} Q${cx} ${hatTopY - 3} ${cx - 9} ${hatTopY - 8} Z`} fill="#6cbf6c" />
          {[[-10, 4], [0, 2], [10, 4], [-5, 9], [5, 9]].map(([dx, dy], i) => (
            <circle key={i} cx={cx + dx} cy={hatTopY + dy} r="1.5" fill="#ffe6a0" />
          ))}
        </g>
      );
    } else if (outfit.hat === "bunnyEars") {
      parts.push(<g key="be"><ellipse cx={cx - 12} cy={hatTopY - 6} rx="7" ry="20" transform={`rotate(-12 ${cx - 12} ${hatTopY - 6})`} fill="#fff" stroke="#f0c9d6" strokeWidth="1.5" /><ellipse cx={cx + 12} cy={hatTopY - 6} rx="7" ry="20" transform={`rotate(12 ${cx + 12} ${hatTopY - 6})`} fill="#fff" stroke="#f0c9d6" strokeWidth="1.5" /><ellipse cx={cx - 12} cy={hatTopY - 6} rx="3" ry="12" transform={`rotate(-12 ${cx - 12} ${hatTopY - 6})`} fill="#f7ccd9" /><ellipse cx={cx + 12} cy={hatTopY - 6} rx="3" ry="12" transform={`rotate(12 ${cx + 12} ${hatTopY - 6})`} fill="#f7ccd9" /></g>);
    }
  }

  return <>{parts}</>;
}
