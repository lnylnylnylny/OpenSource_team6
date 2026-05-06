import { rocket } from "../assets";

interface FloatingRocketProps {
  floating?: boolean;
  sizeClass?: string;
}

export const FloatingRocket = ({
  floating = true,
  sizeClass = "w-56",
}: FloatingRocketProps) => {
  return (
    <>
      <img
        src={rocket}
        alt="로켓 이미지"
        className={sizeClass}
        style={{
          animation: floating
            ? "floatRocket 2.2s ease-in-out infinite"
            : "none",
          filter: "drop-shadow(0 8px 24px rgba(59,130,246,0.18))",
        }}
      />

      <style>{`
        @keyframes floatRocket {
          0%   { transform: translateY(0px) rotate(-2deg); }
          50%  { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(-2deg); }
        }
      `}</style>
    </>
  );
};
