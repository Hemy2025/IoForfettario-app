// frontend/src/pages/DashboardPage.tsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

const LS_INVOICES = "iof_invoices_v1";
const LS_PROFILE = "iof_user_profile_v1";

type Invoice = { id: string; dateIso: string; amount: number };

function eur(x: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(x);
}

function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(LS_INVOICES);
    return raw ? (JSON.parse(raw) as Invoice[]) : [];
  } catch {
    return [];
  }
}

export default function DashboardPage() {
  const location = useLocation();
  const saved = new URLSearchParams(location.search).get("saved") === "1";

  const items = useMemo(() => loadInvoices(), []);
  const fatturato = useMemo(() => items.reduce((s, x) => s + x.amount, 0), [items]);

  const residuo = useMemo(() => 85000 - fatturato, [fatturato]);

  // MVP: “prudenziale” finché non agganciamo il calcolo reale per singola fattura
  const accantonamentoStimato = useMemo(() => Math.max(0, fatturato * 0.3), [fatturato]);

  const stato = useMemo(() => {
    if (!localStorage.getItem(LS_PROFILE)) return "serve_profilo";
    if (residuo < 0) return "oltre_limite";
    return "in_linea";
  }, [residuo]);

  return (
    <div className="space-y-6">
      {saved && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
          Profilo salvato ✅ Ora sei pronto.
        </div>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <h1 className="text-2xl font-semibold">La tua situazione</h1>
        <p className="mt-2 text-slate-300">
          Qui vedi le 3 cose che contano davvero: fatturato, accantonamento suggerito e residuo sul limite.
        </p>

        <div className="mt-4">
          {stato === "serve_profilo" && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Per partire, salva il tuo profilo fiscale.
              <div className="mt-3">
                <Link
                  to="/onboarding"
                  className="inline-flex rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition"
                >
                  Vai all’Onboarding
                </Link>
              </div>
            </div>
          )}

          {stato === "in_linea" && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Sei in linea ✅ Stai gestendo bene l’anno.
            </div>
          )}

          {stato === "oltre_limite" && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
              Hai superato il limite di 85.000€. Serve valutare il passaggio di regime.
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Quanto hai fatturato" value={eur(fatturato)} subtitle="Somma delle fatture emesse" />
        <KpiCard
          title="Quanto sarebbe prudente mettere da parte"
          value={eur(accantonamentoStimato)}
          subtitle="Stima MVP (prudenziale)"
        />
        <KpiCard
          title="Quanto puoi ancora fatturare"
          value={eur(residuo)}
          subtitle="Restando nel forfettario (85.000€)"
          highlight={residuo < 0 ? "bad" : residuo < 10000 ? "warn" : "ok"}
        />
      </div>

      {/* CTA */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">Prossimo passo</div>
            <div className="mt-1 text-sm text-slate-300">
              Aggiungi una fattura e noi aggiorniamo automaticamente la tua situazione.
            </div>
          </div>

          <Link
            to="/invoices"
            className="inline-flex justify-center rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition ring-1 ring-emerald-400/30"
          >
            Aggiungi una fattura
          </Link>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  highlight,
}: {
  title: string;
  value: string;
  subtitle: string;
  highlight?: "ok" | "warn" | "bad";
}) {
  const ring =
    highlight === "bad"
      ? "ring-rose-500/25"
      : highlight === "warn"
      ? "ring-amber-500/25"
      : "ring-slate-800";

  const bg =
    highlight === "bad"
      ? "bg-rose-500/10"
      : highlight === "warn"
      ? "bg-amber-500/10"
      : "bg-slate-900/40";

  return (
    <div className={`rounded-3xl border border-slate-800 ${bg} p-6 shadow ring-1 ${ring}`}>
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-slate-300">{subtitle}</div>
    </div>
  );
}