// src/layouts/MainLayout.jsx
import { Outlet, useLocation } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

export default function MainLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/home' || location.pathname === '/';
  const isTemplatesPage = location.pathname.startsWith('/templates');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DashboardNavbar />
      <div className={`flex-1 overflow-x-hidden scroll-smooth ${isHomePage ? 'snap-y snap-proximity' : ''} ${isTemplatesPage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
        <Outlet />
      </div>
    </div>
  );
}