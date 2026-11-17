import type {
  CellKey,
  ConfusionMatrix,
  MetricKey,
  MetricResult,
  MatrixSummary,
  SyntheticRecord,
} from '../types/bankolab';
import { formatDecimal, formatInt, formatPercent, sanitizeNonNegativeInt } from './format';

export const DEFAULT_BALANCED_MATRIX: ConfusionMatrix = {
  tp: 80,
  tn: 850,
  fp: 50,
  fn: 20,
};

export const MATRIX_PRESETS: Record<
  'equilibrado' | 'conservador' | 'sin_alertas' | 'fraude',
  { id: string; label: string; description: string; matrix: ConfusionMatrix }
> = {
  equilibrado: {
    id: 'equilibrado',
    label: 'Equilibrado',
    description: 'Cartera de 1.000 evaluaciones con 10 % de incumplimiento real y balance moderado de alertas.',
    matrix: { tp: 80, tn: 850, fp: 50, fn: 20 },
  },
  conservador: {
    id: 'conservador',
    label: 'Conservador',
    description: 'Umbral estricto que prioriza detectar incumplimientos (alto Recall) a costa de más falsas alarmas.',
    matrix: { tp: 95, tn: 760, fp: 140, fn: 5 },
  },
  sin_alertas: {
    id: 'sin_alertas',
    label: 'Sin alertas',
    description: 'Modelo trivial que predice todo negativo: alcanza 90 % de Accuracy pero detecta 0 incumplimientos.',
    matrix: { tp: 0, tn: 900, fp: 0, fn: 100 },
  },
  fraude: {
    id: 'fraude',
    label: 'Fraude (desbalanceado)',
    description: '10.000 transacciones con solo 0,10 % de fraude real (10 casos positivos y 9.990 legítimas).',
    matrix: { tp: 8, tn: 9890, fp: 100, fn: 2 },
  },
};

export function normalizeMatrix(input: ConfusionMatrix): ConfusionMatrix {
  return {
    tp: sanitizeNonNegativeInt(input.tp),
    tn: sanitizeNonNegativeInt(input.tn),
    fp: sanitizeNonNegativeInt(input.fp),
    fn: sanitizeNonNegativeInt(input.fn),
  };
}

export function classifyRecord(record: Pick<SyntheticRecord, 'actual' | 'predicted'>): CellKey {
  if (record.actual && record.predicted) return 'tp';
  if (record.actual && !record.predicted) return 'fn';
  if (!record.actual && record.predicted) return 'fp';
  return 'tn';
}

export function computeMatrixFromRecords(
  records: ReadonlyArray<Pick<SyntheticRecord, 'actual' | 'predicted'>>,
): ConfusionMatrix {
  return records.reduce<ConfusionMatrix>(
    (acc, rec) => {
      const cell = classifyRecord(rec);
      return { ...acc, [cell]: acc[cell] + 1 };
    },
    { tp: 0, tn: 0, fp: 0, fn: 0 },
  );
}

/**
 * Convención fija BancoLab:
 * Filas = REAL (Positivo arriba, Negativo abajo)
 * Columnas = PREDICHO (Positivo izquierda, Negativo derecha)
 * Estructura: [[TP, FN], [FP, TN]]
 */
export function toFixedMatrixGrid(matrix: ConfusionMatrix): [[number, number], [number, number]] {
  const m = normalizeMatrix(matrix);
  return [
    [m.tp, m.fn],
    [m.fp, m.tn],
  ];
}

function buildMetric(
  key: MetricKey,
  label: string,
  shortLabel: string,
  formula: string,
  numerator: number,
  denominator: number,
  reasonUndefined: string,
  substitutionExpr: string,
): MetricResult {
  if (denominator <= 0 || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return {
      key,
      label,
      shortLabel,
      formula,
      numerator,
      denominator,
      value: null,
      defined: false,
      reasonUndefined,
      formattedPercent: 'No definido',
      formattedDecimal: 'No definido',
      substitutionText: `${substitutionExpr} = ${formatInt(numerator)} / ${formatInt(denominator)} -> No definido (${reasonUndefined})`,
    };
  }

  const ratio = numerator / denominator;
  return {
    key,
    label,
    shortLabel,
    formula,
    numerator,
    denominator,
    value: ratio,
    defined: true,
    formattedPercent: formatPercent(ratio),
    formattedDecimal: formatDecimal(ratio),
    substitutionText: `${substitutionExpr} = ${formatInt(numerator)} / ${formatInt(denominator)} = ${formatPercent(ratio)}`,
  };
}

export function computeMatrixSummary(rawMatrix: ConfusionMatrix): MatrixSummary {
  const m = normalizeMatrix(rawMatrix);
  const total = m.tp + m.tn + m.fp + m.fn;
  const actualPositives = m.tp + m.fn;
  const actualNegatives = m.tn + m.fp;
  const predictedPositives = m.tp + m.fp;
  const predictedNegatives = m.tn + m.fn;
  const correct = m.tp + m.tn;
  const errors = m.fp + m.fn;

  const accuracy = buildMetric(
    'accuracy',
    'Exactitud (Accuracy)',
    'Accuracy',
    '(TP + TN) / N',
    correct,
    total,
    'No hay observaciones totales (N = 0).',
    `(${formatInt(m.tp)} + ${formatInt(m.tn)}) / ${formatInt(total)}`,
  );

  const precision = buildMetric(
    'precision',
    'Precisión (Precision)',
    'Precision',
    'TP / (TP + FP)',
    m.tp,
    predictedPositives,
    'El modelo no emitió alertas positivas (TP + FP = 0).',
    `${formatInt(m.tp)} / (${formatInt(m.tp)} + ${formatInt(m.fp)})`,
  );

  const recall = buildMetric(
    'recall',
    'Sensibilidad (Recall)',
    'Recall',
    'TP / (TP + FN)',
    m.tp,
    actualPositives,
    'No existen casos positivos reales en la muestra (TP + FN = 0).',
    `${formatInt(m.tp)} / (${formatInt(m.tp)} + ${formatInt(m.fn)})`,
  );

  const specificity = buildMetric(
    'specificity',
    'Especificidad (Specificity)',
    'Specificity',
    'TN / (TN + FP)',
    m.tn,
    actualNegatives,
    'No existen casos negativos reales en la muestra (TN + FP = 0).',
    `${formatInt(m.tn)} / (${formatInt(m.tn)} + ${formatInt(m.fp)})`,
  );

  const f1Denominator = 2 * m.tp + m.fp + m.fn;
  const f1 = buildMetric(
    'f1',
    'Puntaje F1 (F1-Score)',
    'F1',
    '2·TP / (2·TP + FP + FN)',
    2 * m.tp,
    f1Denominator,
    'TP, FP y FN son cero simultáneamente (2·TP + FP + FN = 0).',
    `(2 × ${formatInt(m.tp)}) / (2 × ${formatInt(m.tp)} + ${formatInt(m.fp)} + ${formatInt(m.fn)})`,
  );

  const fpr = buildMetric(
    'fpr',
    'Tasa de Falsos Positivos (FPR)',
    'FPR',
    'FP / (FP + TN)',
    m.fp,
    actualNegatives,
    'No existen casos negativos reales en la muestra (FP + TN = 0).',
    `${formatInt(m.fp)} / (${formatInt(m.fp)} + ${formatInt(m.tn)})`,
  );

  const fnr = buildMetric(
    'fnr',
    'Tasa de Falsos Negativos (FNR)',
    'FNR',
    'FN / (FN + TP)',
    m.fn,
    actualPositives,
    'No existen casos positivos reales en la muestra (FN + TP = 0).',
    `${formatInt(m.fn)} / (${formatInt(m.fn)} + ${formatInt(m.tp)})`,
  );

  const prevalence = buildMetric(
    'prevalence',
    'Prevalencia del evento',
    'Prevalencia',
    '(TP + FN) / N',
    actualPositives,
    total,
    'No hay observaciones totales (N = 0).',
    `(${formatInt(m.tp)} + ${formatInt(m.fn)}) / ${formatInt(total)}`,
  );

  return {
    total,
    actualPositives,
    actualNegatives,
    predictedPositives,
    predictedNegatives,
    correct,
    errors,
    metrics: {
      accuracy,
      precision,
      recall,
      specificity,
      f1,
      fpr,
      fnr,
      prevalence,
    },
  };
}

export function generateMatrixInterpretation(summary: MatrixSummary, matrix: ConfusionMatrix): string[] {
  const m = normalizeMatrix(matrix);
  if (summary.total === 0) {
    return [
      'No hay observaciones registradas (N = 0). Ingresa al menos un caso en TP, TN, FP o FN para calcular tasas e interpretar el desempeño.',
    ];
  }

  const notes: string[] = [];
  const prev = summary.metrics.prevalence;
  const acc = summary.metrics.accuracy;
  const rec = summary.metrics.recall;
  const prec = summary.metrics.precision;

  if (summary.predictedPositives === 0) {
    notes.push(
      `El modelo no genera ninguna alerta positiva (TP + FP = 0). Aunque su Accuracy es ${acc.formattedPercent}, omite el 100 % de los eventos positivos reales (${formatInt(m.fn)} casos en FN) y su Precisión queda como No definido.`,
    );
  }

  if (prev.defined && prev.value !== null && prev.value <= 0.05) {
    notes.push(
      `Existe desbalance severo de clases: la prevalencia del evento positivo es solo ${prev.formattedPercent}. En este régimen, una Accuracy alta (${acc.formattedPercent}) puede ocultar fallas graves en la detección del evento minoritario.`,
    );
  } else if (prev.defined && prev.value !== null && prev.value <= 0.15) {
    notes.push(
      `La clase positiva es minoritaria (${prev.formattedPercent} de prevalencia), situación habitual en riesgo de crédito o abandono. Conviene analizar Recall y Precisión junto con los costos de error antes de confiar en la Accuracy.`,
    );
  }

  if (rec.defined && rec.value !== null && prec.defined && prec.value !== null) {
    if (rec.value >= 0.85 && prec.value < 0.5) {
      notes.push(
        `Alta cobertura con baja pureza de alertas: el modelo captura ${rec.formattedPercent} de los eventos reales (Recall), pero solo ${prec.formattedPercent} de sus alertas son reales (Precisión), generando ${formatInt(m.fp)} falsas alarmas.`,
      );
    } else if (prec.value >= 0.75 && rec.value < 0.5) {
      notes.push(
        `Modelo selectivo: cuando alerta acierta con ${prec.formattedPercent} de Precisión, pero deja escapar ${formatInt(m.fn)} eventos positivos reales (Recall de ${rec.formattedPercent}).`,
      );
    } else if (rec.value >= 0.75 && prec.value >= 0.6) {
      notes.push(
        `Balance operativo sólido: captura ${rec.formattedPercent} de los eventos reales manteniendo ${prec.formattedPercent} de Precisión sobre las alertas generadas.`,
      );
    }
  }

  if (summary.actualPositives === 0) {
    notes.push(
      'No hay casos positivos reales en la muestra (TP + FN = 0); por ello Recall, FNR y la sensibilidad no están definidos.',
    );
  }

  if (summary.actualNegatives === 0) {
    notes.push(
      'No hay casos negativos reales en la muestra (TN + FP = 0); por ello Especificidad y FPR no están definidos.',
    );
  }

  if (notes.length === 0) {
    notes.push(
      `El clasificador acierta ${formatInt(summary.correct)} de ${formatInt(summary.total)} observaciones (${acc.formattedPercent}) y comete ${formatInt(summary.errors)} errores (${formatInt(m.fp)} FP y ${formatInt(m.fn)} FN).`,
    );
  }

  return notes;
}

/**
 * Colapsa una matriz multiclase 3x3 [[c00, c01, c02], ...] en una matriz binaria 2x2
 * bajo estrategia Uno contra Resto (One-vs-Rest) para el índice de clase seleccionado.
 * Filas = Real, Columnas = Predicho.
 */
export function oneVsRestFromMulticlass(
  grid: number[][],
  positiveClassIndex: number,
): ConfusionMatrix {
  let tp = 0;
  let fn = 0;
  let fp = 0;
  let tn = 0;

  for (let actualIdx = 0; actualIdx < grid.length; actualIdx += 1) {
    const row = grid[actualIdx] ?? [];
    for (let predIdx = 0; predIdx < row.length; predIdx += 1) {
      const count = sanitizeNonNegativeInt(row[predIdx] ?? 0);
      const isActualPos = actualIdx === positiveClassIndex;
      const isPredPos = predIdx === positiveClassIndex;
      if (isActualPos && isPredPos) tp += count;
      else if (isActualPos && !isPredPos) fn += count;
      else if (!isActualPos && isPredPos) fp += count;
      else tn += count;
    }
  }

  return { tp, fn, fp, tn };
}

export function buildMatrixCsv(
  matrix: ConfusionMatrix,
  summary: MatrixSummary,
  label: string,
): string {
  const m = normalizeMatrix(matrix);
  const rows: string[][] = [
    ['BancoLab - Exportación de Matriz de Confusión (Uso Educativo)', label],
    [],
    ['Matriz (Convención: Filas = REAL, Columnas = PREDICHO)', 'Predicho Positivo', 'Predicho Negativo', 'Total Real'],
    ['Real Positivo', String(m.tp), String(m.fn), String(summary.actualPositives)],
    ['Real Negativo', String(m.fp), String(m.tn), String(summary.actualNegatives)],
    ['Total Predicho', String(summary.predictedPositives), String(summary.predictedNegatives), String(summary.total)],
    [],
    ['Indicador', 'Fórmula', 'Numerador', 'Denominador', 'Valor (%)', 'Valor Decimal'],
    ...(['accuracy', 'precision', 'recall', 'specificity', 'f1', 'fpr', 'fnr', 'prevalence'] as MetricKey[]).map(
      (k) => {
        const met = summary.metrics[k];
        return [
          met.label,
          met.formula,
          String(met.numerator),
          String(met.denominator),
          met.formattedPercent,
          met.formattedDecimal,
        ];
      },
    ),
  ];

  const escapeCsv = (cell: string) => {
    if (/[",;\n]/.test(cell)) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  return '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
}
