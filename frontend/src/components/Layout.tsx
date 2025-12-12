// frontend/src/components/Layout.tsx
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Layout() {
  const location = useLocation();
  const isAuthPage =
    location.pathname.startsWith("/login") || location.pathname.startsWith("/onboarding");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="group">
            <div className="text-lg font-semibold tracking-tight">
              IoForfettario
              <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
                demo
              </span>
            </div>
            <div className="text-xs text-slate-400 group-hover:text-slate-300 transition">
              Tasse senza problemi
            </div>
          </Link>

          {!isAuthPage && (
            <nav className="hidden items-center gap-2 md:flex">
              <NavTab to="/dashboard" label="La tua situazione" />
              <NavTab to="/invoices" label="Le tue fatture" />
              <NavTab to="/profile" label="Il tuo profilo" />
            </nav>
          )}
        </div>

        {/* Mobile tabs */}
        {!isAuthPage && (
          <div className="mx-auto max-w-5xl px-4 pb-3 md:hidden">
            <div className="grid grid-cols-3 gap-2">
              <NavTab to="/dashboard" label="Situazione" small />
              <NavTab to="/invoices" label="Fatture" small />
              <NavTab to="/profile" label="Profilo" small />
            </div>
          </div>
        )}
      </header>

      {/* Page */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
          MVP demo — dati simulati — niente valore legale/fiscale.
        </div>
      </footer>
    </div>
  );
}

function NavTab({ to, label, small }: { to: string; label: string; small?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "rounded-2xl px-4 py-2 text-sm font-semibold ring-1 transition",
          small && "px-3 py-2 text-xs",
          isActive
            ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
            : "bg-slate-900/40 text-slate-200 ring-slate-800 hover:bg-slate-900/70 hover:ring-slate-700"
        )
      }
    >
      {label}
    </NavLink>
  );
}