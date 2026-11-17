# BancoLab · Matriz de confusión

Aplicación web educativa en español para comprender, simular y evaluar matrices de confusión, indicadores de clasificación binaria/multiclase e impacto económico en contextos bancarios y financieros.

> **Aviso educativo:** Todos los registros, escenarios y costos unitarios en pesos colombianos (COP) son sintéticos e hipotéticos. Esta herramienta es estrictamente formativa: no constituye un motor de aprobación crediticia ni un cálculo regulatorio de pérdida esperada (NIIF 9 / Basilea).

## Módulos incluidos

1. **Introducción:** Concepto de matriz de confusión, real observado vs. predicho, convención fija `[[TP, FN], [FP, TN]]`, constructor paso a paso con 12 solicitudes sintéticas y ejemplo multiclase 3×3 con reducción *Uno contra Resto*.
2. **Escenarios:** Selector entre *Riesgo de crédito*, *Detección de fraude*, *Alerta de liquidez* y *Retención de clientes*, con tabla sintética completa y matriz calculada directamente desde sus registros.
3. **Componentes:** Celdas TP, TN, FP y FN seleccionables con mouse o teclado, explicación estadística, lectura bancaria en crédito, consecuencias y criterio de revisión humana.
4. **Simulador:** Edición directa de TP/TN/FP/FN, mapa de calor interactivo con Plotly.js (modos Absoluto, Por fila y Sobre el total), presets (*Equilibrado*, *Conservador*, *Sin alertas*, *Fraude*), exportación a CSV, manejo seguro de denominadores en cero (`No definido`) y persistencia local.
5. **Indicadores:** Accuracy, Precision, Recall, Specificity, F1, FPR y FNR con sustitución numérica en tiempo real, gráfico comparativo en Plotly.js y análisis de la trampa de Accuracy bajo desbalance.
6. **Impacto económico central:** Costos editables en COP (`es-CO`), comparación Modelo A vs. Modelo B, verificación de comparabilidad por tamaño N y soportes, restricción de apetito de riesgo (FNR máximo), detección de empates, gráfico de barras apiladas y curva de sensibilidad al costo FN con umbral de equilibrio.
7. **Evaluación:** 12 preguntas prácticas sin respuestas preseleccionadas, pregunta numérica con tolerancia explícita, retroalimentación inmediata con operación, puntaje sin duplicación y progreso guardado en `localStorage`.

## Requisitos e instalación

- Node.js 20 o superior
- npm 10 o superior

```bash
npm install
```

## Ejecución y verificación

- **Modo desarrollo (puerto 3000):**

```bash
npm run dev
```

- **Pruebas unitarias (Vitest):**

```bash
npm test
```

- **Verificación de tipos (TypeScript):**

```bash
npm run lint
```

- **Compilación de producción:**

```bash
npm run build
```

## Estructura modular del proyecto

- `src/utils/metrics.ts`: Funciones puras de agregación, convención `[[TP, FN], [FP, TN]]`, indicadores con control de división por cero y exportación CSV.
- `src/utils/economics.ts`: Evaluación económica en COP, comparabilidad, restricciones de FNR, empates y punto de equilibrio.
- `src/utils/format.ts`: Formateadores `es-CO` y sanitización numérica.
- `src/data/*`: Datos sintéticos, guías pedagógicas y banco de preguntas.
- `src/components/*`: Envoltorio responsivo de Plotly.js, matriz 2×2 accesible y ayuda contextual.
- `src/modules/*`: Vistas de los 7 módulos educativos.
- `src/utils/__tests__/bankolab.test.ts`: Pruebas unitarias de métricas, ceros, comparabilidad, empates, restricciones y equilibrio.
