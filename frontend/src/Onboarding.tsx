import { useState } from "react";
import type {
  StoredUserProfile,
  ForfettarioCategory,
  PrevidenzaType,
} from "./types/taxProfile";

interface OnboardingProps {
  profile: StoredUserProfile;
  onProfileChange: (profile: StoredUserProfile) => void;
}

const categoryOptions: { value: ForfettarioCategory; label: string }[] = [
  { value: "PROFESSIONISTA", label: "Professionista" },
  { value: "ARTIGIANO", label: "Artigiano" },
  { value: "COMMERCIANTE", label: "Commerciante" },
];

const previdenzaOptions: { value: PrevidenzaType; label: string }[] = [
  { value: "GESTIONE_SEPARATA", label: "Gestione separata" },
  {
    value: "ARTIGIANI_COMMERCIANTI",
    label: "Gestione Artigiani / Commercianti",
  },
];

const aliquotaOptions = [
  { value: 0.05, label: "5% (start-up/primi 5 anni)" },
  { value: 0.15, label: "15% (regime ordinario forfettari)" },
];

export default function Onboarding({ profile, onProfileChange }: OnboardingProps) {
  const [localProfile, setLocalProfile] = useState<StoredUserProfile>(profile);
  const [savedStatus, setSavedStatus] = useState<"idle" | "saved">("idle");

  const handleChange =
    (field: keyof StoredUserProfile) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      let value: any = e.target.value;

      if (field === "hasCassaProfessionale") {
        value = (e.target as HTMLInputElement).checked;
      } else if (field === "aliquotaImpostaSostitutiva") {
        value = Number(value);
      }

      setLocalProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
      setSavedStatus("idle"); // se cambia qualcosa, sparisce il messaggio “salvato”
    };

  const handleSave = () => {
    onProfileChange(localProfile);
    setSavedStatus("saved");
    setTimeout(() => setSavedStatus("idle"), 2500);
  };

  return (
    <>
      <div className="card-header">
        <div>
          <div className="card-title">Profilo fiscale (onboarding rapido)</div>
          <div className="card-caption">
            Seleziona categoria, gestione previdenziale e aliquota. Queste
            informazioni verranno usate come base per tutti i calcoli.
          </div>
        </div>
      </div>

      <div className="onboarding-row">
        <div className="form-field">
          <label className="form-label">Categoria</label>
          <select
            className="form-input onboarding-select"
            value={localProfile.category}
            onChange={handleChange("category")}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Previdenza</label>
          <select
            className="form-input onboarding-select"
            value={localProfile.previdenza}
            onChange={handleChange("previdenza")}
          >
            {previdenzaOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="onboarding-row">
        <div className="form-field">
          <label className="form-label">Aliquota imposta sostitutiva</label>
          <select
            className="form-input onboarding-select"
            value={localProfile.aliquotaImpostaSostitutiva}
            onChange={handleChange("aliquotaImpostaSostitutiva")}
          >
            {aliquotaOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field" style={{ marginTop: "20px" }}>
          <label className="form-label">&nbsp;</label>
          <label className="onboarding-checkbox-row">
            <input
              type="checkbox"
              checked={localProfile.hasCassaProfessionale}
              onChange={handleChange("hasCassaProfessionale")}
            />
            <span>Ho una cassa professionale (rivalsa 4%)</span>
          </label>
        </div>
      </div>

      <button
        type="button"
        className="onboarding-save-button"
        onClick={handleSave}
      >
        Salva profilo fiscale
      </button>

      {savedStatus === "saved" && (
        <div className="status-bar-inline">Profilo salvato ✅</div>
      )}
    </>
  );
}