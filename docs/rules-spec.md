/**
 * Motore a regole per regime forfettario – IoForfettario
 *
 * ATTENZIONE:
 * - I valori numerici (aliquote, soglie, contributi fissi, ecc.)
 *   vanno allineati ai dati ufficiali e/o alle tabelle presenti
 *   nel file Excel "CALCOLO_IMPOSTE_CORRETTO_AGGIORNATO_170725.xlsx".
 * - Questa implementazione è strutturata per essere facilmente
 *   adattata: tutte le costanti devono stare in TAX_CONFIG.
 */

/* ------------------------------------------------------------------ */
/*  TIPI DI DOMINIO                                                   */
/* ------------------------------------------------------------------ */

// Tipologie di contribuente in regime forfettario
export type ForfettarioCategory =
  | "PROFESSIONISTA"
  | "ARTIGIANO"
  | "COMMERCIANTE";

// Tipo di gestione previdenziale
export type PrevidenzaTipo =
  | "GESTIONE_SEPARATA"
  | "ARTIGIANI_COMMERCIANTI"
  | "CASSA_PROFESSIONALE";

// Profilo fiscale "lento" dell'utente
export interface UserTaxProfile {
  category: ForfettarioCategory;

  previdenza: PrevidenzaTipo;

  // Cassa professionale (es. avvocati, ingegneri, ecc.)
  hasCassaProfessionale: boolean;
  cassaAliquotaRivalsa?: number; // tipicamente 0.04

  // Aliquota imposta sostitutiva (5% o 15%)
  aliquotaImpostaSostitutiva: number;

  // In futuro: eventuali riduzioni/sgravi
}

// Dati di un singolo anno fiscale
export interface FiscalYearInput {
  year: number;
  fatturato: number;

  // Versamenti anno precedente (saldi + acconti)
  contributiVersatiPrecedente: number;
  imposteVersatePrecedente: number;

  // Importo CCIAA
  ccIAA: number;

  // Totale rivalsa cassa fatturata nell’anno (se si vuole tracciarla separatamente)
  rivalsaCassaTotale?: number;
}

// Risultato del calcolo per un anno
export interface FiscalYearResult {
  year: number;

  // Redditi
  redditoImponibileLordo: number;
  redditoImponibileNetto: number;

  // Contributi
  contributiInpsFissi: number;
  contributiInpsPercentuali: number;
  contributiTotaliVersatiAnnoPrecedente: number;

  // Imposte
  impostaSostitutivaLorda: number;
  saldoImpostaSostitutiva: number;

  // Acconti (imposta)
  primoAccontoImposta: number;
  secondoAccontoImposta: number;

  // Acconti (contributi)
  primoAccontoContributi: number;
  secondoAccontoContributi: number;

  // Rivalsa e crediti
  importoRivalsaCassa?: number;
  creditoDaCompensare?: number;

  // Totali F24
  totaleF24Giugno: number;
  totaleF24Novembre: number;

  // Messaggi informativi
  warnings: string[];
}

// Input multi-anno
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

/* ------------------------------------------------------------------ */
/*  CONFIGURAZIONE PARAMETRI FISCALI                                  */
/* ------------------------------------------------------------------ */

/**
 * Tutti i numeri (aliquote, soglie, contributi fissi, ecc.) devono
 * essere presi da:
 * - normativa corrente
 * - file Excel "CALCOLO_IMPOSTE_CORRETTO_AGGIORNATO_170725.xlsx"
 *
 * Qui sotto sono esempi e placeholder.
 */

export const TAX_CONFIG = {
  // Coefficienti di redditività
  coeffProfessionista: 0.78,
  coeffArtigiano: 0.86,
  coeffCommerciante: 0.4,

  // Contributi fissi annui artigiani/commercianti (placeholder)
  contributiFissiAnnuiArtigiani: 0, // es. ~4.200–4.500 da Excel/normativa
  contributiFissiAnnuiCommercianti: 0,

  // Soglia oltre la quale scatta la contribuzione percentuale
  sogliaContributiPercArtigiani: 0,      // da Excel
  sogliaContributiPercCommercianti: 0,   // da Excel

  // Aliquote percentuali (esempi; da riallineare con Excel)
  aliquotaPercArtigiani: 0,          // es. 24,48% o simile
  aliquotaPercCommercianti: 0,
  aliquotaPercGestioneSeparata: 0,   // es. 26,07% o simile

  // Percentuale standard acconti (tipicamente 50% + 50%)
  accontoPercentuale: 0.5,
};

/* ------------------------------------------------------------------ */
/*  FUNZIONI DI SUPPORTO                                              */
/* ------------------------------------------------------------------ */

/**
 * Determina il coefficiente di redditività in base alla categoria.
 */
export function getCoeffRedditivita(profile: UserTaxProfile): number {
  switch (profile.category) {
    case "PROFESSIONISTA":
      return TAX_CONFIG.coeffProfessionista;
    case "ARTIGIANO":
      return TAX_CONFIG.coeffArtigiano;
    case "COMMERCIANTE":
      return TAX_CONFIG.coeffCommerciante;
    default:
      // Fallback (non dovrebbe mai accadere)
      return TAX_CONFIG.coeffProfessionista;
  }
}

/**
 * Reddito imponibile lordo:
 *   reddito = fatturato * coeffRedditivita
 */
export function computeRedditoImponibileLordo(
  profile: UserTaxProfile,
  input: FiscalYearInput
): number {
  const coeff = getCoeffRedditivita(profile);
  return input.fatturato * coeff;
}

/**
 * Calcolo contributi INPS (fissi + percentuali) in base al tipo di
 * previdenza e al reddito lordo.
 *
 * IMPORTANTE:
 * - qui vanno replicate esattamente le formule dell'Excel
 *   (soglie, eccedenze, aliquote ecc.)
 * - questa funzione separa solo i casi principali.
 */
export function computeContributiInps(
  profile: UserTaxProfile,
  redditoLordo: number
): { fissi: number; percentuali: number } {
  switch (profile.previdenza) {
    case "ARTIGIANI_COMMERCIANTI": {
      // Artigiani / Commercianti con gestione INPS commercianti/artigiani
      // Formula tipica:
      // 1) contributi fissi (importo annuo fisso)
      // 2) contributi % sulla parte di reddito che supera una soglia

      const isArtigiano = profile.category === "ARTIGIANO";
      const contributiFissi = isArtigiano
        ? TAX_CONFIG.contributiFissiAnnuiArtigiani
        : TAX_CONFIG.contributiFissiAnnuiCommercianti;

      const soglia = isArtigiano
        ? TAX_CONFIG.sogliaContributiPercArtigiani
        : TAX_CONFIG.sogliaContributiPercCommercianti;

      const aliquota = isArtigiano
        ? TAX_CONFIG.aliquotaPercArtigiani
        : TAX_CONFIG.aliquotaPercCommercianti;

      const eccedenza = Math.max(0, redditoLordo - soglia);
      const contributiPercentuali = eccedenza * aliquota;

      return {
        fissi: contributiFissi,
        percentuali: contributiPercentuali,
      };
    }

    case "GESTIONE_SEPARATA": {
      // Gestione separata: contributi % sul reddito imponibile lordo
      const contributiPercentuali =
        redditoLordo * TAX_CONFIG.aliquotaPercGestioneSeparata;
      return {
        fissi: 0,
        percentuali: contributiPercentuali,
      };
    }

    case "CASSA_PROFESSIONALE": {
      // Per le casse professionali, nel motore base possiamo:
      // - considerare i contributi come input esterno
      // - oppure usare una regola semplificata in attesa delle
      //   specifiche della singola cassa.
      //
      // In questa prima versione, assumiamo 0 e deleghiamo alla UI/backend
      // la gestione dei contributi di cassa reali.
      return {
        fissi: 0,
        percentuali: 0,
      };
    }

    default:
      return { fissi: 0, percentuali: 0 };
  }
}

/**
 * Reddito imponibile netto.
 *
 * ANNO 0:
 *   redditoNetto = redditoLordo - contributiInpsFissi - contributiInpsPercentuali
 *
 * ANNO 1+:
 *   redditoNetto = redditoLordo - contributiVersatiPrecedente
 */
export function computeRedditoImponibileNetto(
  input: FiscalYearInput,
  redditoLordo: number,
  contributiInpsFissi: number,
  contributiInpsPercentuali: number
): number {
  const isAnnoZero = input.contributiVersatiPrecedente <= 0;

  if (isAnnoZero) {
    return redditoLordo - contributiInpsFissi - contributiInpsPercentuali;
  }

  // ANNO 1+
  return redditoLordo - input.contributiVersatiPrecedente;
}

/**
 * Imposta sostitutiva lorda:
 *   impostaLorda = redditoNetto * aliquotaImposta
 */
export function computeImpostaSostitutivaLorda(
  profile: UserTaxProfile,
  redditoNetto: number
): number {
  return redditoNetto * profile.aliquotaImpostaSostitutiva;
}

/**
 * Saldo imposta sostitutiva:
 *
 * ANNO 0:
 *   imposteVersatePrecedente = 0
 *
 * ANNO 1+:
 *   saldo = impostaLorda - imposteVersatePrecedente
 *
 * Il saldo può essere:
 * - positivo  → debito
 * - negativo  → credito
 */
export function computeSaldoImpostaSostitutiva(
  impostaLorda: number,
  imposteVersatePrecedente: number
): number {
  return impostaLorda - imposteVersatePrecedente;
}

/**
 * Calcolo acconti imposta e contributi.
 *
 * Nella versione standard:
 *   primo = base * accontoPercentuale
 *   secondo = base * accontoPercentuale
 *
 * Se in Excel sono usate percentuali diverse, vanno aggiornate qui.
 */
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

  const primoImposta = baseImposta * p;
  const secondoImposta = baseImposta * p;

  const primoContrib = baseContributi * p;
  const secondoContrib = baseContributi * p;

  return {
    primoAccontoImposta: primoImposta,
    secondoAccontoImposta: secondoImposta,
    primoAccontoContributi: primoContrib,
    secondoAccontoContributi: secondoContrib,
  };
}

/**
 * Totali F24 per giugno e novembre.
 *
 * Schema concettuale:
 *
 *  F24 giugno   = saldoImposta + saldoContributiPercentuali
 *                 + primoAccontoImposta + primoAccontoContributi
 *                 + CCIAA
 *
 *  F24 novembre = secondoAccontoImposta + secondoAccontoContributi
 *
 * I numeri vanno allineati con il file Excel (ANNO 0 e ANNO 1).
 */
export function computeTotaliF24(
  ccIAA: number,
  saldoImposta: number,
  saldoContributiPercentuali: number,
  primoAccontoImposta: number,
  secondoAccontoImposta: number,
  primoAccontoContributi: number,
  secondoAccontoContributi: number
): { giugno: number; novembre: number } {
  const totaleGiugno =
    saldoImposta +
    saldoContributiPercentuali +
    primoAccontoImposta +
    primoAccontoContributi +
    ccIAA;

  const totaleNovembre =
    secondoAccontoImposta + secondoAccontoContributi;

  return {
    giugno: totaleGiugno,
    novembre: totaleNovembre,
  };
}

/* ------------------------------------------------------------------ */
/*  FUNZIONI PRINCIPALI                                               */
/* ------------------------------------------------------------------ */

/**
 * Calcolo di un singolo anno fiscale.
 *
 * Questa funzione è quella che deve replicare esattamente, caso per
 * caso, i risultati del file Excel (ANNO 0 e ANNO 1+).
 */
export function computeFiscalYear(
  profile: UserTaxProfile,
  input: FiscalYearInput
): FiscalYearResult {
  const warnings: string[] = [];
  const isAnnoZero = input.contributiVersatiPrecedente <= 0;

  // 1) Reddito imponibile lordo
  const redditoLordo = computeRedditoImponibileLordo(profile, input);

  // 2) Contributi INPS (fissi + percentuali)
  const {
    fissi: contributiInpsFissi,
    percentuali: contributiInpsPercentuali,
  } = computeContributiInps(profile, redditoLordo);

  // 3) Reddito imponibile netto
  const redditoNetto = computeRedditoImponibileNetto(
    input,
    redditoLordo,
    contributiInpsFissi,
    contributiInpsPercentuali
  );

  // 4) Imposta sostitutiva lorda
  const impostaLorda = computeImpostaSostitutivaLorda(
    profile,
    redditoNetto
  );

  // 5) Saldo imposta sostitutiva
  const saldoImposta = computeSaldoImpostaSostitutiva(
    impostaLorda,
    input.imposteVersatePrecedente
  );

  // 6) Base per acconti:
  //    in linea con Excel:
  //    - per imposta: tipicamente si usano i valori della nuova
  //      imposta lorda
  //    - per contributi: saldi contributivi dell'anno corrente
  const baseAccontiImposta = impostaLorda;
  const baseAccontiContributi = contributiInpsPercentuali;

  const acconti = computeAcconti(
    baseAccontiImposta,
    baseAccontiContributi
  );

  // 7) Totali F24
  const totaliF24 = computeTotaliF24(
    input.ccIAA,
    saldoImposta,
    contributiInpsPercentuali,
    acconti.primoAccontoImposta,
    acconti.secondoAccontoImposta,
    acconti.primoAccontoContributi,
    acconti.secondoAccontoContributi
  );

  // 8) Rivalsa di cassa (se presente)
  const importoRivalsaCassa =
    profile.hasCassaProfessionale &&
    profile.cassaAliquotaRivalsa &&
    profile.cassaAliquotaRivalsa > 0
      ? input.fatturato * profile.cassaAliquotaRivalsa
      : input.rivalsaCassaTotale;

  // 9) Credito da compensare (placeholder)
  //    In una versione più avanzata:
  //    - saldoImposta < 0  -> credito IRPEF/Imposta sostitutiva
  //    - contributi eccedenti -> credito previdenziale
  let creditoDaCompensare = 0;
  if (saldoImposta < 0) {
    creditoDaCompensare += Math.abs(saldoImposta);
  }

  // 10) Warning su soglie forfettario (esempio)
  const sogliaForfettario = 85000; // da normativa corrente
  if (input.fatturato > sogliaForfettario * 0.9) {
    warnings.push(
      "Fatturato vicino alla soglia massima per il regime forfettario."
    );
  }

  return {
    year: input.year,
    redditoImponibileLordo: redditoLordo,
    redditoImponibileNetto: redditoNetto,
    contributiInpsFissi,
    contributiInpsPercentuali,
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

/**
 * Calcolo multi-anno (anno 0, anno 1, anno 2, ...).
 *
 * - Il primo elemento dell’array `anni` è considerato ANNO 0.
 * - Per ogni anno successivo:
 *   - contributiVersatiPrecedente = contributi % + acconti anno-1
 *   - imposteVersatePrecedente    = imposta lorda + acconti anno-1
 *
 * I dettagli esatti vanno allineati con il file Excel.
 */
export function computeMultiYear(input: MultiYearInput): MultiYearResult {
  const results: FiscalYearResult[] = [];

  let contributiVersatiPrecedente = 0;
  let imposteVersatePrecedente = 0;

  for (const anno of input.anni) {
    const yearInput: FiscalYearInput = {
      year: anno.year,
      fatturato: anno.fatturato,
      contributiVersatiPrecedente,
      imposteVersatePrecedente,
      ccIAA: input.ccIAA,
    };

    const result = computeFiscalYear(input.profile, yearInput);
    results.push(result);

    // Propagazione verso l'anno successivo:
    // qui si devono replicare le somme presenti nel foglio Excel (saldi + acconti)
    contributiVersatiPrecedente =
      result.contributiInpsPercentuali +
      result.primoAccontoContributi +
      result.secondoAccontoContributi;

    imposteVersatePrecedente =
      result.impostaSostitutivaLorda +
      result.primoAccontoImposta +
      result.secondoAccontoImposta;
  }

  return { anni: results };
}
