// frontend/src/types/taxProfile.ts

export type ForfettarioCategory =
  | "PROFESSIONISTA"
  | "ARTIGIANO"
  | "COMMERCIANTE";

export type PrevidenzaTipo =
  | "GESTIONE_SEPARATA"
  | "ARTIGIANI_COMMERCIANTI"
  | "CASSA_PROFESSIONALE";

export interface UserTaxProfile {
  category: ForfettarioCategory;
  previdenza: PrevidenzaTipo;

  hasCassaProfessionale: boolean;
  cassaAliquotaRivalsa?: number; // es. 0.04 se applicabile

  aliquotaImpostaSostitutiva: number; // 0.05 o 0.15
}

/**
 * Profilo utente esteso per il frontend (possiamo aggiungere qui
 * altre preferenze, es. CCIAA, anno fiscale ecc.).
 */
export interface StoredUserProfile extends UserTaxProfile {
  ccIAA: number; // per ora un valore fisso per anno (es. 60€)
}