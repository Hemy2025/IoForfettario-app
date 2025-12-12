// frontend/src/components/Layout.tsx

import { Link, useLocation } from "react-router-dom";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  const nav = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/invoices", label: "Fatture" },
    { to: "/tax", label: "Imposte & F24" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800/60 ring-1 ring-slate-700" />
            <div>
              <div className="text-sm font-semibold leading-tight">IoForfettario</div>
              <div className="text-xs text-slate-400 leading-tight">MVP • Fintech UX</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cx(
                  "rounded-xl px-3 py-2 text-sm transition",
                  pathname === n.to
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-slate-500">
        © {new Date().getFullYear()} IoForfettario • Demo MVP (mock API)
      </footer>
    </div>
  );
}