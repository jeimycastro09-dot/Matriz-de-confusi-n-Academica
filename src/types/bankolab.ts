export type ModuleId =
  | 'introduccion'
  | 'escenarios'
  | 'componentes'
  | 'simulador'
  | 'indicadores'
  | 'impacto'
  | 'evaluacion';

export type CellKey = 'tp' | 'fn' | 'fp' | 'tn';

export interface ConfusionMatrix {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
}

export interface MetricResult {
  key: MetricKey;
  label: string;
  shortLabel: string;
  formula: string;
  numerator: number;
  denominator: number;
  value: number | null;
  defined: boolean;
  reasonUndefined?: string;
  formattedPercent: string;
  formattedDecimal: string;
  substitutionText: string;
}

export type MetricKey =
  | 'accuracy'
  | 'precision'
  | 'recall'
  | 'specificity'
  | 'f1'
  | 'fpr'
  | 'fnr'
  | 'prevalence';

export interface MatrixSummary {
  total: number;
  actualPositives: number;
  actualNegatives: number;
  predictedPositives: number;
  predictedNegatives: number;
  correct: number;
  errors: number;
  metrics: Record<MetricKey, MetricResult>;
}

export interface SyntheticRecord {
  id: string;
  label: string;
  detail: string;
  score: number;
  actual: boolean;
  predicted: boolean;
}

export type ScenarioId = 'credito' | 'fraude' | 'liquidez' | 'retencion';

export interface ScenarioDefinition {
  id: ScenarioId;
  title: string;
  subtitle: string;
  problem: string;
  objective: string;
  unit: string;
  horizon: string;
  positiveLabel: string;
  negativeLabel: string;
  positiveMeaning: string;
  negativeMeaning: string;
  financialReading: string;
  records: SyntheticRecord[];
}

export interface CostParameters {
  costFP: number;
  costFN: number;
}

export type OptimizationObjective = 'min_cost' | 'max_recall' | 'max_precision';

export interface EconomicEvaluation {
  matrix: ConfusionMatrix;
  summary: MatrixSummary;
  costFP: number;
  costFN: number;
  totalCostFP: number;
  totalCostFN: number;
  totalCost: number;
  costPerCase: number | null;
}

export interface ComparabilityResult {
  comparable: boolean;
  reasons: string[];
}

export interface ModelRecommendation {
  comparable: boolean;
  comparabilityReasons: string[];
  feasibleA: boolean;
  feasibleB: boolean;
  winner: 'A' | 'B' | 'tie' | 'none' | 'not_comparable';
  headline: string;
  explanation: string;
  tieReason?: string;
}

export interface BreakEvenResult {
  exists: boolean;
  breakEvenCostFN: number | null;
  breakEvenTotalCost: number | null;
  reason: string;
}

export type QuizQuestionType = 'choice' | 'numeric';

export interface QuizQuestion {
  id: string;
  topic: string;
  prompt: string;
  contextTable?: ConfusionMatrix;
  type: QuizQuestionType;
  options?: { id: string; label: string }[];
  correctOptionId?: string;
  numericAnswer?: number;
  numericTolerance?: number;
  numericUnit?: string;
  explanation: string;
  operation: string;
}

export interface QuizProgress {
  answers: Record<string, {
    submittedValue: string;
    isCorrect: boolean;
  }>;
}
