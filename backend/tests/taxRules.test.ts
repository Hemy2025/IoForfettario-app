// backend/tests/taxRules.test.ts
// Test del motore a regole per il regime forfettario – IoForfettario

import {
  computeFiscalYear,
  computeMultiYear,
  TAX_CONFIG,
  type UserTaxProfile,
  type FiscalYearInput,
  type MultiYearInput,
} from "../src/rules/taxRules";

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * PROFESSIONISTA – GESTIONE SEPARATA
 * Anno 0: imposta calcolata sul reddito LORDO (contributi non dedotti)
 * Anno 1+: imposta calcolata sul reddito lordo – contributi versati anno precedente
 */
describe("Professionista – Gestione separata", () => {
  const profile: UserTaxProfile = {
    category: "PROFESSIONISTA",
    previdenza: "GESTIONE_SEPARATA",
    hasCassaProfessionale: false,
    aliquotaImpostaSostitutiva: 0.05,
  };

  it("Anno 0 – calcolo allineato all'Excel (fatturato 60.000€)", () => {
    const input: FiscalYearInput = {
      year: 2025,
      fatturato: 60000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, input);

    const coeff = TAX_CONFIG.coeffProfessionista;
    const redditoLordoExp = input.fatturato * coeff;

    const contributiPercExp =
      redditoLordoExp * TAX_CONFIG.aliquotaPercGestioneSeparata;

    // ANNO 0: non deduco i contributi → reddito netto = reddito lordo
    const redditoNettoExp = redditoLordoExp;

    const impostaLordaExp =
      redditoNettoExp * profile.aliquotaImpostaSostitutiva;

    const saldoImpostaExp = impostaLordaExp - 0;

    const primoAccImpostaExp = saldoImpostaExp * TAX_CONFIG.accontoPercentuale;
    const secondoAccImpostaExp = primoAccImpostaExp;

    const primoAccContrExp =
      contributiPercExp * TAX_CONFIG.accontoPercentuale;
    const secondoAccContrExp = primoAccContrExp;

    const f24GiugnoExp =
      saldoImpostaExp +
      contributiPercExp +
      primoAccImpostaExp +
      primoAccContrExp +
      input.ccIAA;

    const f24NovembreExp = secondoAccImpostaExp + secondoAccContrExp;

    expect(round2(result.redditoImponibileLordo)).toBeCloseTo(
      round2(redditoLordoExp),
      2
    );
    expect(round2(result.redditoImponibileNetto)).toBeCloseTo(
      round2(redditoNettoExp),
      2
    );

    expect(round2(result.contributiInpsFissi)).toBeCloseTo(0, 2);
    expect(round2(result.contributiInpsPercentuali)).toBeCloseTo(
      round2(contributiPercExp),
      2
    );

    expect(round2(result.impostaSostitutivaLorda)).toBeCloseTo(
      round2(impostaLordaExp),
      2
    );
    expect(round2(result.saldoImpostaSostitutiva)).toBeCloseTo(
      round2(saldoImpostaExp),
      2
    );

    expect(round2(result.primoAccontoImposta)).toBeCloseTo(
      round2(primoAccImpostaExp),
      2
    );
    expect(round2(result.secondoAccontoImposta)).toBeCloseTo(
      round2(secondoAccImpostaExp),
      2
    );

    expect(round2(result.primoAccontoContributi)).toBeCloseTo(
      round2(primoAccContrExp),
      2
    );
    expect(round2(result.secondoAccontoContributi)).toBeCloseTo(
      round2(secondoAccContrExp),
      2
    );

    expect(round2(result.totaleF24Giugno)).toBeCloseTo(
      round2(f24GiugnoExp),
      2
    );
    expect(round2(result.totaleF24Novembre)).toBeCloseTo(
      round2(f24NovembreExp),
      2
    );
  });

  it("Anno 1 – usa correttamente contributi/imposte dell'anno precedente", () => {
    const year0: FiscalYearInput = {
      year: 2025,
      fatturato: 60000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };
    const res0 = computeFiscalYear(profile, year0);

    const contributiPrev =
      res0.contributiInpsPercentuali +
      res0.primoAccontoContributi +
      res0.secondoAccontoContributi;

    const impostePrev =
      res0.impostaSostitutivaLorda +
      res0.primoAccontoImposta +
      res0.secondoAccontoImposta;

    const year1: FiscalYearInput = {
      year: 2026,
      fatturato: 65000,
      contributiVersatiPrecedente: contributiPrev,
      imposteVersatePrecedente: impostePrev,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, year1);

    const redditoLordo1 = year1.fatturato * TAX_CONFIG.coeffProfessionista;
    const redditoNetto1 = redditoLordo1 - contributiPrev;
    const impostaLorda1 = redditoNetto1 * profile.aliquotaImpostaSostitutiva;
    const saldoImposta1 = impostaLorda1 - impostePrev;

    expect(round2(result.redditoImponibileLordo)).toBeCloseTo(
      round2(redditoLordo1),
      2
    );
    expect(round2(result.redditoImponibileNetto)).toBeCloseTo(
      round2(redditoNetto1),
      2
    );
    expect(round2(result.saldoImpostaSostitutiva)).toBeCloseTo(
      round2(saldoImposta1),
      2
    );
    expect(round2(result.creditoDaCompensare ?? 0)).toBeCloseTo(
      round2(Math.max(0, -saldoImposta1)),
      2
    );
  });
});

/**
 * ARTIGIANO – Gestione Artigiani/Commercianti
 * Anno 0: reddito netto = lordo - contributi fissi - contributi %
 * Anno 1+: reddito netto = lordo - contributiVersatiPrecedente
 */
describe("Artigiano – Gestione Artigiani/Commercianti", () => {
  const profile: UserTaxProfile = {
    category: "ARTIGIANO",
    previdenza: "ARTIGIANI_COMMERCIANTI",
    hasCassaProfessionale: false,
    aliquotaImpostaSostitutiva: 0.05,
  };

  it("Anno 0 – allineato all'esempio Excel (40.000€)", () => {
    const input: FiscalYearInput = {
      year: 2025,
      fatturato: 40000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, input);

    const coeff = TAX_CONFIG.coeffArtigiano;
    const redditoLordoExp = input.fatturato * coeff;

    const fissi = TAX_CONFIG.contributiFissiAnnuiArtigiani;
    const eccedenza = Math.max(
      0,
      redditoLordoExp - TAX_CONFIG.sogliaContributiPercArtigiani
    );
    const perc = eccedenza * TAX_CONFIG.aliquotaPercArtigiani;

    const redditoNettoExp = redditoLordoExp - fissi - perc;
    const impostaLordaExp =
      redditoNettoExp * profile.aliquotaImpostaSostitutiva;

    expect(round2(result.redditoImponibileLordo)).toBeCloseTo(
      round2(redditoLordoExp),
      2
    );
    expect(round2(result.contributiInpsFissi)).toBeCloseTo(round2(fissi), 2);
    expect(round2(result.contributiInpsPercentuali)).toBeCloseTo(
      round2(perc),
      2
    );
    expect(round2(result.redditoImponibileNetto)).toBeCloseTo(
      round2(redditoNettoExp),
      2
    );
    expect(round2(result.impostaSostitutivaLorda)).toBeCloseTo(
      round2(impostaLordaExp),
      2
    );
  });

  it("Anno 1 – usa i contributi e le imposte dell'anno precedente", () => {
    const year0: FiscalYearInput = {
      year: 2025,
      fatturato: 40000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };
    const res0 = computeFiscalYear(profile, year0);

    const contributiPrev =
      res0.contributiInpsPercentuali +
      res0.primoAccontoContributi +
      res0.secondoAccontoContributi;

    const impostePrev =
      res0.impostaSostitutivaLorda +
      res0.primoAccontoImposta +
      res0.secondoAccontoImposta;

    const year1: FiscalYearInput = {
      year: 2026,
      fatturato: 45000,
      contributiVersatiPrecedente: contributiPrev,
      imposteVersatePrecedente: impostePrev,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, year1);

    const redditoLordo1 = year1.fatturato * TAX_CONFIG.coeffArtigiano;
    const redditoNetto1 = redditoLordo1 - contributiPrev;
    const impostaLorda1 = redditoNetto1 * profile.aliquotaImpostaSostitutiva;
    const saldoImposta1 = impostaLorda1 - impostePrev;

    expect(round2(result.redditoImponibileLordo)).toBeCloseTo(
      round2(redditoLordo1),
      2
    );
    expect(round2(result.redditoImponibileNetto)).toBeCloseTo(
      round2(redditoNetto1),
      2
    );
    expect(round2(result.saldoImpostaSostitutiva)).toBeCloseTo(
      round2(saldoImposta1),
      2
    );
  });
});

/**
 * COMMERCIANTE – Gestione Artigiani/Commercianti
 */
describe("Commerciante – Gestione Artigiani/Commercianti", () => {
  const profile: UserTaxProfile = {
    category: "COMMERCIANTE",
    previdenza: "ARTIGIANI_COMMERCIANTI",
    hasCassaProfessionale: false,
    aliquotaImpostaSostitutiva: 0.15,
  };

  it("Anno 0 – contributi fissi + percentuali (50.000€)", () => {
    const input: FiscalYearInput = {
      year: 2025,
      fatturato: 50000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, input);

    const coeff = TAX_CONFIG.coeffCommerciante;
    const redditoLordoExp = input.fatturato * coeff;

    const fissi = TAX_CONFIG.contributiFissiAnnuiCommercianti;
    const eccedenza = Math.max(
      0,
      redditoLordoExp - TAX_CONFIG.sogliaContributiPercCommercianti
    );
    const perc = eccedenza * TAX_CONFIG.aliquotaPercCommercianti;

    const redditoNettoExp = redditoLordoExp - fissi - perc;
    const impostaLordaExp =
      redditoNettoExp * profile.aliquotaImpostaSostitutiva;

    expect(round2(result.redditoImponibileLordo)).toBeCloseTo(
      round2(redditoLordoExp),
      2
    );
    expect(round2(result.contributiInpsFissi)).toBeCloseTo(round2(fissi), 2);
    expect(round2(result.contributiInpsPercentuali)).toBeCloseTo(
      round2(perc),
      2
    );
    expect(round2(result.redditoImponibileNetto)).toBeCloseTo(
      round2(redditoNettoExp),
      2
    );
    expect(round2(result.impostaSostitutivaLorda)).toBeCloseTo(
      round2(impostaLordaExp),
      2
    );
  });

  it("Anno 1 – utilizza i dati dell'anno precedente", () => {
    const year0: FiscalYearInput = {
      year: 2025,
      fatturato: 50000,
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };
    const res0 = computeFiscalYear(profile, year0);

    const contributiPrev =
      res0.contributiInpsPercentuali +
      res0.primoAccontoContributi +
      res0.secondoAccontoContributi;

    const impostePrev =
      res0.impostaSostitutivaLorda +
      res0.primoAccontoImposta +
      res0.secondoAccontoImposta;

    const year1: FiscalYearInput = {
      year: 2026,
      fatturato: 52000,
      contributiVersatiPrecedente: contributiPrev,
      imposteVersatePrecedente: impostePrev,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const result = computeFiscalYear(profile, year1);

    const redditoLordo1 = year1.fatturato * TAX_CONFIG.coeffCommerciante;
    const redditoNetto1 = redditoLordo1 - contributiPrev;
    const impostaLorda1 = redditoNetto1 * profile.aliquotaImpostaSostitutiva;
    const saldoImposta1 = impostaLorda1 - impostePrev;

    expect(round2(result.redditoImponibileLordo)).toBeCloseTo(
      round2(redditoLordo1),
      2
    );
    expect(round2(result.redditoImponibileNetto)).toBeCloseTo(
      round2(redditoNetto1),
      2
    );
    expect(round2(result.saldoImpostaSostitutiva)).toBeCloseTo(
      round2(saldoImposta1),
      2
    );
  });
});

/**
 * Test multi-anno di integrazione
 */
describe("Multi-anno – integrazione complessiva", () => {
  it("computeMultiYear propaga correttamente contributi e imposte", () => {
    const profile: UserTaxProfile = {
      category: "PROFESSIONISTA",
      previdenza: "GESTIONE_SEPARATA",
      hasCassaProfessionale: false,
      aliquotaImpostaSostitutiva: 0.05,
    };

    const input: MultiYearInput = {
      profile,
      ccIAA: 60,
      anni: [
        { year: 2025, fatturato: 60000 },
        { year: 2026, fatturato: 65000 },
      ],
    };

    const res = computeMultiYear(input);

    expect(res.anni.length).toBe(2);

    const year0 = res.anni[0];
    const year1 = res.anni[1];

    expect(year0.year).toBe(2025);
    expect(year1.year).toBe(2026);

    // Il reddito netto anno 1 deve essere inferiore al reddito lordo
    // di almeno i contributi versati l'anno precedente (logica multi-anno)
    expect(year1.redditoImponibileNetto).toBeLessThan(
      year1.redditoImponibileLordo
    );
  });
});
