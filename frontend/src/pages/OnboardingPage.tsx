// frontend/src/pages/OnboardingPage.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  ForfettarioCategory,
  PrevidenzaType,
  StoredUserProfile,
} from "../types/taxProfile";

const LS_KEY = "iof_user_profile_v1";

function nowIso() {
  return new Date().toISOString();
}

type Step = 1 | 2;

export default function OnboardingPage() {
  const navigate = useNavigate();

  // Wizard
  const [step, setStep] = useState<Step>(1);

  // Profile fields
  const [category, setCategory] = useState<ForfettarioCategory>("PROFESSIONISTA");
  const [previdenza, setPrevidenza] = useState<PrevidenzaType>("GESTIONE_SEPARATA");
  const [hasCassa, setHasCassa] = useState(false);
  const [aliquota, setAliquota] = useState(0.05);

  const helper = useMemo(() => {
    if (category === "PROFESSIONISTA") {
      return "Tipico: Gestione Separata. Nel prossimo step scegli l’aliquota (5% o 15%).";
    }
    return "Tipico: Artigiani/Commercianti (INPS fissi + % su eccedenza).";
  }, [category]);

  const riepilogo = useMemo(() => {
    const catLabel =
      category === "PROFESSIONISTA"
        ? "Professionista"
        : category === "ARTIGIANO"
        ? "Artigiano"
        : "Commerciante";

    const prevLabel =
      previdenza === "GESTIONE_SEPARATA" ? "Gestione Separata" : "Artigiani/Commercianti";

    const aliqLabel = aliquota === 0.05 ? "5% (start-up)" : "15% (standard)";

    return { catLabel, prevLabel, aliqLabel };
  }, [category, previdenza, aliquota]);

  function saveAndGo() {
    const existing = localStorage.getItem(LS_KEY);
    const createdAtIso = existing ? (JSON.parse(existing).createdAtIso as string) : nowIso();

    const payload: StoredUserProfile = {
      category,
      previdenza,
      hasCassaProfessionale: hasCassa,
      aliquotaImpostaSostitutiva: aliquota,
      createdAtIso,
      updatedAtIso: nowIso(),
    };

    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    navigate("/dashboard?saved=1");
  }

  function goBack() {
    if (step === 1) navigate("/login");
    else setStep(1);
  }

  function canContinueStep1() {
    // oggi non abbiamo campi obbligatori “vuoti”, ma teniamo la guardia per future estensioni
    return Boolean(category) && Boolean(previdenza);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Onboarding</h1>
            <p className="mt-2 text-slate-300">
              Configuriamo in <span className="font-semibold">2 step</span> i dati fiscali essenziali, poi arrivi
              alla Dashboard.
            </p>
          </div>

          {/* Progress */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3">
            <div className="text-xs text-slate-400">Progresso</div>
            <div className="mt-1 flex items-center gap-2">
              <div
                className={`h-2 w-14 rounded-full ${
                  step >= 1 ? "bg-emerald-500" : "bg-slate-700"
                }`}
              />
              <div
                className={`h-2 w-14 rounded-full ${
                  step >= 2 ? "bg-emerald-500" : "bg-slate-700"
                }`}
              />
              <div className="ml-1 text-xs text-slate-300">
                Step {step}/2
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold">Categoria</div>
                <select
                  className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
                  value={category}
                  onChange={(e) => {
                    const v = e.target.value as ForfettarioCategory;
                    setCategory(v);
                    if (v === "PROFESSIONISTA") setPrevidenza("GESTIONE_SEPARATA");
                    else setPrevidenza("ARTIGIANI_COMMERCIANTI");
                  }}
                >
                  <option value="PROFESSIONISTA">Professionista</option>
                  <option value="ARTIGIANO">Artigiano</option>
                  <option value="COMMERCIANTE">Commerciante</option>
                </select>
                <div className="mt-2 text-xs text-slate-400">{helper}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold">Previdenza</div>
                <select
                  className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none disabled:opacity-70"
                  value={previdenza}
                  onChange={(e) => setPrevidenza(e.target.value as PrevidenzaType)}
                  disabled={category !== "PROFESSIONISTA"} // semplificazione MVP
                >
                  <option value="GESTIONE_SEPARATA">Gestione Separata</option>
                  <option value="ARTIGIANI_COMMERCIANTI">Artigiani/Commercianti</option>
                </select>
                <div className="mt-2 text-xs text-slate-400">
                  Per l’MVP: se non sei professionista, fissiamo Artigiani/Commercianti.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Cassa professionale</div>
                    <div className="text-xs text-slate-400">
                      Per ora la gestiamo come flag (futuro: regole dedicate / integrazioni).
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasCassa}
                    onChange={(e) => setHasCassa(e.target.checked)}
                    className="h-5 w-5 accent-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                className="rounded-2xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700 hover:bg-slate-700 transition"
                onClick={goBack}
              >
                Indietro
              </button>

              <button
                className={`rounded-2xl px-4 py-3 font-semibold transition ${
                  canContinueStep1()
                    ? "bg-emerald-500 text-slate-900 hover:brightness-110"
                    : "bg-slate-700 text-slate-300 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (!canContinueStep1()) return;
                  setStep(2);
                }}
              >
                Continua →
              </button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
                <div className="text-sm font-semibold">Aliquota imposta sostitutiva</div>
                <select
                  className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
                  value={aliquota}
                  onChange={(e) => setAliquota(Number(e.target.value))}
                >
                  <option value={0.05}>5% (start-up)</option>
                  <option value={0.15}>15% (standard)</option>
                </select>
                <div className="mt-2 text-xs text-slate-400">
                  Nota: in futuro verifichiamo i requisiti (start-up, ecc.) con regole più complete.
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
                <div className="text-sm font-semibold">Riepilogo</div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-xs text-slate-400">Categoria</div>
                    <div className="mt-1 font-semibold">{riepilogo.catLabel}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-xs text-slate-400">Previdenza</div>
                    <div className="mt-1 font-semibold">{riepilogo.prevLabel}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-xs text-slate-400">Aliquota</div>
                    <div className="mt-1 font-semibold">{riepilogo.aliqLabel}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-400">
                  Potrai modificare questi dati in seguito (impostazioni profilo). Per ora li fissiamo per far partire
                  la Dashboard.
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                className="rounded-2xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700 hover:bg-slate-700 transition"
                onClick={goBack}
              >
                ← Torna allo Step 1
              </button>

              <button
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition"
                onClick={saveAndGo}
              >
                Salva profilo e vai in Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}