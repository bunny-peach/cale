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
  outfit,
  size = 190,
}: {
  grumpy?: boolean;
  outfit?: Outfit;
  size?: number;
}) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
      <g className="pet-bob">
        {/* upright ears, close together on top of the head */}
        <g className={grumpy ? undefined : "ear-sway"}>
          <ellipse cx="89" cy="46" rx="11" ry="34" transform="rotate(-7 89 78)" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <ellipse cx="111" cy="46" rx="11" ry="34" transform="rotate(7 111 78)" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <ellipse cx="89" cy="48" rx="5" ry="23" transform="rotate(-7 89 78)" fill="#f7ccd9" />
          <ellipse cx="111" cy="48" rx="5" ry="23" transform="rotate(7 111 78)" fill="#f7ccd9" />
        </g>

        {/* slimmer body */}
        <ellipse cx="100" cy="152" rx="42" ry="33" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
        <ellipse cx="80" cy="180" rx="12" ry="8" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
        <ellipse cx="120" cy="180" rx="12" ry="8" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />

        <OutfitPiece outfit={outfit} layer="clothes" cx={100} neckY={134} bodyY={152} eyeY={106} />

        <circle cx="100" cy="106" r="41" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
        <circle cx="72" cy="118" r="8.5" fill="#fbd5e0" />
        <circle cx="128" cy="118" r="8.5" fill="#fbd5e0" />

        {grumpy ? (
          <>
            <path d="M77 108 q9 -6 18 -1" stroke="#4a4a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M105 107 q9 -5 18 1" stroke="#4a4a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <g className="pet-blink">
            <ellipse cx="84" cy="106" rx="7.5" ry="9" fill="#3a3237" />
            <ellipse cx="116" cy="106" rx="7.5" ry="9" fill="#3a3237" />
            <circle cx="87" cy="102" r="2.4" fill="#fff" />
            <circle cx="119" cy="102" r="2.4" fill="#fff" />
          </g>
        )}

        <path d="M94 116 h12 l-6 6 z" fill="#f19bb0" />
        <path d="M100 122 q-6 6 -12 3 M100 122 q6 6 12 3" stroke="#e0aeb8" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M64 114 h-16 M66 120 h-14 M136 114 h16 M134 120 h14" stroke="#ded7d4" strokeWidth="1.6" strokeLinecap="round" />

        <OutfitPiece outfit={outfit} layer="top" cx={100} neckY={134} bodyY={152} eyeY={106} hatTopY={64} />
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

  if (layer === "clothes" && outfit.clothes === "vest") {
    parts.push(
      <path key="vest" d={`M${cx - 40} ${bodyY} Q${cx} ${bodyY + 34} ${cx + 40} ${bodyY} L${cx + 34} ${bodyY + 30} Q${cx} ${bodyY + 40} ${cx - 34} ${bodyY + 30} Z`} fill="#c98da0" opacity="0.92" />
    );
  }

  if (layer === "top") {
    // scarf
    if (outfit.scarf === "redScarf") {
      parts.push(<path key="rs" d={`M${cx - 26} ${neckY} Q${cx} ${neckY + 12} ${cx + 26} ${neckY} L${cx + 14} ${neckY + 22} L${cx - 14} ${neckY + 22} Z`} fill="#d85b5b" />);
    } else if (outfit.scarf === "knit") {
      parts.push(<rect key="kn" x={cx - 30} y={neckY - 4} width="60" height="16" rx="8" fill="#a9c0c9" />);
    }
    // accessory
    if (outfit.accessory === "collar") {
      parts.push(<rect key="col" x={cx - 30} y={neckY + 2} width="60" height="8" rx="4" fill="#8a6b52" />);
      parts.push(<circle key="bell" cx={cx} cy={neckY + 12} r="6" fill="#e8c25a" stroke="#c79a3a" strokeWidth="1.5" />);
    } else if (outfit.accessory === "glasses") {
      parts.push(<g key="gl" fill="none" stroke="#2a2a30" strokeWidth="3"><circle cx={cx - 18} cy={eyeY} r="11" /><circle cx={cx + 18} cy={eyeY} r="11" /><path d={`M${cx - 7} ${eyeY} h14`} /></g>);
    }
    // hat
    if (outfit.hat === "bow") {
      parts.push(<g key="bow"><path d={`M${cx - 22} ${hatTopY} l16 -8 v16 z`} fill="#e88ba3" /><path d={`M${cx + 22} ${hatTopY} l-16 -8 v16 z`} fill="#e88ba3" /><circle cx={cx} cy={hatTopY} r="6" fill="#d4708c" /></g>);
    } else if (outfit.hat === "crown") {
      parts.push(<path key="cr" d={`M${cx - 20} ${hatTopY + 4} L${cx - 20} ${hatTopY - 10} L${cx - 8} ${hatTopY} L${cx} ${hatTopY - 14} L${cx + 8} ${hatTopY} L${cx + 20} ${hatTopY - 10} L${cx + 20} ${hatTopY + 4} Z`} fill="#e8c25a" stroke="#c79a3a" strokeWidth="1.2" />);
    } else if (outfit.hat === "flower") {
      const fl = (x: number, c: string) => <g key={"f" + x}><circle cx={x} cy={hatTopY} r="5" fill={c} /><circle cx={x - 5} cy={hatTopY} r="3.4" fill={c} /><circle cx={x + 5} cy={hatTopY} r="3.4" fill={c} /><circle cx={x} cy={hatTopY - 5} r="3.4" fill={c} /><circle cx={x} cy={hatTopY + 5} r="3.4" fill={c} /><circle cx={x} cy={hatTopY} r="2" fill="#f4d06a" /></g>;
      parts.push(<g key="fl">{fl(cx - 16, "#f2a7c0")}{fl(cx, "#f6c8d6")}{fl(cx + 16, "#e8a0bf")}</g>);
    } else if (outfit.hat === "bunnyEars") {
      parts.push(<g key="be"><ellipse cx={cx - 12} cy={hatTopY - 6} rx="7" ry="20" transform={`rotate(-12 ${cx - 12} ${hatTopY - 6})`} fill="#fff" stroke="#f0c9d6" strokeWidth="1.5" /><ellipse cx={cx + 12} cy={hatTopY - 6} rx="7" ry="20" transform={`rotate(12 ${cx + 12} ${hatTopY - 6})`} fill="#fff" stroke="#f0c9d6" strokeWidth="1.5" /><ellipse cx={cx - 12} cy={hatTopY - 6} rx="3" ry="12" transform={`rotate(-12 ${cx - 12} ${hatTopY - 6})`} fill="#f7ccd9" /><ellipse cx={cx + 12} cy={hatTopY - 6} rx="3" ry="12" transform={`rotate(12 ${cx + 12} ${hatTopY - 6})`} fill="#f7ccd9" /></g>);
    }
  }

  return <>{parts}</>;
}
