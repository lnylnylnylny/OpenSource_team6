import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Home } from "./pages/Home.tsx";
import { Quiz } from "./pages/Quiz.tsx";
import { Login } from "./pages/Login.tsx";
import { KakaoCallback } from "./pages/KakaoCallback.tsx";
import { Mypage } from "./pages/Mypage.tsx";
import { Splash } from "./pages/Splash.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Splash /> },
      { path: "login", element: <Login /> },
      { path: "quiz", element: <Quiz /> },
      { path: "home", element: <Home /> },
      { path: "oauth/kakao", element: <KakaoCallback /> },
      { path: "mypage", element: <Mypage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
