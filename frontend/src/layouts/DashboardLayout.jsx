import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Header />
      <main className="grid grid-cols-[260px_1fr] gap-5 max-md:grid-cols-1">
        <Sidebar />
        <div className="flex flex-col gap-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
