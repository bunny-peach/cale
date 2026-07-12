"use client";

import { OutfitSlot, PetKind } from "@/lib/pets";

type Outfit = Partial<Record<OutfitSlot, string>>;

// Cute, *alive* SVG pets: gentle idle bob + blinking, a wagging tail for the
// happy wolf, softly swaying ears for the rabbit, plus equippable outfits.

export function WolfArt({
  pose = "happy",
  outfit,
  size = 190,
}: {
  pose?: "happy" | "droopy" | "waiting";
  outfit?: Outfit;
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

        <ellipse cx="100" cy="150" rx="52" ry="40" fill="#40404a" />
        <ellipse cx="100" cy="156" rx="28" ry="30" fill="#5a5a64" />
        <ellipse cx="76" cy="184" rx="14" ry="9" fill="#37373f" />
        <ellipse cx="124" cy="184" rx="14" ry="9" fill="#37373f" />

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
        <OutfitPiece outfit={outfit} layer="clothes" cx={100} neckY={128} bodyY={150} eyeY={94} />

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
        <OutfitPiece outfit={outfit} layer="top" cx={100} neckY={128} bodyY={150} eyeY={94} hatTopY={50} />
      </g>
    </svg>
  );
}

export function RabbitArt({
  grumpy = false,
  hiding = false,
  outfit,
  size = 190,
}: {
  grumpy?: boolean;
  hiding?: boolean;
  outfit?: Outfit;
  size?: number;
}) {
  // 炸毛缩窝: a soft fluffy pompom ball — cute even when sulking. Scalloped
  // cloud edge (no sharp spikes), ears folded down over the sides, and a big
  // teary pout with rosy blush.
  if (hiding) {
    const cx = 100,
      cy = 132,
      r = 42;
    const fluff = [];
    for (let i = 0; i < 15; i++) {
      const a = (i / 15) * Math.PI * 2;
      fluff.push(
        <circle
          key={i}
          cx={cx + Math.cos(a) * r}
          cy={cy + Math.sin(a) * r}
          r="13"
          fill="#ffffff"
          stroke="#ece7e4"
          strokeWidth="2"
        />
      );
    }
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
        <g className="pet-bob">
          {/* folded-down floppy ears draped over the sides */}
          <path d="M70 104 Q52 118 56 150 Q68 156 74 138 Q76 120 84 112 Z" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <path d="M130 104 Q148 118 144 150 Q132 156 126 138 Q124 120 116 112 Z" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <path d="M66 116 Q56 126 59 145" stroke="#f7ccd9" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M134 116 Q144 126 141 145" stroke="#f7ccd9" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* fluffy scalloped body */}
          {fluff}
          <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          {/* rosy cheeks */}
          <circle cx="74" cy="138" r="9" fill="#fbd5e0" />
          <circle cx="126" cy="138" r="9" fill="#fbd5e0" />
          {/* teary, upset-but-cute eyes: big and wet, looking up */}
          <ellipse cx="86" cy="130" rx="7.5" ry="9" fill="#3a3237" />
          <ellipse cx="114" cy="130" rx="7.5" ry="9" fill="#3a3237" />
          <circle cx="89" cy="126" r="2.6" fill="#fff" />
          <circle cx="117" cy="126" r="2.6" fill="#fff" />
          {/* little pooling tears */}
          <path d="M80 138 q-3 5 0 8 q3 -3 0 -8" fill="#bfe0f0" opacity="0.85" />
          <path d="M120 138 q3 5 0 8 q-3 -3 0 -8" fill="#bfe0f0" opacity="0.85" />
          {/* soft worried brows */}
          <path d="M79 120 q7 -4 13 -1" stroke="#c9a2ad" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M121 120 q-7 -4 -13 -1" stroke="#c9a2ad" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {/* wobbly little pout */}
          <path d="M94 146 q6 -5 12 0" stroke="#e08a99" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M97 146 l3 4 l3 -4" fill="#f19bb0" />
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

        <OutfitPiece outfit={outfit} layer="clothes" cx={100} neckY={140} bodyY={160} eyeY={108} />

        {/* flat, short face — much wider than tall (扁扁的短短的脸) */}
        <ellipse cx="100" cy="110" rx="54" ry="36" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />

        {grumpy ? (
          <>
            {/* cute-mad: puffed rosy cheeks, big pouty eyes, tiny frowny brows */}
            <circle cx="70" cy="116" r="12" fill="#fbc4d3" />
            <circle cx="130" cy="116" r="12" fill="#fbc4d3" />
            <path d="M76 100 q8 -3 15 1" stroke="#b98a95" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M124 100 q-8 -3 -15 1" stroke="#b98a95" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="84" cy="112" rx="7" ry="8.5" fill="#3a3237" />
            <ellipse cx="116" cy="112" rx="7" ry="8.5" fill="#3a3237" />
            <circle cx="86.5" cy="109" r="2.4" fill="#fff" />
            <circle cx="118.5" cy="109" r="2.4" fill="#fff" />
            {/* pouty puffed mouth */}
            <path d="M92 126 q8 7 16 0" stroke="#d97e8f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            {/* little anger puff */}
            <path d="M140 84 q6 -2 4 5 q6 -1 2 6" stroke="#e6a7b4" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="70" cy="118" r="9" fill="#fbd5e0" />
            <circle cx="130" cy="118" r="9" fill="#fbd5e0" />
            <g className="pet-blink">
              <ellipse cx="84" cy="110" rx="8" ry="9.5" fill="#3a3237" />
              <ellipse cx="116" cy="110" rx="8" ry="9.5" fill="#3a3237" />
              <circle cx="87" cy="106" r="2.6" fill="#fff" />
              <circle cx="119" cy="106" r="2.6" fill="#fff" />
            </g>
            <path d="M94 120 h12 l-6 6 z" fill="#f19bb0" />
            <path d="M100 126 q-6 6 -12 3 M100 126 q6 6 12 3" stroke="#e0aeb8" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}
        <path d="M56 116 h-15 M58 122 h-13 M144 116 h15 M142 122 h13" stroke="#ded7d4" strokeWidth="1.6" strokeLinecap="round" />

        <OutfitPiece outfit={outfit} layer="top" cx={100} neckY={140} bodyY={160} eyeY={108} hatTopY={66} />
      </g>
    </svg>
  );
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
}: {
  outfit?: Outfit;
  layer: "clothes" | "top";
  cx: number;
  neckY: number;
  bodyY: number;
  eyeY: number;
  hatTopY?: number;
}) {
  if (!outfit) return null;
  const parts: React.ReactNode[] = [];

  if (layer === "clothes") {
    if (outfit.clothes === "vest") {
      parts.push(
        <path key="vest" d={`M${cx - 40} ${bodyY} Q${cx} ${bodyY + 34} ${cx + 40} ${bodyY} L${cx + 34} ${bodyY + 30} Q${cx} ${bodyY + 40} ${cx - 34} ${bodyY + 30} Z`} fill="#c98da0" opacity="0.92" />
      );
    } else if (outfit.clothes === "cape") {
      // wolf-only hero cape flowing behind
      parts.push(
        <g key="cape">
          <path d={`M${cx - 34} ${bodyY - 8} Q${cx} ${bodyY + 44} ${cx + 34} ${bodyY - 8} L${cx + 46} ${bodyY + 44} Q${cx} ${bodyY + 30} ${cx - 46} ${bodyY + 44} Z`} fill="#7b4fd6" opacity="0.95" />
          <rect x={cx - 30} y={bodyY - 14} width="60" height="10" rx="5" fill="#5f3bb0" />
        </g>
      );
    } else if (outfit.clothes === "dress") {
      // rabbit-only floral dress
      parts.push(
        <g key="dress">
          <path d={`M${cx - 30} ${bodyY} Q${cx} ${bodyY + 20} ${cx + 30} ${bodyY} L${cx + 44} ${bodyY + 40} Q${cx} ${bodyY + 52} ${cx - 44} ${bodyY + 40} Z`} fill="#f4b8cf" opacity="0.96" />
          <circle cx={cx - 16} cy={bodyY + 24} r="3" fill="#fff" />
          <circle cx={cx + 6} cy={bodyY + 32} r="3" fill="#fff" />
          <circle cx={cx + 22} cy={bodyY + 20} r="3" fill="#fff" />
          <circle cx={cx - 4} cy={bodyY + 14} r="3" fill="#fff" />
        </g>
      );
    }
  }

  if (layer === "top") {
    // scarf
    if (outfit.scarf === "redScarf") {
      parts.push(<path key="rs" d={`M${cx - 26} ${neckY} Q${cx} ${neckY + 12} ${cx + 26} ${neckY} L${cx + 14} ${neckY + 22} L${cx - 14} ${neckY + 22} Z`} fill="#d85b5b" />);
    } else if (outfit.scarf === "knit") {
      parts.push(<rect key="kn" x={cx - 30} y={neckY - 4} width="60" height="16" rx="8" fill="#a9c0c9" />);
    } else if (outfit.scarf === "bandana") {
      // wolf-only pirate bandana knotted to one side
      parts.push(
        <g key="bd">
          <path d={`M${cx - 26} ${neckY} Q${cx} ${neckY + 14} ${cx + 26} ${neckY} L${cx + 20} ${neckY + 20} Q${cx} ${neckY + 28} ${cx - 20} ${neckY + 20} Z`} fill="#c94b52" />
          <circle cx={cx - 26} cy={neckY + 6} r="4" fill="#a83b42" />
          <path d={`M${cx - 26} ${neckY + 6} l-10 6 l4 -10 z`} fill="#c94b52" />
        </g>
      );
    }
    // accessory
    if (outfit.accessory === "collar") {
      parts.push(<rect key="col" x={cx - 30} y={neckY + 2} width="60" height="8" rx="4" fill="#8a6b52" />);
      parts.push(<circle key="bell" cx={cx} cy={neckY + 12} r="6" fill="#e8c25a" stroke="#c79a3a" strokeWidth="1.5" />);
    } else if (outfit.accessory === "glasses") {
      parts.push(<g key="gl" fill="none" stroke="#2a2a30" strokeWidth="3"><circle cx={cx - 18} cy={eyeY} r="11" /><circle cx={cx + 18} cy={eyeY} r="11" /><path d={`M${cx - 7} ${eyeY} h14`} /></g>);
    } else if (outfit.accessory === "bowtie") {
      // wolf-only gentleman bow tie at the neck
      parts.push(
        <g key="bt">
          <path d={`M${cx - 2} ${neckY + 8} L${cx - 16} ${neckY + 1} Q${cx - 20} ${neckY + 8} ${cx - 16} ${neckY + 15} Z`} fill="#3a4a6b" />
          <path d={`M${cx + 2} ${neckY + 8} L${cx + 16} ${neckY + 1} Q${cx + 20} ${neckY + 8} ${cx + 16} ${neckY + 15} Z`} fill="#3a4a6b" />
          <rect x={cx - 4} y={neckY + 3} width="8" height="10" rx="3" fill="#2a3550" />
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
          <ellipse cx={cx} cy={hatTopY + 4} rx="24" ry="12" fill="#c76b7e" />
          <ellipse cx={cx} cy={hatTopY + 1} rx="21" ry="10" fill="#d97e91" />
          <circle cx={cx + 2} cy={hatTopY - 7} r="4" fill="#b95a6d" />
        </g>
      );
    } else if (outfit.hat === "bunnyEars") {
      parts.push(<g key="be"><ellipse cx={cx - 12} cy={hatTopY - 6} rx="7" ry="20" transform={`rotate(-12 ${cx - 12} ${hatTopY - 6})`} fill="#fff" stroke="#f0c9d6" strokeWidth="1.5" /><ellipse cx={cx + 12} cy={hatTopY - 6} rx="7" ry="20" transform={`rotate(12 ${cx + 12} ${hatTopY - 6})`} fill="#fff" stroke="#f0c9d6" strokeWidth="1.5" /><ellipse cx={cx - 12} cy={hatTopY - 6} rx="3" ry="12" transform={`rotate(-12 ${cx - 12} ${hatTopY - 6})`} fill="#f7ccd9" /><ellipse cx={cx + 12} cy={hatTopY - 6} rx="3" ry="12" transform={`rotate(12 ${cx + 12} ${hatTopY - 6})`} fill="#f7ccd9" /></g>);
    }
  }

  return <>{parts}</>;
}
