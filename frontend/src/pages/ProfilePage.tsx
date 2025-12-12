import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const LS_PROFILE = "iof_user_profile_v1";
const LS_INVOICES = "iof_invoices_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const profile = useMemo(() => safeJsonParse<any>(localStorage.getItem(LS_PROFILE)), []);

  function resetAll() {
    localStorage.removeItem(LS_PROFILE);
    localStorage.removeItem(LS_INVOICES);
    navigate("/login?reset=1");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <h1 className="text-2xl font-semibold">Il tuo profilo</h1>
        <p className="mt-2 text-slate-300">
          Qui trovi i dati essenziali usati per i calcoli dell’MVP.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          {!profile ? (
            <div className="text-slate-300">Nessun profilo salvato.</div>
          ) : (
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Categoria</span>
                <span className="font-semibold">{String(profile.category)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Previdenza</span>
                <span className="font-semibold">{String(profile.previdenza)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Aliquota</span>
                <span className="font-semibold">{String(profile.aliquotaImpostaSostitutiva)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cassa professionale</span>
                <span className="font-semibold">{profile.hasCassaProfessionale ? "Sì" : "No"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Creato il</span>
                <span className="font-semibold">{String(profile.createdAtIso ?? "-")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Aggiornato il</span>
                <span className="font-semibold">{String(profile.updatedAtIso ?? "-")}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            className="rounded-2xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700 hover:bg-slate-700 transition"
            onClick={resetAll}
          >
            Riparti da zero
          </button>

          <button
            className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition"
            onClick={() => navigate("/onboarding")}
          >
            Modifica il tuo profilo
          </button>
        </div>

        <div className="mt-6 text-xs text-slate-400">
          Stato prova (mock): in pre-beta simuleremo prova 30 giorni e poi paywall (Stripe test). Per ora è informativo.
        </div>
      </div>
    </div>
  );
}