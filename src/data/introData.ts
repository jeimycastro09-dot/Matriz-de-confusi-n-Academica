import type { SyntheticRecord } from '../types/bankolab';

export const INTRO_12_RECORDS: SyntheticRecord[] = [
  {
    id: 'SOL-01',
    label: 'Solicitud #01 · Microcrédito',
    detail: 'Mora previa 60d · Endeudamiento 68%',
    score: 0.84,
    actual: true,
    predicted: true,
  },
  {
    id: 'SOL-02',
    label: 'Solicitud #02 · Crédito nómina',
    detail: 'Ingreso estable · Sin moras 24m',
    score: 0.12,
    actual: false,
    predicted: false,
  },
  {
    id: 'SOL-03',
    label: 'Solicitud #03 · Libre inversión',
    detail: 'Variabilidad de ingresos · Cupo alto',
    score: 0.62,
    actual: false,
    predicted: true,
  },
  {
    id: 'SOL-04',
    label: 'Solicitud #04 · Tarjeta clásica',
    detail: 'Historial corto · Liquidez ajustada',
    score: 0.41,
    actual: true,
    predicted: false,
  },
  {
    id: 'SOL-05',
    label: 'Solicitud #05 · Vehículo',
    detail: 'Atrasos recientes · Alto apalancamiento',
    score: 0.91,
    actual: true,
    predicted: true,
  },
  {
    id: 'SOL-06',
    label: 'Solicitud #06 · Crédito nómina',
    detail: 'Antigüedad laboral 5 años · Bajo uso',
    score: 0.09,
    actual: false,
    predicted: false,
  },
  {
    id: 'SOL-07',
    label: 'Solicitud #07 · Rotativo PYME',
    detail: 'Flujo estacional · Garantía parcial',
    score: 0.58,
    actual: false,
    predicted: true,
  },
  {
    id: 'SOL-08',
    label: 'Solicitud #08 · Libre inversión',
    detail: 'Cuota/ingreso 52% · Reporte reciente',
    score: 0.77,
    actual: true,
    predicted: true,
  },
  {
    id: 'SOL-09',
    label: 'Solicitud #09 · Hipotecario',
    detail: 'Ahorro programado · Bajo endeudamiento',
    score: 0.15,
    actual: false,
    predicted: false,
  },
  {
    id: 'SOL-10',
    label: 'Solicitud #10 · Microcrédito',
    detail: 'Consultas múltiples · Flujo irregular',
    score: 0.73,
    actual: true,
    predicted: true,
  },
  {
    id: 'SOL-11',
    label: 'Solicitud #11 · Libranza',
    detail: 'Descuento directo · Sin alertas previas',
    score: 0.18,
    actual: false,
    predicted: false,
  },
  {
    id: 'SOL-12',
    label: 'Solicitud #12 · Tarjeta oro',
    detail: 'Buen puntaje externo · Baja utilización',
    score: 0.22,
    actual: false,
    predicted: false,
  },
];

export const MULTICLASS_RISK_LABELS = ['Riesgo Bajo', 'Riesgo Medio', 'Riesgo Alto'] as const;

// Filas = Real [Bajo, Medio, Alto], Columnas = Predicho [Bajo, Medio, Alto]
export const MULTICLASS_RISK_MATRIX: number[][] = [
  [420, 45, 15],
  [38, 260, 42],
  [12, 33, 135],
];
