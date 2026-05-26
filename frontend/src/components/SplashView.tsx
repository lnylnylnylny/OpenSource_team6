import { useState, useEffect } from "react";
import { FloatingRocket } from "./FloatingRocket";

export const SplashView = () => {
  const [phase, setPhase] = useState<"idle" | "rise">("idle");

  useEffect(() => {
    const t = setTimeout(() => setPhase("rise"), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>

      <div
        className="z-10"
        style={{
          transform:
            phase === "idle"
              ? "translateY(60px) scale(0.85)"
              : "translateY(0px) scale(1)",
          opacity: phase === "idle" ? 0 : 1,
          transition:
            "transform 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease",
        }}
      >
        <FloatingRocket floating={phase === "rise"} logoVisible={phase === "rise"} />
      </div>

      <div
        className="flex items-center gap-2 mt-10"
        style={{
          opacity: phase === "rise" ? 1 : 0,
          transition: "opacity 0.5s 1.2s ease",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#2563EB",
              animation:
                phase === "rise"
                  ? `dotBounce 1.2s ease-in-out ${i * 0.18}s infinite`
                  : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};
