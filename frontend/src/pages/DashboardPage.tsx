// frontend/src/pages/DashboardPage.tsx

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { StoredUserProfile, InvoiceItem } from "../types/taxProfile";
import { healthCheck } from "../api/taxApi";

const LS_PROFILE = "iof_user_profile_v1";
const LS_INVOICES = "iof_invoices_v1";

function euro(x: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(x);
}

export default function DashboardPage() {
  const nav = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<StoredUserProfile | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [backendStatus, setBackendStatus] = useState<string>("…");

  useEffect(() => {
    const p = localStorage.getItem(LS_PROFILE);
    setProfile(p ? (JSON.parse(p) as StoredUserProfile) : null);

    const inv = localStorage.getItem(LS_INVOICES);
    setInvoices(inv ? (JSON.parse(inv) as InvoiceItem[]) : []);

    // health check
    healthCheck().then((r) => {
      if (r.ok) setBackendStatus("OK");
      else setBackendStatus("NON raggiungibile");
    });
  }, []);

  const saved = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return qs.get("saved") === "1";
  }, [location.search]);

  const fatturatoYtd = useMemo(() => invoices.reduce((s, x) => s + (Number(x.importo) || 0), 0), [invoices]);

  const residuo85k = useMemo(() => 85000 - fatturatoYtd, [fatturatoYtd]);

  if (!profile) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-xl font-semibold">Profilo non trovato</div>
        <p className="mt-2 text-slate-300">
          Prima completa l’onboarding.
        </p>
        <div className="mt-4">
          <Link className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 inline-block" to="/onboarding">
            Vai all’onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {saved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-50">
          ✅ Profilo salvato correttamente. Benvenuto nella Dashboard!
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-xs text-slate-400">Fatturato YTD</div>
          <div className="mt-1 text-2xl font-semibold">{euro(fatturatoYtd)}</div>
          <div className="mt-2 text-xs text-slate-400">Somma fatture inserite</div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-xs text-slate-400">Residuo verso 85.000€</div>
          <div className="mt-1 text-2xl font-semibold">{euro(residuo85k)}</div>
          <div className="mt-2 text-xs text-slate-400">
            {residuo85k >= 0 ? "Sei ancora nel limite forfettario." : "⚠️ Hai superato la soglia."}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-xs text-slate-400">Backend</div>
          <div className="mt-1 text-2xl font-semibold">{backendStatus}</div>
          <div className="mt-2 text-xs text-slate-400">Health check su /api/health</div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Il tuo profilo fiscale</div>
            <div className="text-sm text-slate-300">
              {profile.category} • {profile.previdenza} • imposta {Math.round(profile.aliquotaImpostaSostitutiva * 100)}%
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/onboarding"
              className="rounded-2xl bg-slate-800 px-4 py-2 ring-1 ring-slate-700 hover:bg-slate-700 transition"
            >
              Modifica profilo
            </Link>
            <button
              className="rounded-2xl bg-rose-500/15 px-4 py-2 ring-1 ring-rose-500/30 hover:bg-rose-500/20 transition"
              onClick={() => {
                localStorage.removeItem(LS_PROFILE);
                nav("/login");
              }}
            >
              Resetta profilo
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Link
            to="/invoices"
            className="rounded-2xl bg-slate-950/40 p-4 ring-1 ring-slate-800 hover:bg-slate-950/60 transition"
          >
            <div className="font-semibold">Gestisci fatture</div>
            <div className="text-sm text-slate-300">Inserisci fatture e accantonamento</div>
          </Link>

          <Link
            to="/tax"
            className="rounded-2xl bg-slate-950/40 p-4 ring-1 ring-slate-800 hover:bg-slate-950/60 transition"
          >
            <div className="font-semibold">Calcola imposte & F24</div>
            <div className="text-sm text-slate-300">Usa il backend fiscale</div>
          </Link>

          <div className="rounded-2xl bg-slate-950/40 p-4 ring-1 ring-slate-800">
            <div className="font-semibold">Prossimi step</div>
            <div className="text-sm text-slate-300">OTP/SSO • Trial • Stripe • Partner</div>
          </div>
        </div>
      </div>
    </div>
  );
}