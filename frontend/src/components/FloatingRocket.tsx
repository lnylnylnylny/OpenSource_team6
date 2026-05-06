import { rocket } from "../assets";

interface FloatingRocketProps {
  floating?: boolean;
  showLogo?: boolean;
  logoVisible?: boolean;
}

export const FloatingRocket = ({
  floating = true,
  showLogo = true,
  logoVisible = true,
}: FloatingRocketProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 280,
            height: 280,
            background:
              "radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(255,255,255,0) 70%)",
            opacity: logoVisible ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        />

        <img
          src={rocket}
          alt="로켓 이미지"
          className="w-56"
          style={{
            animation: floating
              ? "floatRocket 2.2s ease-in-out infinite"
              : "none",
            filter: "drop-shadow(0 8px 24px rgba(59,130,246,0.18))",
          }}
        />
      </div>

      {/* 로고 + 슬로건 */}
      {showLogo && (
        <>
          {/* Upfolio 로고 */}
          <div
            className="mt-6 flex items-baseline"
            style={{
              opacity: logoVisible ? 1 : 0,
              transform: logoVisible ? "translateY(0)" : "translateY(16px)",
              transition:
                "opacity 0.7s 0.4s ease, transform 0.7s 0.4s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {"Upfolio".split("").map((char, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontWeight: 800,
                  fontSize: "2.4rem",
                  letterSpacing: "-0.03em",
                  color: i < 2 ? "#2563EB" : "#111827",
                  opacity: logoVisible ? 1 : 0,
                  transform: logoVisible ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 0.5s ${
                    0.45 + i * 0.06
                  }s ease, transform 0.5s ${
                    0.45 + i * 0.06
                  }s cubic-bezier(0.22,1,0.36,1)`,
                }}
              >
                {char}
              </span>
            ))}
          </div>

          {/* 슬로건 */}
          <p
            className="mt-0 text-sm font-medium"
            style={{
              color: "#9CA3AF",
              opacity: logoVisible ? 1 : 0,
              transform: logoVisible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.6s 0.9s ease, transform 0.6s 0.9s ease",
            }}
          >
            문제와 투자를 동시에, 주식 감각 UP !
          </p>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

        @keyframes floatRocket {
          0%   { transform: translateY(0px) rotate(-2deg); }
          50%  { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
};
