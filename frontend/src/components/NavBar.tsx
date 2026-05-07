import { useNavigate, useLocation } from "react-router";
import {
  game,
  home,
  mypage,
  quiz,
  game_active,
  home_active,
  mypage_active,
  quiz_active,
} from "../assets";

type TabKey = "home" | "quiz" | "stocks" | "mypage";

interface TabBarProps {
  id: TabKey;
  label: string;
  icon: string;
  activeIcon: string;
  path: string;
}

const tabs: TabBarProps[] = [
  {
    id: "home",
    label: "홈",
    icon: home,
    activeIcon: home_active,
    path: "/home",
  },
  {
    id: "quiz",
    label: "퀴즈",
    icon: quiz,
    activeIcon: quiz_active,
    path: "/quiz",
  },
  {
    id: "stocks",
    label: "모의투자",
    icon: game,
    activeIcon: game_active,
    path: "/stocks",
  },
  {
    id: "mypage",
    label: "내 정보",
    icon: mypage,
    activeIcon: mypage_active,
    path: "/mypage",
  },
];

const isActiveTab = (tabPath: string, pathname: string): boolean =>
  tabPath === "/" ? pathname === "/" : pathname.startsWith(tabPath);

export const NavBar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 w-full max-w-md h-[83px]  shrink-0 bg-white rounded-t-3xl shadow-[0_-2px_12px_rgba(0,0,0,0.08)] flex justify-around items-center px-4">
      {tabs.map(({ id, label, icon, activeIcon, path }) => {
        const active = isActiveTab(path, pathname);

        return (
          <button
            key={id}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1 text-xs font-medium cursor-pointer ${
              active ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <img
              src={active ? activeIcon : icon}
              alt={label}
              className="w-6 h-6"
            />
            {label}
          </button>
        );
      })}
    </nav>
  );
};
