import { AlertTriangle, CheckCircle2, Equal, RotateCcw, ShieldAlert } from 'lucide-react';
import { useMemo } from 'react';
import type { Data, Layout, Shape } from 'plotly.js';
import { PlotlyChart } from '../components/PlotlyChart';
import type {
  ConfusionMatrix,
  CostParameters,
  OptimizationObjective,
} from '../types/bankolab';
import {
  buildFNSensitivitySeries,
  computeBreakEvenCostFN,
  DEFAULT_COSTS,
  DEFAULT_MODEL_A,
  DEFAULT_MODEL_B,
  evaluateEconomics,
  recommendModel,
} from '../utils/economics';
import { formatCOP, formatInt, formatPercent, sanitizeNonNegativeInt } from '../utils/format';

interface EconomicImpactModuleProps {
  costs: CostParameters;
  onChangeCosts: (next: CostParameters) => void;
  modelA: ConfusionMatrix;
  onChangeModelA: (next: ConfusionMatrix) => void;
  modelB: ConfusionMatrix;
  onChangeModelB: (next: ConfusionMatrix) => void;
  objective: OptimizationObjective;
  onChangeObjective: (next: OptimizationObjective) => void;
  maxFnrPercent: number;
  onChangeMaxFnrPercent: (next: number) => void;
}

export function EconomicImpactModule({
  costs,
  onChangeCosts,
  modelA,
  onChangeModelA,
  modelB,
  onChangeModelB,
  objective,
  onChangeObjective,
  maxFnrPercent,
  onChangeMaxFnrPercent,
}: EconomicImpactModuleProps) {
  const evalA = useMemo(() => evaluateEconomics(modelA, costs), [modelA, costs]);
  const evalB = useMemo(() => evaluateEconomics(modelB, costs), [modelB, costs]);
  const recommendation = useMemo(
    () => recommendModel(evalA, evalB, objective, maxFnrPercent),
    [evalA, evalB, objective, maxFnrPercent],
  );

  const breakEven = useMemo(
    () => computeBreakEvenCostFN(modelA, modelB, costs.costFP),
    [modelA, modelB, costs.costFP],
  );

  const sensitivity = useMemo(
    () => buildFNSensitivitySeries(modelA, modelB, costs.costFP, costs.costFN, breakEven),
    [modelA, modelB, costs.costFP, costs.costFN, breakEven],
  );

  const stackedChart = useMemo<{ data: Data[]; layout: Partial<Layout> }>(() => {
    const data: Data[] = [
      {
        name: 'Costo por Falsas Alarmas (FP)',
        type: 'bar',
        x: ['Modelo A', 'Modelo B'],
        y: [evalA.totalCostFP, evalB.totalCostFP],
        marker: { color: '#D97706' },
        text: [formatCOP(evalA.totalCostFP), formatCOP(evalB.totalCostFP)],
        textposition: 'inside',
        hovertemplate: '%{x} · Costo FP: %{text}<extra></extra>',
      },
      {
        name: 'Costo por Eventos Omitidos (FN)',
        type: 'bar',
        x: ['Modelo A', 'Modelo B'],
        y: [evalA.totalCostFN, evalB.totalCostFN],
        marker: { color: '#0F1F38' },
        text: [formatCOP(evalA.totalCostFN), formatCOP(evalB.totalCostFN)],
        textposition: 'inside',
        hovertemplate: '%{x} · Costo FN: %{text}<extra></extra>',
      },
    ];

    const layout: Partial<Layout> = {
      barmode: 'stack',
      margin: { t: 24, r: 20, b: 48, l: 88 },
      yaxis: {
        title: { text: 'Costo total (COP)' },
        gridcolor: '#E6DFD3',
        tickformat: ',.0f',
      },
      legend: {
        orientation: 'h',
        y: -0.22,
      },
    };

    return { data, layout };
  }, [evalA, evalB]);

  const sensitivityChart = useMemo<{ data: Data[]; layout: Partial<Layout> }>(() => {
    const shapes: Partial<Shape>[] = [
      {
        type: 'line',
        x0: costs.costFN,
        x1: costs.costFN,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: { color: '#475569', width: 1.5, dash: 'dot' },
      },
    ];

    const annotations: Partial<Layout>['annotations'] = [
      {
        x: costs.costFN,
        y: 0.96,
        yref: 'paper',
        text: `cFN actual (${formatCOP(costs.costFN)})`,
        showarrow: false,
        xanchor: 'left',
        xshift: 6,
        font: { size: 11, color: '#334155' },
      },
    ];

    if (breakEven.exists && breakEven.breakEvenCostFN !== null) {
      shapes.push({
        type: 'line',
        x0: breakEven.breakEvenCostFN,
        x1: breakEven.breakEvenCostFN,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: { color: '#0D9488', width: 2, dash: 'dash' },
      });
      annotations.push({
        x: breakEven.breakEvenCostFN,
        y: 0.14,
        yref: 'paper',
        text: `Equilibrio cFN* = ${formatCOP(breakEven.breakEvenCostFN)}`,
        showarrow: true,
        arrowhead: 2,
        ax: 35,
        ay: -28,
        bgcolor: '#F0FDFA',
        bordercolor: '#0D9488',
        font: { size: 11, color: '#0F766E' },
      });
    }

    const data: Data[] = [
      {
        name: 'Costo Total Modelo A',
        type: 'scatter',
        mode: 'lines',
        x: sensitivity.xValues,
        y: sensitivity.costA,
        line: { color: '#0F1F38', width: 3 },
        hovertemplate: 'cFN: $%{x:,.0f} COP<br>Costo A: $%{y:,.0f} COP<extra></extra>',
      },
      {
        name: 'Costo Total Modelo B',
        type: 'scatter',
        mode: 'lines',
        x: sensitivity.xValues,
        y: sensitivity.costB,
        line: { color: '#0D9488', width: 3 },
        hovertemplate: 'cFN: $%{x:,.0f} COP<br>Costo B: $%{y:,.0f} COP<extra></extra>',
      },
    ];

    if (breakEven.exists && breakEven.breakEvenCostFN !== null && breakEven.breakEvenTotalCost !== null) {
      data.push({
        name: 'Punto de equilibrio',
        type: 'scatter',
        mode: 'markers',
        x: [breakEven.breakEvenCostFN],
        y: [breakEven.breakEvenTotalCost],
        marker: { color: '#0D9488', size: 10, line: { color: '#FFFFFF', width: 2 } },
        hovertemplate: 'Equilibrio cFN*: $%{x:,.0f} COP<br>Costo: $%{y:,.0f} COP<extra></extra>',
      });
    }

    const layout: Partial<Layout> = {
      margin: { t: 24, r: 20, b: 56, l: 88 },
      xaxis: {
        title: { text: 'Costo unitario de un Falso Negativo · cFN (COP)' },
        gridcolor: '#E6DFD3',
        tickformat: ',.0f',
      },
      yaxis: {
        title: { text: 'Costo total del modelo (COP)' },
        gridcolor: '#E6DFD3',
        tickformat: ',.0f',
      },
      shapes,
      annotations,
      legend: {
        orientation: 'h',
        y: -0.25,
      },
    };

    return { data, layout };
  }, [breakEven, costs.costFN, sensitivity]);

  const updateMatrixField = (
    setter: (next: ConfusionMatrix) => void,
    current: ConfusionMatrix,
    field: keyof ConfusionMatrix,
    raw: string,
  ) => {
    setter({ ...current, [field]: sanitizeNonNegativeInt(raw) });
  };

  const handleResetAll = () => {
    onChangeCosts(DEFAULT_COSTS);
    onChangeModelA(DEFAULT_MODEL_A);
    onChangeModelB(DEFAULT_MODEL_B);
    onChangeObjective('min_cost');
    onChangeMaxFnrPercent(25);
  };

  const BannerIcon =
    recommendation.winner === 'not_comparable'
      ? AlertTriangle
      : recommendation.winner === 'none'
        ? ShieldAlert
        : recommendation.winner === 'tie'
          ? Equal
          : CheckCircle2;

  const bannerClasses =
    recommendation.winner === 'not_comparable'
      ? 'bg-amber-50 border-amber-300 text-amber-950'
      : recommendation.winner === 'none'
        ? 'bg-red-50 border-red-300 text-red-950'
        : recommendation.winner === 'tie'
          ? 'bg-ivory-100 border-ivory-300 text-navy-900'
          : 'bg-teal-50 border-teal-300 text-navy-900';

  return (
    <div className="space-y-8">
      <header className="border-b border-ivory-200 pb-5">
        <p className="text-xs font-medium text-teal-700">Módulo 6 · Decisión financiera</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
              Impacto económico central y comparación de modelos
            </h1>
            <p className="text-sm sm:text-base text-slate-700 mt-2 max-w-3xl leading-relaxed">
              Evalúa por qué un modelo con menor <em>Accuracy</em> puede generar un ahorro económico significativo al
              ponderar el costo asimétrico entre falsas alarmas (FP) y eventos omitidos (FN) en COP.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-ivory-200 bg-white text-navy-900 hover:bg-ivory-100 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Restablecer escenario A/B
          </button>
        </div>
      </header>

      {/* Parámetros de costo y apetito de riesgo */}
      <section className="bg-white border border-ivory-200 rounded-xl p-5 sm:p-6 space-y-5">
        <h2 className="text-base font-bold text-navy-900">
          Parámetros hipotéticos de costo (COP) y política de decisión
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <label className="block space-y-1.5">
            <span className="block text-xs font-semibold text-navy-900">
              Costo unitario FP (cFP · COP)
            </span>
            <input
              type="number"
              min={0}
              step={50_000}
              value={costs.costFP}
              onChange={(e) =>
                onChangeCosts({ ...costs, costFP: sanitizeNonNegativeInt(e.target.value) })
              }
              className="w-full rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 font-mono text-sm font-semibold tabular-nums text-navy-900"
            />
            <span className="block text-xs text-slate-600 tabular-nums">
              Actual: {formatCOP(costs.costFP)} (margen perdido hipotético)
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="block text-xs font-semibold text-navy-900">
              Costo unitario FN (cFN · COP)
            </span>
            <input
              type="number"
              min={0}
              step={250_000}
              value={costs.costFN}
              onChange={(e) =>
                onChangeCosts({ ...costs, costFN: sanitizeNonNegativeInt(e.target.value) })
              }
              className="w-full rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 font-mono text-sm font-semibold tabular-nums text-navy-900"
            />
            <span className="block text-xs text-slate-600 tabular-nums">
              Actual: {formatCOP(costs.costFN)} (pérdida neta hipotética)
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="block text-xs font-semibold text-navy-900">
              Objetivo de optimización
            </span>
            <select
              value={objective}
              onChange={(e) => onChangeObjective(e.target.value as OptimizationObjective)}
              className="w-full rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 text-sm font-semibold text-navy-900"
            >
              <option value="min_cost">Menor costo total (COP)</option>
              <option value="max_recall">Mayor Recall (Sensibilidad)</option>
              <option value="max_precision">Mayor Precisión</option>
            </select>
            <span className="block text-xs text-slate-600">
              Fórmula: Costo Total = (FP × cFP) + (FN × cFN)
            </span>
          </label>

          <div className="space-y-1.5">
            <label htmlFor="max-fnr-input" className="block text-xs font-semibold text-navy-900">
              Apetito de riesgo: FNR máximo permitido (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="max-fnr-input"
                type="number"
                min={0}
                max={100}
                step={1}
                value={maxFnrPercent}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  onChangeMaxFnrPercent(val);
                }}
                className="w-24 rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 font-mono text-sm font-semibold tabular-nums text-navy-900"
              />
              <input
                type="range"
                aria-label="Control deslizante de FNR máximo permitido"
                min={0}
                max={100}
                step={1}
                value={maxFnrPercent}
                onChange={(e) => onChangeMaxFnrPercent(Number(e.target.value))}
                className="w-full accent-teal-700"
              />
            </div>
            <span className="block text-xs text-slate-600 tabular-nums">
              Restricción activa: FNR ≤ {formatPercent(maxFnrPercent / 100)}
            </span>
          </div>
        </div>
      </section>

      {/* Banner de comparabilidad / recomendación */}
      <section
        className={`border rounded-xl p-5 flex items-start gap-3.5 ${bannerClasses}`}
        aria-live="polite"
      >
        <BannerIcon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1.5">
          <h2 className="text-base font-bold">{recommendation.headline}</h2>
          <p className="text-sm leading-relaxed">{recommendation.explanation}</p>
          {recommendation.tieReason && (
            <p className="text-xs font-medium opacity-90">{recommendation.tieReason}</p>
          )}
          {!recommendation.comparable && recommendation.comparabilityReasons.length > 0 && (
            <ul className="list-disc pl-5 text-xs space-y-0.5 pt-1">
              {recommendation.comparabilityReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Comparación editable Modelo A vs Modelo B */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {(
          [
            {
              key: 'A' as const,
              title: 'Modelo A · Enfoque tradicional',
              matrix: modelA,
              setter: onChangeModelA,
              evalData: evalA,
              feasible: recommendation.feasibleA,
            },
            {
              key: 'B' as const,
              title: 'Modelo B · Mayor cobertura de riesgo',
              matrix: modelB,
              setter: onChangeModelB,
              evalData: evalB,
              feasible: recommendation.feasibleB,
            },
          ] as const
        ).map((item) => (
          <article
            key={item.key}
            className={`bg-white border rounded-xl p-5 space-y-5 ${
              recommendation.winner === item.key ? 'border-teal-600 ring-1 ring-teal-600' : 'border-ivory-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ivory-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-navy-900">{item.title}</h3>
                <p className="text-xs text-slate-600 tabular-nums">
                  N = {formatInt(item.evalData.summary.total)} · Positivos reales ={' '}
                  {formatInt(item.evalData.summary.actualPositives)} · Negativos reales ={' '}
                  {formatInt(item.evalData.summary.actualNegatives)}
                </p>
              </div>
              <span
                className={`text-xs font-semibold ${
                  item.feasible ? 'text-teal-700' : 'text-red-700'
                }`}
              >
                {item.feasible ? 'Cumple FNR máx.' : 'Excede FNR máx.'}
              </span>
            </div>

            {/* Matriz editable compacta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['tp', 'fn', 'fp', 'tn'] as const).map((field) => (
                <label key={field} className="block space-y-1">
                  <span className="block text-xs font-semibold text-slate-700 uppercase">
                    {field}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={item.matrix[field]}
                    onChange={(e) => updateMatrixField(item.setter, item.matrix, field, e.target.value)}
                    className="w-full rounded-lg border border-ivory-300 bg-ivory-50 px-2.5 py-1.5 font-mono text-sm font-semibold tabular-nums text-navy-900"
                  />
                </label>
              ))}
            </div>

            {/* Desglose económico y métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3.5 space-y-1">
                <div className="text-xs text-slate-600">Costo total estimado</div>
                <div className="font-mono text-xl font-bold text-navy-900 tabular-nums">
                  {formatCOP(item.evalData.totalCost)}
                </div>
                <div className="text-xs text-slate-600 tabular-nums">
                  Costo por caso:{' '}
                  <strong className="font-mono text-navy-900">
                    {item.evalData.costPerCase !== null ? formatCOP(item.evalData.costPerCase) : 'No definido'}
                  </strong>
                </div>
              </div>

              <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2 tabular-nums">
                  <span className="text-slate-600">FP ({formatInt(item.matrix.fp)} × cFP):</span>
                  <span className="font-mono font-semibold text-amber-800">
                    {formatCOP(item.evalData.totalCostFP)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 tabular-nums">
                  <span className="text-slate-600">FN ({formatInt(item.matrix.fn)} × cFN):</span>
                  <span className="font-mono font-semibold text-red-800">
                    {formatCOP(item.evalData.totalCostFN)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 pt-1 border-t border-ivory-200 tabular-nums">
                  <span className="text-slate-600">Accuracy / Recall / FNR:</span>
                  <span className="font-mono font-semibold text-navy-900">
                    {item.evalData.summary.metrics.accuracy.formattedPercent} ·{' '}
                    {item.evalData.summary.metrics.recall.formattedPercent} ·{' '}
                    {item.evalData.summary.metrics.fnr.formattedPercent}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Gráficos Plotly: Barras apiladas y Sensibilidad cFN */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-5 bg-white border border-ivory-200 rounded-xl p-5 space-y-3">
          <h2 className="text-base font-bold text-navy-900">
            Desglose de costos FP vs. FN (Plotly.js)
          </h2>
          <p className="text-xs text-slate-600">
            Observa cómo el costo de los eventos omitidos (FN) domina el total frente a las falsas alarmas (FP).
          </p>
          <PlotlyChart
            data={stackedChart.data}
            layout={stackedChart.layout}
            className="w-full h-[340px]"
            ariaLabel="Gráfico de barras apiladas comparando el costo por FP y FN entre Modelo A y Modelo B"
          />
        </div>

        <div className="xl:col-span-7 bg-white border border-ivory-200 rounded-xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-navy-900">
                Sensibilidad al costo unitario FN y umbral de equilibrio
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">{breakEven.reason}</p>
            </div>
          </div>
          <PlotlyChart
            data={sensitivityChart.data}
            layout={sensitivityChart.layout}
            className="w-full h-[340px]"
            ariaLabel="Gráfico de líneas de sensibilidad del costo total respecto al costo unitario de Falso Negativo"
          />
        </div>
      </section>

      {/* Supuestos y alcance */}
      <section className="bg-ivory-100 border border-ivory-200 rounded-xl p-5 sm:p-6 space-y-3">
        <h2 className="text-base font-bold text-navy-900">
          Supuestos del análisis y efectos no cuantificados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-700 leading-relaxed">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-navy-900">Supuestos explícitos de este modelo</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Costos unitarios constantes e independientes del monto individual de cada operación.</li>
              <li>Un solo horizonte de evaluación sin efectos de tasa de descuento ni recuperaciones posteriores.</li>
              <li>Las matrices de comparación asumen muestras fijas; cambiar el umbral de corte mueve simultáneamente TP, FP, FN y TN.</li>
            </ul>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-navy-900">Efectos no cuantificados y advertencia regulatoria</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Fricción comercial, pérdida de relación de largo plazo (LTV) o desgaste reputacional por exceso de FP.</li>
              <li>Capacidad operativa limitada de los equipos de análisis para revisar alertas adicionales.</li>
              <li>
                <strong>Alcance normativo:</strong> este cálculo educativo ilustra trade-offs de error y{' '}
                <strong>no constituye un cálculo regulatorio de pérdida esperada</strong> (ni reemplaza metodologías NIIF 9 / Basilea).
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
