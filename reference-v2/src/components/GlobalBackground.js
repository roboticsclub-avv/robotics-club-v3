"use client";

import useTheme from "@/hooks/useTheme";

export default function GlobalBackground() {
  const { currentTheme } = useTheme();

  if (currentTheme !== "theme-cosmic") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden"
      }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src="/cosmic-background.mp4"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />
    </div>
  );
}
