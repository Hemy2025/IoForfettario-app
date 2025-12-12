import { NavLink, Outlet } from "react-router-dom";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_500px_at_20%_0%,rgba(16,185,129,0.18),transparent),radial-gradient(900px_450px_at_80%_20%,rgba(59,130,246,0.18),transparent)] bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/70 bg-slate-950/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">IoForfettario</div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/25">
              demo
            </span>
            <div className="text-xs text-slate-400 ml-2">Tasse senza problemi</div>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/situation"
              className={({ isActive }) =>
                cx(
                  "rounded-full px-4 py-2 text-sm ring-1 transition",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                    : "bg-slate-900/30 text-slate-200 ring-slate-700/60 hover:bg-slate-900/50"
                )
              }
            >
              La tua situazione
            </NavLink>

            <NavLink
              to="/invoices"
              className={({ isActive }) =>
                cx(
                  "rounded-full px-4 py-2 text-sm ring-1 transition",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                    : "bg-slate-900/30 text-slate-200 ring-slate-700/60 hover:bg-slate-900/50"
                )
              }
            >
              Le tue fatture
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cx(
                  "rounded-full px-4 py-2 text-sm ring-1 transition",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                    : "bg-slate-900/30 text-slate-200 ring-slate-700/60 hover:bg-slate-900/50"
                )
              }
            >
              Il tuo profilo
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* QUI viene renderizzata la pagina (Dashboard / Fatture / Profilo / Login / Onboarding) */}
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-slate-400">
        MVP demo — dati simulati — niente valore legale/fiscale.
      </footer>
    </div>
  );
}