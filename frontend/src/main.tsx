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
import PortfolioPage from "./pages/stocks/Portfolio.tsx";
import OrdersPage from "./pages/stocks/Orders.tsx";
import StockListPage from "./pages/stocks/List.tsx";
import StockDetailPage from "./pages/stocks/Details.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  { path: "oauth/kakao", element: <KakaoCallback /> },
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Splash /> },
      { path: "login", element: <Login /> },
      { path: "quiz", element: <Quiz /> },
      { path: "home", element: <Home /> },
      { path: "mypage", element: <Mypage /> },
      { path: "stocks", element: <PortfolioPage /> },
      { path: "stocks/balance", element: <PortfolioPage /> },
      { path: "stocks/orders", element: <OrdersPage /> },
      { path: "stocks/list", element: <StockListPage /> },
      { path: "stocks/:code", element: <StockDetailPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);
