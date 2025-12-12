// frontend/src/types/taxProfile.ts

export type ForfettarioCategory = "PROFESSIONISTA" | "ARTIGIANO" | "COMMERCIANTE";

export type PrevidenzaType = "GESTIONE_SEPARATA" | "ARTIGIANI_COMMERCIANTI";

export interface UserTaxProfile {
  category: ForfettarioCategory;
  previdenza: PrevidenzaType;
  hasCassaProfessionale: boolean;
  aliquotaImpostaSostitutiva: number; // es. 0.05 o 0.15
}

export interface StoredUserProfile extends UserTaxProfile {
  createdAtIso: string;
  updatedAtIso: string;
}

export interface FiscalYearInput {
  year: number;
  fatturato: number;
  contributiVersatiPrecedente: number;
  imposteVersatePrecedente: number;
  ccIAA: number;
  rivalsaCassaTotale?: number;
}

export interface InvoiceItem {
  id: string;
  dateIso: string; // YYYY-MM-DD
  descrizione: string;
  importo: number;
}

export interface YearTaxContext {
  profile: UserTaxProfile;
  yearInput: FiscalYearInput;
  fatturatoYtd: number;
}

export interface AccantonamentoResult {
  fatturatoYtdPrima: number;
  fatturatoYtdDopo: number;
  residuoFatturabile: number;
  haSuperatoSoglia: boolean;
  accantonamentoTotale: number;
  percentualeSuFattura: number;
}