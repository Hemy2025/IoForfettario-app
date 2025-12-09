/**
 * MOTORE A REGOLE – IOFORFETTARIO
 * Implementazione di riferimento allineata ai test Jest
 * e alla logica multi-anno del regime forfettario.
 */

/* --------------------------------------------------------------- */
/*  TIPI DI DOMINIO                                                */
/* --------------------------------------------------------------- */

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

  // 0.05 (5%) o 0.15 (15%)
  aliquotaImpostaSostitutiva: number;
}

export interface FiscalYearInput {
  year: number;
  fatturato: number;

  // contributi versati nell'anno precedente (per anno 1+)
  contributiVersatiPrecedente: number;
  // imposte versate nell'anno precedente (per anno 1+)
  imposteVersatePrecedente: number;

  // quota CCIAA annua
  ccIAA: number;

  // eventuale valore totale di rivalsa cassa già calcolato a monte
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

/* --------------------------------------------------------------- */
/*  CONFIGURAZIONE PARAMETRI                                       */
/* --------------------------------------------------------------- */

export const TAX_CONFIG = {
  // coefficiente di redditività per categoria
  coeffProfessionista: 0.78,
  coeffArtigiano: 0.86,
  coeffCommerciante: 0.4,

  // contributi fissi annui (da Excel / INPS; placeholder qui)
  contributiFissiAnnuiArtigiani: 0,
  contributiFissiAnnuiCommercianti: 0,

  // soglia imponibile oltre cui scattano i contributi percentuali
  sogliaContributiPercArtigiani: 0,
  sogliaContributiPercCommercianti: 0,

  // aliquote percentuali contributi (valori da allineare ai fogli Excel)
  aliquotaPercArtigiani: 0,
  aliquotaPercCommercianti: 0,

  // 26,07% gestione separata (come nel foglio Excel: 46.800 * 26,07% ≈ 12.200,76)
  aliquotaPercGestioneSeparata: 0.2607,

  // acconti: 50% + 50%
  accontoPercentuale: 0.5,
};

/* --------------------------------------------------------------- */
/*  FUNZIONI DI SUPPORTO                                           */
/* --------------------------------------------------------------- */

export function getCoeffRedditivita(profile: UserTaxProfile): number {
  switch (profile.category) {
    case "PROFESSIONISTA":
      return TAX_CONFIG.coeffProfessionista;
    case "ARTIGIANO":
      return TAX_CONFIG.coeffArtigiano;
    case "COMMERCIANTE":
      return TAX_CONFIG.coeffCommerciante;
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
    case "GESTIONE_SEPARATA":
      // solo % sul reddito lordo
      return {
        fissi: 0,
        percentuali: redditoLordo * TAX_CONFIG.aliquotaPercGestioneSeparata,
      };

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

    case "CASSA_PROFESSIONALE":
      // per ora contributi gestiti a parte (es. tramite rivalsa 4%)
      return { fissi: 0, percentuali: 0 };
  }
}

/**
 * Calcolo del reddito netto imponibile in funzione dell'anno:
 *
 * - Anno 0 (contributiVersatiPrecedente <= 0):
 *   - Gestione separata: NON deduco i contributi → reddito netto = reddito lordo
 *   - Artigiani/Commercianti: deduco contributi fissi + % (come da Excel)
 *   - Cassa professionale: per ora identico al lordo (contributi=0)
 *
 * - Anno 1+:
 *   - reddito netto = reddito lordo - contributiVersatiPrecedente
 */
export function computeRedditoImponibileNetto(
  profile: UserTaxProfile,
  input: FiscalYearInput,
  redditoLordo: number,
  contributiFissi: number,
  contributiPercentuali: number
): number {
  const anno0 = input.contributiVersatiPrecedente <= 0;

  if (anno0) {
    switch (profile.previdenza) {
      case "GESTIONE_SEPARATA":
        return redditoLordo;
      case "ARTIGIANI_COMMERCIANTI":
        return redditoLordo - contributiFissi - contributiPercentuali;
      case "CASSA_PROFESSIONALE":
        return redditoLordo;
    }
  }

  // Anni successivi: deduco i contributi versati l'anno precedente
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

/* --------------------------------------------------------------- */
/*  FUNZIONE PRINCIPALE – computeFiscalYear                        */
/* --------------------------------------------------------------- */

export function computeFiscalYear(
  profile: UserTaxProfile,
  input: FiscalYearInput
): FiscalYearResult {
  const warnings: string[] = [];

  const redditoLordo = computeRedditoImponibileLordo(profile, input);
  const { fissi, percentuali } = computeContributiInps(profile, redditoLordo);

  const redditoNetto = computeRedditoImponibileNetto(
    profile,
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

  const rivalsa =
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

    importoRivalsaCassa: rivalsa,
    creditoDaCompensare,

    totaleF24Giugno: totaliF24.giugno,
    totaleF24Novembre: totaliF24.novembre,

    warnings,
  };
}

/* --------------------------------------------------------------- */
/*  FUNZIONE MULTI-ANNO                                            */
/* --------------------------------------------------------------- */

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