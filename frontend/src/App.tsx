import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import ProfilePage from "./pages/ProfilePage";

const LS_PROFILE = "iof_user_profile_v1";

function hasProfile(): boolean {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    return !!obj && typeof obj === "object" && !!obj.category;
  } catch {
    return false;
  }
}

function EntryRoute() {
  // Se ho profilo → vado a "La tua situazione"
  // Se non ho profilo → vado a "Accedi"
  return hasProfile() ? <Navigate to="/situation" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* ENTRY */}
      <Route path="/" element={<EntryRoute />} />

      {/* TUTTE LE PAGINE “DENTRO” IL LAYOUT */}
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route path="/situation" element={<DashboardPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Compat vecchi link */}
        <Route path="/dashboard" element={<Navigate to="/situation" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}