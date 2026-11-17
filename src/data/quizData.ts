import type { QuizQuestion } from '../types/bankolab';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    topic: 'Componentes TP / TN / FP / FN',
    prompt:
      'En originación de crédito, un solicitante que cumpliría puntualmente con todas sus cuotas es marcado por el modelo como alerta de alto riesgo (Predicho = Positivo). ¿A qué celda de la matriz pertenece?',
    type: 'choice',
    options: [
      { id: 'tp', label: 'Verdadero Positivo (TP)' },
      { id: 'tn', label: 'Verdadero Negativo (TN)' },
      { id: 'fp', label: 'Falso Positivo (FP)' },
      { id: 'fn', label: 'Falso Negativo (FN)' },
    ],
    correctOptionId: 'fp',
    explanation:
      'El resultado real era Negativo (no incumple), pero el modelo predijo Positivo (emitió alerta). Eso corresponde a un Falso Positivo (FP) o falsa alarma, que genera costo de oportunidad si se rechaza sin revisión humana.',
    operation: 'Real = Negativo ∧ Predicho = Positivo ⇒ FP',
  },
  {
    id: 'q2',
    topic: 'Lectura de matriz 2×2',
    prompt:
      'Con la convención fija de BancoLab (Filas = REAL [Positivo, Negativo], Columnas = PREDICHO [Positivo, Negativo]), observa la matriz adjunta. ¿Cuántos casos positivos REALES existen en total?',
    contextTable: { tp: 45, fn: 5, fp: 30, tn: 920 },
    type: 'choice',
    options: [
      { id: 'a', label: '45 casos' },
      { id: 'b', label: '50 casos' },
      { id: 'c', label: '75 casos' },
      { id: 'd', label: '950 casos' },
    ],
    correctOptionId: 'b',
    explanation:
      'Los positivos reales corresponden a la primera fila completa de la matriz: la suma de los positivos detectados (TP = 45) y los positivos omitidos (FN = 5).',
    operation: 'Positivos reales = TP + FN = 45 + 5 = 50',
  },
  {
    id: 'q3',
    topic: 'Exactitud (Accuracy)',
    prompt:
      'Con la matriz mostrada, ¿cuál es la Exactitud (Accuracy) del modelo?',
    contextTable: { tp: 80, fn: 20, fp: 50, tn: 850 },
    type: 'choice',
    options: [
      { id: 'a', label: '80,0 %' },
      { id: 'b', label: '85,0 %' },
      { id: 'c', label: '93,0 %' },
      { id: 'd', label: '61,5 %' },
    ],
    correctOptionId: 'c',
    explanation:
      'La Accuracy divide el total de aciertos (TP + TN) entre el total de observaciones N.',
    operation: 'Accuracy = (80 + 850) / (80 + 20 + 50 + 850) = 930 / 1.000 = 0,930 (93,0 %)',
  },
  {
    id: 'q4',
    topic: 'Precisión vs. Recall',
    prompt:
      'En una matriz con TP = 95, FN = 5, FP = 140 y TN = 760, ¿qué representa el valor 95 / (95 + 5) = 95,0 %?',
    contextTable: { tp: 95, fn: 5, fp: 140, tn: 760 },
    type: 'choice',
    options: [
      { id: 'a', label: 'Precisión (Precision)' },
      { id: 'b', label: 'Sensibilidad (Recall)' },
      { id: 'c', label: 'Especificidad (Specificity)' },
      { id: 'd', label: 'Tasa de Falsos Positivos (FPR)' },
    ],
    correctOptionId: 'b',
    explanation:
      'El denominador (TP + FN = 100) corresponde al total de casos positivos reales. Por tanto, TP / (TP + FN) mide qué proporción de los positivos reales fue detectada, es decir, Recall.',
    operation: 'Recall = TP / (TP + FN) = 95 / (95 + 5) = 95 / 100 = 95,0 %',
  },
  {
    id: 'q5',
    topic: 'Cálculo numérico · Precisión',
    prompt:
      'Dada la matriz adjunta (TP = 80, FN = 20, FP = 50, TN = 850), calcula la Precisión en porcentaje (%). Escribe un número entre 0 y 100 (tolerancia explícita: ± 0,5 puntos porcentuales).',
    contextTable: { tp: 80, fn: 20, fp: 50, tn: 850 },
    type: 'numeric',
    numericAnswer: 61.54,
    numericTolerance: 0.5,
    numericUnit: '%',
    explanation:
      'La Precisión evalúa cuántas de las alertas emitidas (TP + FP = 130) correspondieron realmente a eventos positivos (TP = 80).',
    operation: 'Precision = 80 / (80 + 50) = 80 / 130 ≈ 0,6154 = 61,5 %',
  },
  {
    id: 'q6',
    topic: 'Desbalance de clases',
    prompt:
      'En 10.000 transacciones con solo 10 fraudes reales, un modelo trivial que nunca genera alertas obtiene TP = 0, FN = 10, FP = 0 y TN = 9.990. ¿Por qué su Accuracy del 99,9 % es engañosa?',
    contextTable: { tp: 0, fn: 10, fp: 0, tn: 9990 },
    type: 'choice',
    options: [
      { id: 'a', label: 'Porque acierta la clase mayoritaria pero su Recall es 0 % y la Precisión queda No definida' },
      { id: 'b', label: 'Porque un modelo sin alertas tiene FNR de 0 %' },
      { id: 'c', label: 'Porque en fraude siempre se exige que FP sea mayor que TN' },
      { id: 'd', label: 'Porque la fórmula de Accuracy excluye los Verdaderos Negativos' },
    ],
    correctOptionId: 'a',
    explanation:
      'Cuando la clase positiva representa apenas el 0,1 % del volumen, predecir siempre Negativo da 99,9 % de Accuracy sin detectar ningún fraude (Recall = 0 / 10 = 0 %) y con denominador cero en Precisión (TP + FP = 0 ⇒ No definido).',
    operation: 'Accuracy = 9.990 / 10.000 = 99,9 % | Recall = 0 / 10 = 0 % | Precision = 0 / 0 (No definido)',
  },
  {
    id: 'q7',
    topic: 'Cálculo numérico · Impacto económico',
    prompt:
      'Un modelo registra FP = 40 falsas alarmas y FN = 10 incumplimientos omitidos. Usando los costos hipotéticos cFP = 300.000 COP y cFN = 8.000.000 COP, calcula el Costo Total en COP (tolerancia explícita: ± 500.000 COP).',
    type: 'numeric',
    numericAnswer: 92_000_000,
    numericTolerance: 500_000,
    numericUnit: 'COP',
    explanation:
      'Se multiplica cada tipo de error por su costo unitario hipotético y se suman ambos componentes.',
    operation: 'Costo Total = (40 × 300.000) + (10 × 8.000.000) = 12.000.000 + 80.000.000 = 92.000.000 COP',
  },
  {
    id: 'q8',
    topic: 'Elección por costos vs. Accuracy',
    prompt:
      'Sobre exactamente los mismos 1.000 casos (100 positivos reales), el Modelo A tiene Accuracy 93,0 % y costo total 175.000.000 COP; el Modelo B tiene Accuracy 85,5 % y costo total 82.000.000 COP. Si el objetivo es minimizar costo total, ¿qué decisión es coherente?',
    type: 'choice',
    options: [
      { id: 'a', label: 'Elegir A porque tiene mayor Accuracy' },
      { id: 'b', label: 'Elegir B porque, pese a su menor Accuracy, reduce fuertemente los FN más costosos y ahorra 93.000.000 COP' },
      { id: 'c', label: 'Descartar ambos porque B tiene más FP que A' },
      { id: 'd', label: 'Ninguno puede compararse aunque tengan el mismo N y soportes' },
    ],
    correctOptionId: 'b',
    explanation:
      'La Accuracy trata todos los errores por igual, mientras el análisis económico refleja que un FN cuesta 8.000.000 COP frente a 300.000 COP de un FP. Reducir FN de 20 a 5 ahorra 120M COP y solo suma 27M COP en FP.',
    operation: 'Ahorro neto B vs A = 175.000.000 - 82.000.000 = 93.000.000 COP',
  },
  {
    id: 'q9',
    topic: 'Caso práctico · Fraude',
    prompt:
      'En monitoreo transaccional de fraude en tiempo real, ¿qué consecuencia distingue típicamente a un Falso Positivo (FP) frente a un Falso Negativo (FN)?',
    type: 'choice',
    options: [
      { id: 'a', label: 'El FP bloquea o exige verificación extra a una compra legítima; el FN deja pasar un fraude real con pérdida patrimonial' },
      { id: 'b', label: 'El FP siempre obliga a cancelar la tarjeta de forma irreversible; el FN no tiene impacto económico' },
      { id: 'c', label: 'Ambos significan que la transacción legítima fue aprobada sin fricción' },
      { id: 'd', label: 'El FN aumenta la carga de llamadas de clientes legítimos bloqueados' },
    ],
    correctOptionId: 'a',
    explanation:
      'En fraude, el FP genera fricción temporal con un tarjetahabiente genuino (OTP o llamada de confirmación), mientras que el FN permite ejecutar la operación fraudulenta.',
    operation: 'FP: Real legítima + Alerta fraude | FN: Real fraude + Sin alerta',
  },
  {
    id: 'q10',
    topic: 'Caso práctico · Liquidez',
    prompt:
      'En un modelo de alerta de déficit de liquidez a 30 días (unidad = ventana temporal), una ventana en la que la tesorería sí tendría liquidez suficiente es alertada como déficit. ¿Qué error ocurre y cuál es su efecto típico?',
    type: 'choice',
    options: [
      { id: 'a', label: 'Falso Negativo (FN); expone al banco a fondeo de emergencia penalizado' },
      { id: 'b', label: 'Falso Positivo (FP); puede inducir a mantener caja ociosa o contratar fondeo preventivo innecesario' },
      { id: 'c', label: 'Verdadero Positivo (TP); anticipa correctamente una brecha real de caja' },
      { id: 'd', label: 'Verdadero Negativo (TN); confirma holgura de tesorería' },
    ],
    correctOptionId: 'b',
    explanation:
      'La clase positiva es el déficit de liquidez. Si la realidad era suficiencia (Negativo) pero el modelo alertó déficit (Positivo), es un Falso Positivo (FP) con costo financiero por precaución excesiva.',
    operation: 'Real = Suficiencia (Neg) ∧ Predicho = Déficit (Pos) ⇒ FP',
  },
  {
    id: 'q11',
    topic: 'Tasa de error y FPR / FNR',
    prompt:
      'Si en una muestra con casos positivos y negativos reales aumentan tanto el FPR como el FNR respecto a una línea base, ¿qué ocurre con los errores del modelo?',
    type: 'choice',
    options: [
      { id: 'a', label: 'Disminuyen las falsas alarmas pero aumentan los aciertos totales' },
      { id: 'b', label: 'Aumentan ambas proporciones de error: más falsas alarmas sobre negativos reales y más eventos omitidos sobre positivos reales' },
      { id: 'c', label: 'El Recall y la Especificidad aumentan simultáneamente' },
      { id: 'd', label: 'El puntaje F1 necesariamente llega a 100 %' },
    ],
    correctOptionId: 'b',
    explanation:
      'FPR = 1 − Especificidad y FNR = 1 − Recall. Un aumento en FPR implica mayor error sobre negativos reales, y un aumento en FNR implica mayor error por omisión sobre positivos reales.',
    operation: '↑ FPR ⇒ ↑ FP/(FP+TN) y ↑ FNR ⇒ ↑ FN/(FN+TP)',
  },
  {
    id: 'q12',
    topic: 'Comparabilidad de portafolios',
    prompt:
      'El Modelo X se probó en 1.000 solicitudes (100 moras) y el Modelo Y en 3.000 solicitudes (150 moras). ¿Es válido declarar ganador al que tenga menor costo total en COP?',
    type: 'choice',
    options: [
      { id: 'a', label: 'Sí, el costo total absoluto en COP siempre es comparable sin importar N' },
      { id: 'b', label: 'No, porque difieren en tamaño de muestra N y soportes de positivos/negativos reales; comparar totales sesgaría hacia la muestra más pequeña' },
      { id: 'c', label: 'Sí, siempre que se multiplique TP por FP' },
      { id: 'd', label: 'Solo si Accuracy supera el 50 %' },
    ],
    correctOptionId: 'b',
    explanation:
      'Los costos totales dependen directamente del tamaño N y de cuántos casos positivos reales haya. Para una comparación justa por totales, ambos modelos deben evaluarse sobre el mismo conjunto de prueba (igual N, P y Neg).',
    operation: 'N_X (1.000) ≠ N_Y (3.000) y P_X (100) ≠ P_Y (150) ⇒ Muestras no comparables por total',
  },
];
