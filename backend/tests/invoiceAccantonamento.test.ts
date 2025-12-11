// backend/tests/invoiceAccantonamento.test.ts
// Test sul calcolo di accantonamento per singola fattura + residuo verso il tetto 85.000€

import {
  computeAccantonamentoPerFattura,
  TAX_CONFIG,
  type UserTaxProfile,
  type YearTaxContext,
} from "../src/rules/taxRules";

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * Scenario:
 * - usiamo un PROFESSIONISTA in gestione separata
 * - simuliamo il fatturato cumulato prima della fattura
 * - controlliamo:
 *   - fatturato YTD prima e dopo
 *   - residuo rispetto al tetto 85.000€
 *   - che l'accantonamento sia ragionevole e non negativo
 */
describe("Accantonamento per fattura – logica di base", () => {
  const profile: UserTaxProfile = {
    category: "PROFESSIONISTA",
    previdenza: "GESTIONE_SEPARATA",
    hasCassaProfessionale: false,
    aliquotaImpostaSostitutiva: 0.05,
  };

  it("calcola un accantonamento coerente e residuo sul tetto 85.000€", () => {
    const baseYearInput = {
      year: 2025,
      fatturato: 60000, // fatturato YTD prima della fattura
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const ctx: YearTaxContext = {
      profile,
      yearInputBase: baseYearInput,
      fatturatoCumAnno: baseYearInput.fatturato,
    };

    const importoFattura = 1000;

    const result = computeAccantonamentoPerFattura(ctx, importoFattura);

    // Fatturato prima e dopo la fattura
    expect(result.fatturatoYtdPrima).toBe(60000);
    expect(result.fatturatoYtdDopo).toBe(61000);

    // Residuo verso il tetto (85000 - 61000 = 24000)
    const expectedResiduo =
      TAX_CONFIG.tettoForfettarioAnnuale - result.fatturatoYtdDopo;

    expect(round2(result.residuoFatturabile)).toBeCloseTo(
      round2(expectedResiduo),
      2
    );
    expect(result.residuoVersoTetto).toBeGreaterThanOrEqual(0);

    // Accantonamento non negativo
    expect(result.accantonamentoTotale).toBeGreaterThanOrEqual(0);

    // Percentuale di accantonamento sulla fattura compresa tra 0 e 1 (0–100%)
    expect(result.percentualeSuFattura).toBeGreaterThanOrEqual(0);
    expect(result.percentualeSuFattura).toBeLessThanOrEqual(1);

    // Non ha superato il tetto
    expect(result.haSuperatoSoglia).toBe(false);
    expect(result.superaTetto).toBe(false);
  });

  it("se il fatturato supera 85.000€, segnala superamento soglia", () => {
    const baseYearInput = {
      year: 2025,
      fatturato: 84000, // già vicino alla soglia
      contributiVersatiPrecedente: 0,
      imposteVersatePrecedente: 0,
      ccIAA: 60,
      rivalsaCassaTotale: undefined,
    };

    const ctx: YearTaxContext = {
      profile,
      yearInputBase: baseYearInput,
      fatturatoCumAnno: baseYearInput.fatturato,
    };

    const importoFattura = 1400; // 84.000 + 1.400 = 85.400 > 85.000

    const result = computeAccantonamentoPerFattura(ctx, importoFattura);

    // Fatturato prima e dopo
    expect(result.fatturatoYtdPrima).toBe(84000);
    expect(result.fatturatoYtdDopo).toBe(85400);

    // Ha superato la soglia
    expect(result.haSuperatoSoglia).toBe(true);
    expect(result.superaTetto).toBe(true);

    // Residuo fatturabile < 0
    expect(result.residuoFatturabile).toBeLessThan(0);

    // Accantonamento sempre non negativo
    expect(result.accantonamentoTotale).toBeGreaterThanOrEqual(0);
  });
});