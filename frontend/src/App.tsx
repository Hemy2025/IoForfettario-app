// frontend/src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import ProfilePage from "./pages/ProfilePage";

// Se hai già una LoginPage, rimettila qui. Per ora redirectiamo all’onboarding.
function LoginStub() {
  return <Navigate to="/onboarding" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginStub />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}