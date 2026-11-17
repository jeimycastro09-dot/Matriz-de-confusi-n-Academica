import type {
  BreakEvenResult,
  ComparabilityResult,
  ConfusionMatrix,
  CostParameters,
  EconomicEvaluation,
  ModelRecommendation,
  OptimizationObjective,
} from '../types/bankolab';
import { formatCOP, formatInt, formatPercent } from './format';
import { computeMatrixSummary, normalizeMatrix } from './metrics';

export const DEFAULT_COSTS: CostParameters = {
  costFP: 300_000,
  costFN: 8_000_000,
};

export const DEFAULT_MODEL_A: ConfusionMatrix = {
  tp: 80,
  tn: 850,
  fp: 50,
  fn: 20,
};

export const DEFAULT_MODEL_B: ConfusionMatrix = {
  tp: 95,
  tn: 760,
  fp: 140,
  fn: 5,
};

export function evaluateEconomics(
  rawMatrix: ConfusionMatrix,
  rawCosts: CostParameters,
): EconomicEvaluation {
  const matrix = normalizeMatrix(rawMatrix);
  const summary = computeMatrixSummary(matrix);
  const costFP = Number.isFinite(rawCosts.costFP) && rawCosts.costFP >= 0 ? rawCosts.costFP : 0;
  const costFN = Number.isFinite(rawCosts.costFN) && rawCosts.costFN >= 0 ? rawCosts.costFN : 0;

  const totalCostFP = matrix.fp * costFP;
  const totalCostFN = matrix.fn * costFN;
  const totalCost = totalCostFP + totalCostFN;
  const costPerCase = summary.total > 0 ? totalCost / summary.total : null;

  return {
    matrix,
    summary,
    costFP,
    costFN,
    totalCostFP,
    totalCostFN,
    totalCost,
    costPerCase,
  };
}

export function checkComparability(
  evalA: EconomicEvaluation,
  evalB: EconomicEvaluation,
): ComparabilityResult {
  const reasons: string[] = [];

  if (evalA.summary.total === 0 || evalB.summary.total === 0) {
    reasons.push('Uno o ambos modelos tienen N = 0 observaciones.');
  }
  if (evalA.summary.total !== evalB.summary.total) {
    reasons.push(
      `Difieren en el total de casos evaluados (N_A = ${formatInt(evalA.summary.total)} vs. N_B = ${formatInt(evalB.summary.total)}).`,
    );
  }
  if (evalA.summary.actualPositives !== evalB.summary.actualPositives) {
    reasons.push(
      `Difieren en positivos reales (P_A = ${formatInt(evalA.summary.actualPositives)} vs. P_B = ${formatInt(evalB.summary.actualPositives)}).`,
    );
  }
  if (evalA.summary.actualNegatives !== evalB.summary.actualNegatives) {
    reasons.push(
      `Difieren en negativos reales (Neg_A = ${formatInt(evalA.summary.actualNegatives)} vs. Neg_B = ${formatInt(evalB.summary.actualNegatives)}).`,
    );
  }

  return {
    comparable: reasons.length === 0,
    reasons,
  };
}

export function isFeasibleByMaxFNR(
  evaluation: EconomicEvaluation,
  maxFnrPercent: number,
): boolean {
  const fnr = evaluation.summary.metrics.fnr;
  if (!fnr.defined || fnr.value === null) {
    return false;
  }
  const limitRatio = Math.max(0, Math.min(100, maxFnrPercent)) / 100;
  return fnr.value <= limitRatio + 1e-9;
}

export function recommendModel(
  evalA: EconomicEvaluation,
  evalB: EconomicEvaluation,
  objective: OptimizationObjective,
  maxFnrPercent: number,
): ModelRecommendation {
  const comp = checkComparability(evalA, evalB);
  const feasibleA = isFeasibleByMaxFNR(evalA, maxFnrPercent);
  const feasibleB = isFeasibleByMaxFNR(evalB, maxFnrPercent);

  if (!comp.comparable) {
    return {
      comparable: false,
      comparabilityReasons: comp.reasons,
      feasibleA,
      feasibleB,
      winner: 'not_comparable',
      headline: 'Muestras no comparables directamente por costo total',
      explanation:
        'Para comparar costos totales en COP de forma justa, ambos modelos deben evaluarse sobre exactamente el mismo volumen N y los mismos soportes reales de positivos y negativos. Ajusta las matrices para igualar N, P y Neg antes de emitir una recomendación por totales.',
    };
  }

  if (!feasibleA && !feasibleB) {
    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA: false,
      feasibleB: false,
      winner: 'none',
      headline: 'Ningún modelo cumple el apetito de riesgo (FNR máximo)',
      explanation: `Tanto el Modelo A (FNR: ${evalA.summary.metrics.fnr.formattedPercent}) como el Modelo B (FNR: ${evalB.summary.metrics.fnr.formattedPercent}) superan el límite máximo permitido de FNR (${formatPercent(maxFnrPercent / 100)}). Se requiere recalibrar el umbral de alerta o revisar el límite de apetito de riesgo.`,
    };
  }

  if (feasibleA && !feasibleB) {
    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA: true,
      feasibleB: false,
      winner: 'A',
      headline: 'Recomendado: Modelo A (único factible bajo restricción de riesgo)',
      explanation: `El Modelo A cumple el límite de FNR ≤ ${formatPercent(maxFnrPercent / 100)} (tiene ${evalA.summary.metrics.fnr.formattedPercent}), mientras que el Modelo B queda descartado por superar ese tope (${evalB.summary.metrics.fnr.formattedPercent}).`,
    };
  }

  if (!feasibleA && feasibleB) {
    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA: false,
      feasibleB: true,
      winner: 'B',
      headline: 'Recomendado: Modelo B (único factible bajo restricción de riesgo)',
      explanation: `El Modelo B cumple el límite de FNR ≤ ${formatPercent(maxFnrPercent / 100)} (tiene ${evalB.summary.metrics.fnr.formattedPercent}), mientras que el Modelo A queda descartado por superar ese tope (${evalA.summary.metrics.fnr.formattedPercent}).`,
    };
  }

  // Ambos factibles: evaluar objetivo
  if (objective === 'min_cost') {
    const diff = evalA.totalCost - evalB.totalCost;
    if (Math.abs(diff) < 1e-6) {
      return {
        comparable: true,
        comparabilityReasons: [],
        feasibleA,
        feasibleB,
        winner: 'tie',
        headline: 'Empate técnico en costo total',
        tieReason: `Ambos modelos generan exactamente ${formatCOP(evalA.totalCost)} bajo los costos configurados y cumplen FNR ≤ ${formatPercent(maxFnrPercent / 100)}.`,
        explanation:
          'Ante un empate exacto en costo total, conviene desempatar revisando la carga operativa de falsas alarmas (FP), el Recall o factores no cuantificados en el comité de riesgo.',
      };
    }

    const winner = diff > 0 ? 'B' : 'A';
    const savings = Math.abs(diff);
    const winnerEval = winner === 'A' ? evalA : evalB;
    const loserEval = winner === 'A' ? evalB : evalA;

    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA,
      feasibleB,
      winner,
      headline: `Recomendado: Modelo ${winner} (menor costo total)`,
      explanation: `El Modelo ${winner} genera un costo total de ${formatCOP(winnerEval.totalCost)} frente a ${formatCOP(loserEval.totalCost)} del otro modelo, logrando un ahorro neto de ${formatCOP(savings)} y cumpliendo el límite de FNR.`,
    };
  }

  if (objective === 'max_recall') {
    const recA = evalA.summary.metrics.recall;
    const recB = evalB.summary.metrics.recall;
    if (!recA.defined || recA.value === null || !recB.defined || recB.value === null) {
      return {
        comparable: true,
        comparabilityReasons: [],
        feasibleA,
        feasibleB,
        winner: 'none',
        headline: 'Recall no definido en la muestra',
        explanation: 'No es posible comparar por Recall cuando el denominador de positivos reales es cero.',
      };
    }
    const diff = recA.value - recB.value;
    if (Math.abs(diff) < 1e-9) {
      return {
        comparable: true,
        comparabilityReasons: [],
        feasibleA,
        feasibleB,
        winner: 'tie',
        headline: 'Empate en Recall (Sensibilidad)',
        tieReason: `Ambos modelos alcanzan un Recall de ${recA.formattedPercent}.`,
        explanation: 'Al empatar en detección de positivos reales, revisa el costo total en COP o la carga de falsas alarmas (FP) para desempatar.',
      };
    }
    const winner = diff > 0 ? 'A' : 'B';
    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA,
      feasibleB,
      winner,
      headline: `Recomendado: Modelo ${winner} (mayor Recall)`,
      explanation: `El Modelo ${winner} detecta ${winner === 'A' ? recA.formattedPercent : recB.formattedPercent} de los eventos positivos reales frente a ${winner === 'A' ? recB.formattedPercent : recA.formattedPercent} de su alternativa, cumpliendo el límite de FNR.`,
    };
  }

  // max_precision
  const precA = evalA.summary.metrics.precision;
  const precB = evalB.summary.metrics.precision;
  if ((!precA.defined || precA.value === null) && (!precB.defined || precB.value === null)) {
    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA,
      feasibleB,
      winner: 'none',
      headline: 'Precisión no definida en ambos modelos',
      explanation: 'Ninguno de los modelos emitió alertas positivas (TP + FP = 0).',
    };
  }
  if (!precA.defined || precA.value === null) {
    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA,
      feasibleB,
      winner: 'B',
      headline: 'Recomendado: Modelo B (único con Precisión definida)',
      explanation: `El Modelo B tiene Precisión de ${precB.formattedPercent}; el Modelo A no emitió alertas positivas.`,
    };
  }
  if (!precB.defined || precB.value === null) {
    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA,
      feasibleB,
      winner: 'A',
      headline: 'Recomendado: Modelo A (único con Precisión definida)',
      explanation: `El Modelo A tiene Precisión de ${precA.formattedPercent}; el Modelo B no emitió alertas positivas.`,
    };
  }

  const diff = precA.value - precB.value;
  if (Math.abs(diff) < 1e-9) {
    return {
      comparable: true,
      comparabilityReasons: [],
      feasibleA,
      feasibleB,
      winner: 'tie',
      headline: 'Empate en Precisión',
      tieReason: `Ambos modelos alcanzan una Precisión de ${precA.formattedPercent}.`,
      explanation: 'Con igual pureza en las alertas, conviene comparar el costo total en COP y la cobertura de positivos (Recall).',
    };
  }

  const winner = diff > 0 ? 'A' : 'B';
  return {
    comparable: true,
    comparabilityReasons: [],
    feasibleA,
    feasibleB,
    winner,
    headline: `Recomendado: Modelo ${winner} (mayor Precisión)`,
    explanation: `El Modelo ${winner} logra una Precisión de ${winner === 'A' ? precA.formattedPercent : precB.formattedPercent} sobre sus alertas positivas frente a ${winner === 'A' ? precB.formattedPercent : precA.formattedPercent} del otro modelo, dentro del límite de FNR.`,
  };
}

/**
 * Calcula el umbral de equilibrio de costo FN (cFN*) donde Costo_A(cFN*) = Costo_B(cFN*),
 * manteniendo fijo cFP.
 * FP_A * cFP + FN_A * cFN* = FP_B * cFP + FN_B * cFN*
 * => cFN* = ((FP_B - FP_A) * cFP) / (FN_A - FN_B)
 */
export function computeBreakEvenCostFN(
  rawA: ConfusionMatrix,
  rawB: ConfusionMatrix,
  costFP: number,
): BreakEvenResult {
  const a = normalizeMatrix(rawA);
  const b = normalizeMatrix(rawB);
  const safeCostFP = Number.isFinite(costFP) && costFP >= 0 ? costFP : 0;

  const deltaFN = a.fn - b.fn;
  const deltaFP = b.fp - a.fp;

  if (deltaFN === 0) {
    if (deltaFP === 0 || safeCostFP === 0) {
      return {
        exists: false,
        breakEvenCostFN: null,
        breakEvenTotalCost: null,
        reason: 'Ambos modelos tienen exactamente el mismo costo en todo el rango de cFN (rectas superpuestas).',
      };
    }
    const cheaper = a.fp < b.fp ? 'A' : 'B';
    return {
      exists: false,
      breakEvenCostFN: null,
      breakEvenTotalCost: null,
      reason: `Ambos modelos tienen la misma cantidad de FN (${formatInt(a.fn)}); sus curvas son paralelas y el Modelo ${cheaper} siempre tiene menor costo por tener menos FP.`,
    };
  }

  const cFnStar = (deltaFP * safeCostFP) / deltaFN;
  if (!Number.isFinite(cFnStar) || cFnStar < 0) {
    const dominant =
      a.fp * safeCostFP + a.fn * 1_000_000 < b.fp * safeCostFP + b.fn * 1_000_000 ? 'A' : 'B';
    return {
      exists: false,
      breakEvenCostFN: null,
      breakEvenTotalCost: null,
      reason: `No existe punto de cruce con cFN ≥ 0 (el cruce matemático ocurre en ${formatCOP(cFnStar)}). El Modelo ${dominant} domina en todo el rango no negativo porque tiene menor o igual error en ambos frentes.`,
    };
  }

  const totalAtStar = a.fp * safeCostFP + a.fn * cFnStar;
  return {
    exists: true,
    breakEvenCostFN: cFnStar,
    breakEvenTotalCost: totalAtStar,
    reason: `Si el costo unitario de un FN supera ${formatCOP(cFnStar)}, conviene el modelo con menos FN.`,
  };
}

export function buildFNSensitivitySeries(
  rawA: ConfusionMatrix,
  rawB: ConfusionMatrix,
  costFP: number,
  currentCostFN: number,
  breakEven: BreakEvenResult,
): { xValues: number[]; costA: number[]; costB: number[] } {
  const a = normalizeMatrix(rawA);
  const b = normalizeMatrix(rawB);
  const safeCostFP = Number.isFinite(costFP) && costFP >= 0 ? costFP : 0;
  const maxRef = Math.max(
    currentCostFN * 1.6,
    breakEven.exists && breakEven.breakEvenCostFN !== null ? breakEven.breakEvenCostFN * 1.8 : 0,
    12_000_000,
  );
  const steps = 24;
  const xValues: number[] = [];
  const costA: number[] = [];
  const costB: number[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const cFn = Math.round((maxRef * i) / steps);
    xValues.push(cFn);
    costA.push(a.fp * safeCostFP + a.fn * cFn);
    costB.push(b.fp * safeCostFP + b.fn * cFn);
  }

  return { xValues, costA, costB };
}
