// backend/src/rules/taxRules.ts
// Motore a regole per il regime forfettario – IoForfettario

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
  cassaAliquotaRivalsa?: number; // es. 0.04

  // 0.05 (5%) oppure 0.15 (15%)
  aliquotaImpostaSostitutiva: number;
}

export interface FiscalYearInput {
  year: number;
  fatturato: number;

  // Versato l'anno precedente (saldi + acconti)
  contributiVersatiPrecedente: number;
  imposteVersatePrecedente: number;

  // Diritto camerale annuo
  ccIAA: number;

  // Opzionale: importo totale rivalsa cassa già calcolato
  rivalsaCassaTotale?: number;
}

export interface FiscalYearResult {
  year: number;

  redditoImponibileLordo: number;
  redditoImponibileNetto: number;

  contributiInpsFissi: number;
  contributiInpsPercentuali: number;
  contributiTotaliVersatiAnnoPrecedente: number;

  impostaSostitutivaLorda: number;
  saldoImpostaSostitutiva: number;

  primoAccontoImposta: number;
  secondoAccontoImposta: number;

  primoAccontoContributi: number;
  secondoAccontoContributi: number;

  importoRivalsaCassa?: number;
  creditoDaCompensare?: number;

  totaleF24Giugno: number;
  totaleF24Novembre: number;

  warnings: string[];
}

export interface MultiYearInput {
  profile: UserTaxProfile;
  anni: {
    year: number;
    fatturato: number;
  }[];
  ccIAA: number;
}

export interface MultiYearResult {
  anni: FiscalYearResult[];
}

// TODO: sostituire questi valori con quelli reali (Excel + normativa)
export const TAX_CONFIG = {
  coeffProfessionista: 0.78,
  coeffArtigiano: 0.86,
  coeffCommerciante: 0.4,

  contributiFissiAnnuiArtigiani: 0,
  contributiFissiAnnuiCommercianti: 0,

  sogliaContributiPercArtigiani: 0,
  sogliaContributiPercCommercianti: 0,

  aliquotaPercArtigiani: 0,
  aliquotaPercCommercianti: 0,
  aliquotaPercGestioneSeparata: 0,

  accontoPercentuale: 0.5,
};

export function getCoeffRedditivita(profile: UserTaxProfile): number {
  switch (profile.category) {
    case "PROFESSIONISTA":
      return TAX_CONFIG.coeffProfessionista;
    case "ARTIGIANO":
      return TAX_CONFIG.coeffArtigiano;
    case "COMMERCIANTE":
      return TAX_CONFIG.coeffCommerciante;
    default:
      return TAX_CONFIG.coeffProfessionista;
  }
}

export function computeRedditoImponibileLordo(
  profile: UserTaxProfile,
  input: FiscalYearInput
): number {
  return input.fatturato * getCoeffRedditivita(profile);
}

export function computeContributiInps(
  profile: UserTaxProfile,
  redditoLordo: number
): { fissi: number; percentuali: number } {
  switch (profile.previdenza) {
    case "GESTIONE_SEPARATA": {
      const percentuali =
        redditoLordo * TAX_CONFIG.aliquotaPercGestioneSeparata;
      return { fissi: 0, percentuali };
    }

    case "ARTIGIANI_COMMERCIANTI": {
      const isArt = profile.category === "ARTIGIANO";

      const fissi = isArt
        ? TAX_CONFIG.contributiFissiAnnuiArtigiani
        : TAX_CONFIG.contributiFissiAnnuiCommercianti;

      const soglia = isArt
        ? TAX_CONFIG.sogliaContributiPercArtigiani
        : TAX_CONFIG.sogliaContributiPercCommercianti;

      const aliquota = isArt
        ? TAX_CONFIG.aliquotaPercArtigiani
        : TAX_CONFIG.aliquotaPercCommercianti;

      const eccedenza = Math.max(0, redditoLordo - soglia);
      const percentuali = eccedenza * aliquota;

      return { fissi, percentuali };
    }

    case "CASSA_PROFESSIONALE": {
      // In questa versione il dettaglio dei contributi di cassa non è gestito
      return { fissi: 0, percentuali: 0 };
    }

    default:
      return { fissi: 0, percentuali: 0 };
  }
}

export function computeRedditoImponibileNetto(
  input: FiscalYearInput,
  redditoLordo: number,
  contributiFissi: number,
  contributiPercentuali: number
): number {
  const anno0 = input.contributiVersatiPrecedente <= 0;

  if (anno0) {
    return redditoLordo - contributiFissi - contributiPercentuali;
  }

  return redditoLordo - input.contributiVersatiPrecedente;
}

export function computeImpostaSostitutivaLorda(
  profile: UserTaxProfile,
  redditoNetto: number
): number {
  return redditoNetto * profile.aliquotaImpostaSostitutiva;
}

export function computeSaldoImpostaSostitutiva(
  impostaLorda: number,
  imposteVersatePrecedente: number
): number {
  return impostaLorda - imposteVersatePrecedente;
}

export function computeAcconti(
  baseImposta: number,
  baseContributi: number
): {
  primoAccontoImposta: number;
  secondoAccontoImposta: number;
  primoAccontoContributi: number;
  secondoAccontoContributi: number;
} {
  const p = TAX_CONFIG.accontoPercentuale;

  return {
    primoAccontoImposta: baseImposta * p,
    secondoAccontoImposta: baseImposta * p,
    primoAccontoContributi: baseContributi * p,
    secondoAccontoContributi: baseContributi * p,
  };
}

export function computeTotaliF24(
  ccIAA: number,
  saldoImposta: number,
  saldoContributiPercentuali: number,
  primoAccontoImposta: number,
  secondoAccontoImposta: number,
  primoAccontoContributi: number,
  secondoAccontoContributi: number
): { giugno: number; novembre: number } {
  const giugno =
    saldoImposta +
    saldoContributiPercentuali +
    primoAccontoImposta +
    primoAccontoContributi +
    ccIAA;

  const novembre = secondoAccontoImposta + secondoAccontoContributi;

  return { giugno, novembre };
}

export function computeFiscalYear(
  profile: UserTaxProfile,
  input: FiscalYearInput
): FiscalYearResult {
  const warnings: string[] = [];

  const redditoLordo = computeRedditoImponibileLordo(profile, input);
  const { fissi, percentuali } = computeContributiInps(profile, redditoLordo);

  const redditoNetto = computeRedditoImponibileNetto(
    input,
    redditoLordo,
    fissi,
    percentuali
  );

  const impostaLorda = computeImpostaSostitutivaLorda(profile, redditoNetto);

  const saldoImposta = computeSaldoImpostaSostitutiva(
    impostaLorda,
    input.imposteVersatePrecedente
  );

  const acconti = computeAcconti(impostaLorda, percentuali);

  const totaliF24 = computeTotaliF24(
    input.ccIAA,
    saldoImposta,
    percentuali,
    acconti.primoAccontoImposta,
    acconti.secondoAccontoImposta,
    acconti.primoAccontoContributi,
    acconti.secondoAccontoContributi
  );

  const importoRivalsaCassa =
    profile.hasCassaProfessionale && profile.cassaAliquotaRivalsa
      ? input.fatturato * profile.cassaAliquotaRivalsa
      : input.rivalsaCassaTotale;

  const creditoDaCompensare = saldoImposta < 0 ? Math.abs(saldoImposta) : 0;

  return {
    year: input.year,
    redditoImponibileLordo: redditoLordo,
    redditoImponibileNetto: redditoNetto,
    contributiInpsFissi: fissi,
    contributiInpsPercentuali: percentuali,
    contributiTotaliVersatiAnnoPrecedente:
      input.contributiVersatiPrecedente,
    impostaSostitutivaLorda: impostaLorda,
    saldoImpostaSostitutiva: saldoImposta,
    primoAccontoImposta: acconti.primoAccontoImposta,
    secondoAccontoImposta: acconti.secondoAccontoImposta,
    primoAccontoContributi: acconti.primoAccontoContributi,
    secondoAccontoContributi: acconti.secondoAccontoContributi,
    importoRivalsaCassa,
    creditoDaCompensare,
    totaleF24Giugno: totaliF24.giugno,
    totaleF24Novembre: totaliF24.novembre,
    warnings,
  };
}

export function computeMultiYear(input: MultiYearInput): MultiYearResult {
  const results: FiscalYearResult[] = [];

  let contributiPrev = 0;
  let impostePrev = 0;

  for (const anno of input.anni) {
    const fy: FiscalYearInput = {
      year: anno.year,
      fatturato: anno.fatturato,
      contributiVersatiPrecedente: contributiPrev,
      imposteVersatePrecedente: impostePrev,
      ccIAA: input.ccIAA,
    };

    const result = computeFiscalYear(input.profile, fy);
    results.push(result);

    contributiPrev =
      result.contributiInpsPercentuali +
      result.primoAccontoContributi +
      result.secondoAccontoContributi;

    impostePrev =
      result.impostaSostitutivaLorda +
      result.primoAccontoImposta +
      result.secondoAccontoImposta;
  }

  return { anni: results };
}
