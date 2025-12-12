import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const LS_PROFILE = "iof_user_profile_v1";

function hasProfile(): boolean {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    return !!obj && typeof obj === "object" && !!obj.category;
  } catch {
    return false;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();

  const has = useMemo(() => hasProfile(), []);

  function enterProfessionalDemo() {
    if (has) navigate("/situation");
    else navigate("/onboarding");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <h1 className="text-3xl font-semibold">Accedi</h1>
        <p className="mt-2 text-slate-300">
          Per l’MVP usiamo un login demo. Nella prossima fase inseriamo OTP + SSO (Google/LinkedIn/Facebook).
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            className="group rounded-2xl border border-slate-800 bg-gradient-to-r from-emerald-500/70 to-indigo-400/70 p-5 text-left shadow hover:brightness-110 transition"
            onClick={enterProfessionalDemo}
          >
            <div className="text-base font-semibold text-slate-950">
              Entra come Professionista (demo)
            </div>
            <div className="mt-1 text-sm text-slate-900/90">
              {has ? "Profilo trovato → vai a La tua situazione" : "Nessun profilo → configura in 2 step"}
            </div>
          </button>

          <button
            className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5 text-left opacity-70 cursor-not-allowed"
            disabled
          >
            <div className="text-base font-semibold">Entra come Commercialista (demo)</div>
            <div className="mt-1 text-sm text-slate-400">Coming soon</div>
          </button>
        </div>

        <div className="mt-6 text-sm text-slate-300">
          <div className="font-semibold">Nota</div>
          <div className="text-slate-400">
            Se vuoi ripartire da zero: vai su “Il tuo profilo” e usa “Riparti da zero”.
          </div>
        </div>
      </div>
    </div>
  );
}