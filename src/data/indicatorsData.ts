import type { MetricKey } from '../types/bankolab';

export interface IndicatorGuide {
  key: Exclude<MetricKey, 'prevalence'>;
  title: string;
  simpleExplanation: string;
  bankingInterpretation: string;
  whenHigh: string;
  whenLow: string;
  limitations: string;
}

export const INDICATORS_GUIDE: IndicatorGuide[] = [
  {
    key: 'accuracy',
    title: 'Exactitud (Accuracy)',
    simpleExplanation:
      'Proporción de todas las predicciones que fueron correctas, sumando tanto aciertos positivos (TP) como negativos (TN) sobre el total N.',
    bankingInterpretation:
      'Mide el porcentaje global de operaciones o clientes clasificados sin error en toda la cartera evaluada.',
    whenHigh:
      'En portafolios balanceados indica buen ajuste general; en portafolios muy desbalanceados puede ser alta aunque el modelo ignore por completo la clase crítica.',
    whenLow:
      'Refleja un volumen elevado de errores totales (FP + FN) respecto al tamaño total de la cartera.',
    limitations:
      'Engañosa en eventos poco frecuentes (fraude o mora severa): un modelo que nunca emite alertas en una muestra con 1 % de fraude logra 99 % de Accuracy siendo inútil.',
  },
  {
    key: 'precision',
    title: 'Precisión (Precision)',
    simpleExplanation:
      'De todas las alertas positivas que emitió el modelo (TP + FP), qué proporción correspondió realmente a eventos positivos.',
    bankingInterpretation:
      'Mide la pureza o confiabilidad de las alertas: qué porcentaje de los casos enviados a revisión o bloqueo eran realmente incumplidores o fraudes.',
    whenHigh:
      'Pocas falsas alarmas; los analistas invierten su tiempo en casos con alta probabilidad real de riesgo y se reduce la fricción con clientes cumplidores.',
    whenLow:
      'Saturación operativa por exceso de falsas alarmas (FP) y mayor costo de oportunidad o molestia a clientes sanos.',
    limitations:
      'Puede inflarse artificialmente alertando solo los casos más obvios y dejando escapar la mayoría de los eventos reales (bajo Recall). Queda como No definido si TP + FP = 0.',
  },
  {
    key: 'recall',
    title: 'Sensibilidad (Recall / TPR)',
    simpleExplanation:
      'De todos los eventos que realmente ocurrieron (TP + FN), qué porcentaje logró detectar el modelo a tiempo.',
    bankingInterpretation:
      'Mide la capacidad de cobertura frente al riesgo: qué fracción del incumplimiento, fraude o déficit real fue interceptada por el sistema.',
    whenHigh:
      'Se escapan pocos eventos críticos (FN bajo), reduciendo pérdidas netas por cartera vencida o fraude consumado.',
    whenLow:
      'El modelo omite muchos casos reales de riesgo (FN alto), exponiendo al banco a pérdidas patrimoniales severas.',
    limitations:
      'Maximizar Recall sin control suele disparar las falsas alarmas (FP) y hundir la Precisión. Queda como No definido si no hay positivos reales (TP + FN = 0).',
  },
  {
    key: 'specificity',
    title: 'Especificidad (Specificity / TNR)',
    simpleExplanation:
      'De todos los casos negativos reales (TN + FP), qué proporción fue clasificada correctamente como negativa sin generar alertas.',
    bankingInterpretation:
      'Indica qué tan bien preserva el modelo el flujo normal de clientes cumplidores, transacciones legítimas o días de liquidez sana.',
    whenHigh:
      'La mayoría de los buenos clientes o transacciones legítimas pasan sin bloqueos ni fricciones innecesarias.',
    whenLow:
      'Se genera un volumen elevado de bloqueos o revisiones sobre clientes que sí pagaban o eran legítimos.',
    limitations:
      'No informa sobre la capacidad de detectar eventos positivos (riesgos). Queda como No definido si no existen negativos reales (TN + FP = 0).',
  },
  {
    key: 'f1',
    title: 'Puntaje F1 (F1-Score)',
    simpleExplanation:
      'Media armónica entre Precisión y Recall. Exige que ambas métricas sean razonablemente altas para obtener un puntaje elevado.',
    bankingInterpretation:
      'Resume en un solo número el equilibrio entre cobertura de riesgos (Recall) y calidad de las alertas (Precisión) sin dejarse dominar por TN masivos.',
    whenHigh:
      'Indica buen balance entre detectar eventos reales y contener falsas alarmas cuando ambos tipos de error importan.',
    whenLow:
      'Basta que falle la Precisión o el Recall para que el F1 caiga fuertemente.',
    limitations:
      'Asigna el mismo peso implícito a FP y FN, lo cual rara vez ocurre en banca donde un FN suele costar mucho más que un FP. Queda No definido si TP = FP = FN = 0.',
  },
  {
    key: 'fpr',
    title: 'Tasa de Falsos Positivos (FPR)',
    simpleExplanation:
      'Proporción de negativos reales que recibieron por error una alerta positiva: complemento de la Especificidad (1 − Specificity).',
    bankingInterpretation:
      'Mide la tasa de falsa alarma sobre la población sana: qué porcentaje de clientes cumplidores o compras legítimas sufre fricción o revisión.',
    whenHigh:
      'Mayor tasa de error Tipo I: sobrecarga operativa, pérdida de margen comercial y fricción con clientes sanos.',
    whenLow:
      'Menor tasa de error sobre negativos reales; operación fluida para clientes sin riesgo.',
    limitations:
      'Aumentar FPR significa cometer más errores sobre clientes sanos. En bases masivas, incluso un FPR del 1 % sobre 100.000 transacciones genera 1.000 falsas alarmas.',
  },
  {
    key: 'fnr',
    title: 'Tasa de Falsos Negativos (FNR)',
    simpleExplanation:
      'Proporción de eventos positivos reales que el modelo no detectó: complemento del Recall (1 − Recall).',
    bankingInterpretation:
      'Mide la fuga de riesgo: qué porcentaje de los incumplimientos, fraudes o déficits de liquidez pasó inadvertido sin alerta.',
    whenHigh:
      'Mayor tasa de error Tipo II: exposición directa a pérdidas financieras severas y posible incumplimiento de apetito de riesgo.',
    whenLow:
      'Fuga mínima de eventos críticos; alta protección frente al riesgo omitido.',
    limitations:
      'Mayor FNR significa más errores por omisión. Reducir FNR bajando el umbral suele incrementar el FPR, obligando a equilibrar costos y capacidad operativa.',
  },
];
