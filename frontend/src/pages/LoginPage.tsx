import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="container">
        <div className="card card-xl">
          <div className="stack">
            <div>
              <h1 className="title">Accedi</h1>
              <p className="subtitle">
                Per l’MVP usiamo un login demo. Nella prossima fase inseriamo OTP
                + SSO (Google/LinkedIn/Facebook).
              </p>
            </div>

            <div className="button-row">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/onboarding")}
                type="button"
              >
                Entra come Professionista (demo)
                <span className="btn-sub">Nessun profilo → fai Onboarding</span>
              </button>

              <button className="btn btn-ghost" type="button" disabled>
                Entra come Commercialista (demo)
                <span className="btn-sub">Coming soon</span>
              </button>
            </div>

            <div className="divider" />

            <p className="hint">
              <strong>Nota</strong>
              <br />
              Se vuoi ripartire da zero: cancella il profilo salvato (tasto in
              Dashboard).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}