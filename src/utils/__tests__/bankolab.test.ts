import { describe, expect, it } from 'vitest';
import {
  buildFNSensitivitySeries,
  checkComparability,
  computeBreakEvenCostFN,
  DEFAULT_COSTS,
  DEFAULT_MODEL_A,
  DEFAULT_MODEL_B,
  evaluateEconomics,
  recommendModel,
} from '../economics';
import {
  computeMatrixFromRecords,
  computeMatrixSummary,
  oneVsRestFromMulticlass,
  toFixedMatrixGrid,
} from '../metrics';

describe('Matriz de confusión e indicadores', () => {
  it('calcula correctamente la convención fija [[TP, FN], [FP, TN]] y métricas estándar', () => {
    const grid = toFixedMatrixGrid(DEFAULT_MODEL_A);
    expect(grid).toEqual([
      [80, 20],
      [50, 850],
    ]);

    const summary = computeMatrixSummary(DEFAULT_MODEL_A);
    expect(summary.total).toBe(1000);
    expect(summary.actualPositives).toBe(100);
    expect(summary.actualNegatives).toBe(900);
    expect(summary.metrics.accuracy.value).toBeCloseTo(0.93, 6);
    expect(summary.metrics.precision.value).toBeCloseTo(80 / 130, 6);
    expect(summary.metrics.recall.value).toBeCloseTo(0.8, 6);
    expect(summary.metrics.specificity.value).toBeCloseTo(850 / 900, 6);
    expect(summary.metrics.f1.value).toBeCloseTo(160 / 230, 6);
    expect(summary.metrics.fpr.value).toBeCloseTo(50 / 900, 6);
    expect(summary.metrics.fnr.value).toBeCloseTo(0.2, 6);
  });

  it('maneja N = 0 sin NaN ni Infinity devolviendo No definido', () => {
    const summary = computeMatrixSummary({ tp: 0, tn: 0, fp: 0, fn: 0 });
    expect(summary.total).toBe(0);
    for (const metric of Object.values(summary.metrics)) {
      expect(metric.defined).toBe(false);
      expect(metric.value).toBeNull();
      expect(metric.formattedPercent).toBe('No definido');
      expect(metric.reasonUndefined).toBeTruthy();
    }
  });

  it('maneja denominadores individuales en cero (sin alertas: TP=0, FP=0)', () => {
    const summary = computeMatrixSummary({ tp: 0, tn: 900, fp: 0, fn: 100 });
    expect(summary.metrics.accuracy.defined).toBe(true);
    expect(summary.metrics.accuracy.value).toBeCloseTo(0.9, 6);
    expect(summary.metrics.recall.defined).toBe(true);
    expect(summary.metrics.recall.value).toBe(0);
    expect(summary.metrics.precision.defined).toBe(false);
    expect(summary.metrics.precision.formattedPercent).toBe('No definido');
    expect(summary.metrics.f1.defined).toBe(true);
    expect(summary.metrics.f1.value).toBe(0);
  });

  it('agrega registros sintéticos y reduce matriz multiclase 3x3 con Uno contra Resto', () => {
    const matrix = computeMatrixFromRecords([
      { actual: true, predicted: true },
      { actual: true, predicted: false },
      { actual: false, predicted: true },
      { actual: false, predicted: false },
    ]);
    expect(matrix).toEqual({ tp: 1, fn: 1, fp: 1, tn: 1 });

    const multi = [
      [10, 2, 1],
      [3, 20, 4],
      [0, 5, 15],
    ];
    const ovrAlto = oneVsRestFromMulticlass(multi, 2);
    expect(ovrAlto).toEqual({ tp: 15, fn: 5, fp: 5, tn: 35 });
  });
});

describe('Impacto económico, comparabilidad, empates y restricciones', () => {
  it('calcula los valores iniciales exactos A = 175.000.000 COP y B = 82.000.000 COP', () => {
    const evalA = evaluateEconomics(DEFAULT_MODEL_A, DEFAULT_COSTS);
    const evalB = evaluateEconomics(DEFAULT_MODEL_B, DEFAULT_COSTS);

    expect(evalA.totalCostFP).toBe(15_000_000);
    expect(evalA.totalCostFN).toBe(160_000_000);
    expect(evalA.totalCost).toBe(175_000_000);
    expect(evalA.costPerCase).toBe(175_000);

    expect(evalB.totalCostFP).toBe(42_000_000);
    expect(evalB.totalCostFN).toBe(40_000_000);
    expect(evalB.totalCost).toBe(82_000_000);
    expect(evalB.costPerCase).toBe(82_000);

    // B tiene menor Accuracy (85.5% < 93.0%) pero menor costo total
    expect(evalB.summary.metrics.accuracy.value!).toBeLessThan(evalA.summary.metrics.accuracy.value!);
    expect(evalB.totalCost).toBeLessThan(evalA.totalCost);
  });

  it('detecta falta de comparabilidad cuando difieren N o soportes positivos/negativos', () => {
    const evalA = evaluateEconomics(DEFAULT_MODEL_A, DEFAULT_COSTS);
    const evalOther = evaluateEconomics({ tp: 95, tn: 760, fp: 140, fn: 15 }, DEFAULT_COSTS);

    const comp = checkComparability(evalA, evalOther);
    expect(comp.comparable).toBe(false);
    expect(comp.reasons.length).toBeGreaterThan(0);

    const rec = recommendModel(evalA, evalOther, 'min_cost', 100);
    expect(rec.winner).toBe('not_comparable');
  });

  it('detecta cuando ningún modelo cumple la restricción de FNR máximo', () => {
    const evalA = evaluateEconomics(DEFAULT_MODEL_A, DEFAULT_COSTS); // FNR = 20%
    const evalB = evaluateEconomics(DEFAULT_MODEL_B, DEFAULT_COSTS); // FNR = 5%

    const rec = recommendModel(evalA, evalB, 'min_cost', 2); // maxFNR = 2%
    expect(rec.feasibleA).toBe(false);
    expect(rec.feasibleB).toBe(false);
    expect(rec.winner).toBe('none');
  });

  it('filtra por factibilidad FNR aunque el otro modelo tenga mejor objetivo', () => {
    const evalA = evaluateEconomics(DEFAULT_MODEL_A, DEFAULT_COSTS); // FNR = 20%, Precision = 61.5%
    const evalB = evaluateEconomics(DEFAULT_MODEL_B, DEFAULT_COSTS); // FNR = 5%, Precision = 40.4%

    const rec = recommendModel(evalA, evalB, 'max_precision', 10); // maxFNR = 10%
    expect(rec.feasibleA).toBe(false);
    expect(rec.feasibleB).toBe(true);
    expect(rec.winner).toBe('B');
  });

  it('reporta empate explícito cuando ambos modelos tienen igual costo total, Recall o Precisión', () => {
    const m1 = { tp: 80, tn: 850, fp: 50, fn: 20 };
    const m2 = { tp: 80, tn: 850, fp: 50, fn: 20 };
    const eval1 = evaluateEconomics(m1, DEFAULT_COSTS);
    const eval2 = evaluateEconomics(m2, DEFAULT_COSTS);

    const recCost = recommendModel(eval1, eval2, 'min_cost', 50);
    expect(recCost.winner).toBe('tie');

    const recRecall = recommendModel(eval1, eval2, 'max_recall', 50);
    expect(recRecall.winner).toBe('tie');

    const recPrec = recommendModel(eval1, eval2, 'max_precision', 50);
    expect(recPrec.winner).toBe('tie');
  });

  it('calcula correctamente el umbral de equilibrio cFN* y detecta rectas paralelas', () => {
    // A: FP=50, FN=20; B: FP=140, FN=5; cFP=300.000
    // cFN* = ((140 - 50) * 300.000) / (20 - 5) = 27.000.000 / 15 = 1.800.000 COP
    const be = computeBreakEvenCostFN(DEFAULT_MODEL_A, DEFAULT_MODEL_B, 300_000);
    expect(be.exists).toBe(true);
    expect(be.breakEvenCostFN).toBe(1_800_000);
    expect(be.breakEvenTotalCost).toBe(51_000_000);

    const series = buildFNSensitivitySeries(DEFAULT_MODEL_A, DEFAULT_MODEL_B, 300_000, 8_000_000, be);
    expect(series.xValues.length).toBeGreaterThan(5);

    const parallel = computeBreakEvenCostFN(
      { tp: 80, tn: 850, fp: 50, fn: 20 },
      { tp: 80, tn: 820, fp: 80, fn: 20 },
      300_000,
    );
    expect(parallel.exists).toBe(false);
    expect(parallel.breakEvenCostFN).toBeNull();
  });
});
