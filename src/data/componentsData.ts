import type { CellKey } from '../types/bankolab';

export interface CellComponentInfo {
  key: CellKey;
  code: string;
  name: string;
  axisCoordinates: string;
  statisticalDefinition: string;
  creditInterpretation: string;
  consequence: string;
  possibleDecisions: string[];
  tone: 'positive' | 'neutral' | 'warning' | 'danger';
}

export const CELL_COMPONENTS: Record<CellKey, CellComponentInfo> = {
  tp: {
    key: 'tp',
    code: 'TP',
    name: 'Verdadero Positivo (True Positive)',
    axisCoordinates: 'Real: Positivo · Predicho: Positivo',
    statisticalDefinition:
      'Observación en la que el evento de interés realmente ocurrió (Real = Positivo) y el modelo generó correctamente una alerta (Predicho = Positivo).',
    creditInterpretation:
      'Alerta correcta sobre incumplidor: el modelo señala riesgo alto en un solicitante que efectivamente incumpliría a 12 meses.',
    consequence:
      'Evita un desembolso problemático o permite exigir mitigantes oportunos antes de asumir la exposición.',
    possibleDecisions: [
      'Enviar a revisión humana prioritaria por analista de crédito.',
      'Solicitar documentación adicional de ingresos o codeudor.',
      'Reducir el cupo o ajustar el plazo propuesto según política vigente.',
    ],
    tone: 'positive',
  },
  tn: {
    key: 'tn',
    code: 'TN',
    name: 'Verdadero Negativo (True Negative)',
    axisCoordinates: 'Real: Negativo · Predicho: Negativo',
    statisticalDefinition:
      'Observación en la que el evento no ocurrió (Real = Negativo) y el modelo correctamente no activó ninguna alerta (Predicho = Negativo).',
    creditInterpretation:
      'Sin alerta sobre quien paga: el modelo clasifica como de bajo riesgo a un solicitante que cumplirá puntualmente con su obligación.',
    consequence:
      'Mantiene una experiencia ágil para clientes sanos, genera ingresos por intereses y evita congestión operativa innecesaria.',
    possibleDecisions: [
      'Continuar con el flujo estándar de originación según políticas comerciales.',
      'Mantener monitoreo periódico normal de cartera una vez desembolsado.',
      'Evitar fricciones innecesarias con el cliente.',
    ],
    tone: 'neutral',
  },
  fp: {
    key: 'fp',
    code: 'FP',
    name: 'Falsa Alarma / Falso Positivo (False Positive)',
    axisCoordinates: 'Real: Negativo · Predicho: Positivo',
    statisticalDefinition:
      'Error Tipo I: el evento no iba a ocurrir (Real = Negativo), pero el modelo activó erróneamente una alerta positiva (Predicho = Positivo).',
    creditInterpretation:
      'Alerta sobre quien paga: el modelo marca como riesgoso a un solicitante cumplidor, generando oportunidad perdida si se rechaza sin revisión.',
    consequence:
      'Pérdida de margen financiero potencial, deterioro en la experiencia del cliente y sobrecarga de casos para los analistas.',
    possibleDecisions: [
      'Realizar revisión humana antes de emitir una negativa definitiva.',
      'Validar información complementaria (extractos, antigüedad, referencias).',
      'Ofrecer un producto alternativo o monto inicial gradual en lugar de rechazar de plano.',
    ],
    tone: 'warning',
  },
  fn: {
    key: 'fn',
    code: 'FN',
    name: 'Evento Omitido / Falso Negativo (False Negative)',
    axisCoordinates: 'Real: Positivo · Predicho: Negativo',
    statisticalDefinition:
      'Error Tipo II: el evento sí ocurrió (Real = Positivo), pero el modelo falló en alertar y lo clasificó como negativo (Predicho = Negativo).',
    creditInterpretation:
      'Sin alerta sobre quien incumple: el modelo deja pasar como sano a un solicitante que terminará en mora, ocasionando pérdida si se aprueba.',
    consequence:
      'Pérdida directa de capital e intereses no recuperados, aumento en gastos de cobranza y deterioro de indicadores de cartera.',
    possibleDecisions: [
      'Establecer muestreos de control y reglas de negocio complementarias (topes por endeudamiento).',
      'Revisar variables no capturadas y calibrar el umbral del modelo en comités de validación.',
      'Monitorear tempranamente las primeras cuotas para detectar deterioro precoz.',
    ],
    tone: 'danger',
  },
};
