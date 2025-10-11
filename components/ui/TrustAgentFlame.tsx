import React from "react";

type Size = "xs" | "sm" | "md" | "lg";
const SIZES: Record<Size, { w: string; h: string; innerTop: string }> = {
  xs: { w: "w-3", h: "h-4", innerTop: "0.25rem" },
  sm: { w: "w-4", h: "h-5", innerTop: "0.3rem" },
  md: { w: "w-5", h: "h-6", innerTop: "0.4rem" },
  lg: { w: "w-6", h: "h-8", innerTop: "0.6rem" },
};

export function PurpleFlame({ active = true, size = "md" as Size }) {
  const { w, h, innerTop } = SIZES[size];

  return (
    <div className={`relative ${w} ${h}`} style={{ pointerEvents: "none" }}>
      {/* Outer flame */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-b from-fuchsia-500 via-purple-500 to-violet-600`}
        style={{
          clipPath: "polygon(50% 0%, 80% 50%, 50% 100%, 20% 50%)",
          transformOrigin: "center bottom",
          animation: active ? "flame-flicker 3s ease-in-out infinite, flame-glow 2s ease-in-out infinite" : "none",
          opacity: 0.9,
        }}
      />

      {/* Inner flame */}
      <div
        className="absolute z-10 rounded-full bg-gradient-to-b from-pink-300 via-fuchsia-400 to-purple-500"
        style={{
          width: "60%",
          height: "70%",
          left: "20%",
          top: innerTop,
          clipPath: "polygon(50% 0%, 70% 50%, 50% 90%, 30% 50%)",
          transformOrigin: "center bottom",
          animation: active ? "flame-flicker 2s ease-in-out infinite 0.25s, flame-glow 1.6s ease-in-out infinite 0.1s" : "none",
          opacity: 0.95,
          boxShadow: "0 0 14px 3px rgba(168, 85, 247, 0.45)",
        }}
      />

      {/* Core pop */}
      <div
        className="absolute z-20 rounded-full bg-gradient-to-b from-violet-100 to-fuchsia-300"
        style={{
          width: "42%",
          height: "55%",
          left: "50%",
          top: `calc(${innerTop} + 0.1rem)`,
          transform: "translateX(-50%)",
          clipPath: "polygon(50% 8%, 65% 50%, 50% 86%, 35% 50%)",
          transformOrigin: "center bottom",
          animation: active ? "flame-core-pop 2.4s ease-in-out infinite" : "none",
          filter: "brightness(1.15) contrast(1.1)",
          opacity: 0,
        }}
      />

      {/* Soft glow halo */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(217,70,239,0.45) 0%, rgba(217,70,239,0) 70%)",
          transform: "scale(1.45)",
          filter: "blur(6px)",
          opacity: 0.6,
          animation: active ? "flame-glow 2s ease-in-out infinite" : "none",
        }}
      />
    </div>
  );
}
