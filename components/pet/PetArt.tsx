"use client";

// Simple, cute SVG pets. Wolf pup (black) with pose variants; lop rabbit (white
// with pink ear-tips + nose) with a normal / grumpy (缩窝) variant.

export function WolfArt({
  pose = "happy",
  size = 180,
}: {
  pose?: "happy" | "droopy" | "waiting";
  size?: number;
}) {
  const earDown = pose !== "happy";
  return (
    <svg viewBox="0 0 160 170" width={size} height={size}>
      {/* tail */}
      <path
        d={
          pose === "happy"
            ? "M118 118 Q150 92 142 126 Q136 138 116 130 Z"
            : "M118 122 Q146 120 140 140 Q133 146 116 134 Z"
        }
        fill="#3c3c42"
      />
      {/* body */}
      <ellipse cx="80" cy="126" rx="44" ry="31" fill="#3c3c42" />
      {/* feet */}
      <ellipse cx="62" cy="152" rx="11" ry="7" fill="#33333a" />
      <ellipse cx="98" cy="152" rx="11" ry="7" fill="#33333a" />
      {/* ears */}
      {earDown ? (
        <>
          <path d="M50 66 L40 96 L64 80 Z" fill="#43434b" />
          <path d="M110 66 L120 96 L96 80 Z" fill="#43434b" />
        </>
      ) : (
        <>
          <path d="M52 54 L44 20 L74 46 Z" fill="#43434b" />
          <path d="M108 54 L116 20 L86 46 Z" fill="#43434b" />
          <path d="M56 48 L51 30 L69 45 Z" fill="#6b6b73" />
          <path d="M104 48 L109 30 L91 45 Z" fill="#6b6b73" />
        </>
      )}
      {/* head */}
      <circle cx="80" cy="80" r="40" fill="#47474f" />
      {/* eyes */}
      {pose === "waiting" ? (
        <>
          <path d="M60 78 q6 -6 12 0" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M88 78 q6 -6 12 0" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="66" cy="76" r="5.5" fill="#141416" />
          <circle cx="94" cy="76" r="5.5" fill="#141416" />
          <circle cx="68" cy="74" r="1.8" fill="#fff" />
          <circle cx="96" cy="74" r="1.8" fill="#fff" />
        </>
      )}
      {/* muzzle + nose */}
      <ellipse cx="80" cy="96" rx="16" ry="11" fill="#5a5a62" />
      <ellipse cx="80" cy="90" rx="5" ry="4" fill="#141416" />
      <path d="M80 94 v6" stroke="#141416" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RabbitArt({
  grumpy = false,
  size = 180,
}: {
  grumpy?: boolean;
  size?: number;
}) {
  return (
    <svg viewBox="0 0 160 170" width={size} height={size}>
      {/* lop ears */}
      <g>
        <ellipse cx="54" cy="72" rx="14" ry="36" transform="rotate(-16 54 72)" fill="#ffffff" stroke="#ece7e4" />
        <ellipse cx="106" cy="72" rx="14" ry="36" transform="rotate(16 106 72)" fill="#ffffff" stroke="#ece7e4" />
        <ellipse cx="54" cy="76" rx="6.5" ry="24" transform="rotate(-16 54 76)" fill="#f6cdd8" />
        <ellipse cx="106" cy="76" rx="6.5" ry="24" transform="rotate(16 106 76)" fill="#f6cdd8" />
      </g>
      {/* body */}
      <ellipse cx="80" cy="126" rx="42" ry="30" fill="#ffffff" stroke="#ece7e4" />
      <ellipse cx="60" cy="150" rx="11" ry="7" fill="#ffffff" stroke="#ece7e4" />
      <ellipse cx="100" cy="150" rx="11" ry="7" fill="#ffffff" stroke="#ece7e4" />
      {/* head */}
      <circle cx="80" cy="88" r="36" fill="#ffffff" stroke="#ece7e4" />
      {/* eyes */}
      {grumpy ? (
        <>
          <path d="M62 86 q7 -5 14 -1" stroke="#4a4a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M84 85 q7 -4 14 1" stroke="#4a4a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="68" cy="86" r="5" fill="#3a3a3a" />
          <circle cx="92" cy="86" r="5" fill="#3a3a3a" />
          <circle cx="70" cy="84" r="1.6" fill="#fff" />
          <circle cx="94" cy="84" r="1.6" fill="#fff" />
        </>
      )}
      {/* cheeks */}
      <circle cx="60" cy="98" r="6" fill="#fbe0e8" />
      <circle cx="100" cy="98" r="6" fill="#fbe0e8" />
      {/* pink nose + mouth */}
      <path d="M76 96 h8 l-4 5 z" fill="#f19bb0" />
      <path d="M80 101 q-5 5 -10 2 M80 101 q5 5 10 2" stroke="#e0aeb8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
