// frontend/src/pages/ProfilePage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StoredUserProfile } from "../types/taxProfile";

const LS_PROFILE = "iof_user_profile_v1";

function nowIso() {
  return new Date().toISOString();
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const existing = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_PROFILE);
      return raw ? (JSON.parse(raw) as StoredUserProfile) : null;
    } catch {
      return null;
    }
  }, []);

  const [toast, setToast] = useState<string | null>(null);

  function resetOnboarding() {
    localStorage.removeItem(LS_PROFILE);
    setToast("Profilo rimosso. Riparti dall’onboarding.");
    setTimeout(() => {
      setToast(null);
      navigate("/onboarding");
    }, 900);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <h1 className="text-2xl font-semibold">Il tuo profilo</h1>
        <p className="mt-2 text-slate-300">
          Qui trovi i dati fiscali essenziali usati per i calcoli dell’MVP.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        {!existing ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Non hai ancora salvato un profilo. Vai su Onboarding.
            <div className="mt-3">
              <button
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition"
                onClick={() => navigate("/onboarding")}
              >
                Vai all’Onboarding
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card label="Categoria" value={existing.category} />
            <Card label="Previdenza" value={existing.previdenza} />
            <Card
              label="Aliquota imposta"
              value={`${Math.round(existing.aliquotaImpostaSostitutiva * 100)}%`}
            />
            <Card
              label="Cassa professionale"
              value={existing.hasCassaProfessionale ? "Sì" : "No"}
            />
            <Card label="Creato il" value={new Date(existing.createdAtIso).toLocaleString("it-IT")} />
            <Card label="Aggiornato il" value={new Date(existing.updatedAtIso).toLocaleString("it-IT")} />
          </div>
        )}

        {existing && (
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              className="rounded-2xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700 hover:bg-slate-700 transition"
              onClick={() => navigate("/onboarding")}
            >
              Modifica in Onboarding
            </button>

            <button
              className="rounded-2xl bg-rose-500/15 px-4 py-3 font-semibold text-rose-200 ring-1 ring-rose-500/25 hover:bg-rose-500/25 transition"
              onClick={resetOnboarding}
            >
              Riparti da zero
            </button>
          </div>
        )}

        {toast && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-200">
            {toast}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <div className="text-sm font-semibold">Stato prova (mock)</div>
        <p className="mt-2 text-sm text-slate-300">
          In pre-beta simuleremo prova 30 giorni e poi paywall (Stripe test). Per ora è solo informativo.
        </p>
        <div className="mt-4 inline-flex rounded-2xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-500/20">
          Prova attiva (demo)
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}