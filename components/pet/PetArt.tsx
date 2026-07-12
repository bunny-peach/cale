"use client";

// Cute, *alive* SVG pets: gentle idle bob + blinking, a wagging tail for the
// happy wolf, and softly swaying ears for the rabbit.

export function WolfArt({
  pose = "happy",
  size = 190,
}: {
  pose?: "happy" | "droopy" | "waiting";
  size?: number;
}) {
  const earDown = pose !== "happy";
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
      <g className="pet-bob">
        {/* tail */}
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

        {/* body */}
        <ellipse cx="100" cy="150" rx="52" ry="40" fill="#40404a" />
        {/* chest fluff */}
        <ellipse cx="100" cy="156" rx="28" ry="30" fill="#5a5a64" />
        {/* feet */}
        <ellipse cx="76" cy="184" rx="14" ry="9" fill="#37373f" />
        <ellipse cx="124" cy="184" rx="14" ry="9" fill="#37373f" />

        {/* ears */}
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

        {/* head */}
        <circle cx="100" cy="96" r="48" fill="#4a4a55" />
        {/* cheeks fluff */}
        <ellipse cx="64" cy="108" rx="14" ry="12" fill="#565661" />
        <ellipse cx="136" cy="108" rx="14" ry="12" fill="#565661" />
        {/* rosy cheeks */}
        <circle cx="66" cy="112" r="7" fill="#e79aa6" opacity="0.5" />
        <circle cx="134" cy="112" r="7" fill="#e79aa6" opacity="0.5" />

        {/* eyes */}
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

        {/* muzzle + nose */}
        <ellipse cx="100" cy="116" rx="17" ry="12" fill="#61616c" />
        <ellipse cx="100" cy="110" rx="6" ry="4.5" fill="#17171c" />
        <path d="M100 114 v7" stroke="#17171c" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M100 121 q-6 5 -12 3 M100 121 q6 5 12 3" stroke="#2c2c33" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function RabbitArt({
  grumpy = false,
  size = 190,
}: {
  grumpy?: boolean;
  size?: number;
}) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
      <g className="pet-bob">
        {/* lop ears (sway) */}
        <g className={grumpy ? undefined : "ear-sway"}>
          <ellipse cx="66" cy="80" rx="17" ry="44" transform="rotate(-18 66 80)" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <ellipse cx="134" cy="80" rx="17" ry="44" transform="rotate(18 134 80)" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
          <ellipse cx="66" cy="84" rx="8" ry="30" transform="rotate(-18 66 84)" fill="#f7ccd9" />
          <ellipse cx="134" cy="84" rx="8" ry="30" transform="rotate(18 134 84)" fill="#f7ccd9" />
        </g>

        {/* body */}
        <ellipse cx="100" cy="150" rx="50" ry="38" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
        {/* feet */}
        <ellipse cx="76" cy="182" rx="14" ry="9" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
        <ellipse cx="124" cy="182" rx="14" ry="9" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />

        {/* head */}
        <circle cx="100" cy="104" r="44" fill="#ffffff" stroke="#ece7e4" strokeWidth="2" />
        {/* rosy cheeks */}
        <circle cx="70" cy="116" r="9" fill="#fbd5e0" />
        <circle cx="130" cy="116" r="9" fill="#fbd5e0" />

        {/* eyes */}
        {grumpy ? (
          <>
            <path d="M76 106 q9 -6 18 -1" stroke="#4a4a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M106 105 q9 -5 18 1" stroke="#4a4a4a" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <g className="pet-blink">
            <ellipse cx="82" cy="104" rx="7.5" ry="9" fill="#3a3237" />
            <ellipse cx="118" cy="104" rx="7.5" ry="9" fill="#3a3237" />
            <circle cx="85" cy="100" r="2.4" fill="#fff" />
            <circle cx="121" cy="100" r="2.4" fill="#fff" />
          </g>
        )}

        {/* pink nose + mouth */}
        <path d="M94 114 h12 l-6 6 z" fill="#f19bb0" />
        <path d="M100 120 q-6 6 -12 3 M100 120 q6 6 12 3" stroke="#e0aeb8" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* whiskers */}
        <path d="M60 112 h-18 M62 118 h-16 M140 112 h18 M138 118 h16" stroke="#ded7d4" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
