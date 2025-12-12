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

function prettyCategory(v: ForfettarioCategory) {
  if (v === "PROFESSIONISTA") return "Professionista";
  if (v === "ARTIGIANO") return "Artigiano";
  return "Commerciante";
}
function prettyPrevidenza(v: PrevidenzaType) {
  if (v === "GESTIONE_SEPARATA") return "Gestione Separata";
  return "Artigiani/Commercianti";
}
function prettyAliquota(v: number) {
  return v === 0.05 ? "5% (start-up)" : "15% (standard)";
}

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  const [category, setCategory] = useState<ForfettarioCategory>("PROFESSIONISTA");
  const [previdenza, setPrevidenza] = useState<PrevidenzaType>("GESTIONE_SEPARATA");
  const [hasCassa, setHasCassa] = useState(false);
  const [aliquota, setAliquota] = useState(0.05);

  const helper = useMemo(() => {
    if (category === "PROFESSIONISTA") {
      return "Tipico: Gestione Separata. Nel prossimo step scegli l’aliquota (5% o 15%).";
    }
    return "Tipico: Artigiani/Commercianti (contributi fissi + % su eccedenza).";
  }, [category]);

  function saveProfile() {
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

    // ✅ Vai SEMPRE alla tua situazione
    navigate("/situation?saved=1");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <h1 className="text-2xl font-semibold">Configura il tuo profilo</h1>
        <p className="mt-2 text-slate-300">
          In 2 step impostiamo i dati essenziali. Poi vedi <span className="font-semibold">La tua situazione</span>.
        </p>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-sm font-semibold">Progresso</div>
          <div className="mt-1 text-xs text-slate-400">Step {step}/2</div>
        </div>

        {step === 1 && (
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
                className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:outline-none"
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Cassa professionale</div>
                  <div className="text-xs text-slate-400">
                    Per ora è un flag (in futuro: regole dedicate / integrazioni).
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
        )}

        {step === 2 && (
          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
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

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-sm font-semibold">Riepilogo</div>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Categoria</span>
                  <span className="font-semibold">{prettyCategory(category)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Previdenza</span>
                  <span className="font-semibold">{prettyPrevidenza(previdenza)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Aliquota</span>
                  <span className="font-semibold">{prettyAliquota(aliquota)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cassa professionale</span>
                  <span className="font-semibold">{hasCassa ? "Sì" : "No"}</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                Potrai modificare questi dati in seguito dal menu “Il tuo profilo”.
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {step === 1 ? (
            <button
              className="rounded-2xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700 hover:bg-slate-700 transition"
              onClick={() => navigate("/login")}
            >
              Indietro
            </button>
          ) : (
            <button
              className="rounded-2xl bg-slate-800 px-4 py-3 ring-1 ring-slate-700 hover:bg-slate-700 transition"
              onClick={() => setStep(1)}
            >
              Indietro
            </button>
          )}

          {step === 1 ? (
            <button
              className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition"
              onClick={() => setStep(2)}
            >
              Continua
            </button>
          ) : (
            <button
              className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 hover:brightness-110 transition"
              onClick={saveProfile}
            >
              Salva profilo e continua
            </button>
          )}
        </div>
      </div>
    </div>
  );
}