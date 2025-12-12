import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LS_PROFILE = "iof_user_profile_v1";

export default function LandingPage() {
  const navigate = useNavigate();

  const hasProfile = !!localStorage.getItem(LS_PROFILE);

  // Se vuoi che l’utente VEDA sempre la landing anche se ha già un profilo,
  // non fare redirect automatico.
  // Se invece preferisci “auto-continue”, scommenta sotto:
  //
  // useEffect(() => {
  //   if (hasProfile) navigate("/dashboard");
  // }, [hasProfile, navigate]);

  function reset() {
    localStorage.removeItem(LS_PROFILE);
    localStorage.removeItem("iof_invoices_v1");
    navigate("/profile?reset=1");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow">
        <div className="flex flex-col gap-2">
          <div className="text-3xl font-semibold">IoForfettario</div>
          <div className="text-slate-300">
            Tasse senza problemi. Vedi subito <span className="font-semibold">quanto mettere da parte</span> e{" "}
            <span className="font-semibold">quanto puoi ancora fatturare</span>.
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">1) Inserisci pochi dati</div>
            <div className="mt-1 text-sm text-slate-400">
              Categoria, previdenza e aliquota. In 60 secondi.
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">2) Aggiungi le fatture</div>
            <div className="mt-1 text-sm text-slate-400">
              Ti mostriamo subito situazione e limite 85.000€.
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">3) Niente ansia scadenze</div>
            <div className="mt-1 text-sm text-slate-400">
              Il sistema ti guida passo-passo (MVP demo).
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-slate-400">
            MVP demo — dati simulati — nessun valore legale/fiscale.
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            {hasProfile ? (
              <>
                <button
                  className="rounded-2xl bg-slate-800 px-5 py-3 ring-1 ring-slate-700 hover:bg-slate-700 transition"
                  onClick={() => navigate("/dashboard")}
                >
                  Continua
                </button>
                <button
                  className="rounded-2xl bg-slate-900 px-5 py-3 ring-1 ring-slate-700 hover:bg-slate-800 transition"
                  onClick={reset}
                >
                  Riparti da zero
                </button>
              </>
            ) : (
              <button
                className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 hover:brightness-110 transition"
                onClick={() => navigate("/onboarding")}
              >
                Inizia ora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}