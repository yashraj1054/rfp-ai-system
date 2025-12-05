import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import CreateRfpPage from "./pages/CreateRfpPage";
import VendorsPage from "./pages/VendorsPage";
import ResponsesPage from "./pages/ResponsesPage";
import ComparisonPage from "./pages/ComparisonPage";

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<CreateRfpPage />} />
        <Route path="/create-rfp" element={<CreateRfpPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/responses" element={<ResponsesPage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
