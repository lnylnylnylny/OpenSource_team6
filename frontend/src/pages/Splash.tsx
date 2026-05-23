import { useEffect } from "react";
import { useNavigate } from "react-router";
import { SplashView } from "../components/SplashView";

export const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/login"), 2800);
    return () => clearTimeout(t);
  }, [navigate]);

  return <SplashView />;
};
