import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SiteHeader />
            <HomePage />
            <SiteFooter />
          </>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
    </Routes>
  );
}
