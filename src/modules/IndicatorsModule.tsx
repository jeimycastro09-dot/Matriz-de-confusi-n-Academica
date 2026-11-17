import { useMemo } from 'react';
import type { Data, Layout } from 'plotly.js';
import { PlotlyChart } from '../components/PlotlyChart';
import { INDICATORS_GUIDE } from '../data/indicatorsData';
import type { ConfusionMatrix } from '../types/bankolab';
import { formatInt } from '../utils/format';
import { computeMatrixSummary, MATRIX_PRESETS } from '../utils/metrics';

interface IndicatorsModuleProps {
  matrix: ConfusionMatrix;
  onChangeMatrix: (next: ConfusionMatrix) => void;
}

export function IndicatorsModule({ matrix, onChangeMatrix }: IndicatorsModuleProps) {
  const summary = useMemo(() => computeMatrixSummary(matrix), [matrix]);

  const chartData = useMemo<{ data: Data[]; layout: Partial<Layout> }>(() => {
    const ordered = [...INDICATORS_GUIDE].reverse();
    const labels = ordered.map((item) => summary.metrics[item.key].shortLabel);
    const values = ordered.map((item) => {
      const m = summary.metrics[item.key];
      return m.defined && m.value !== null ? Number((m.value * 100).toFixed(2)) : 0;
    });
    const textLabels = ordered.map((item) => summary.metrics[item.key].formattedPercent);
    const colors = ordered.map((item) => {
      const m = summary.metrics[item.key];
      if (!m.defined) return '#CBD5E1';
      if (item.key === 'fpr' || item.key === 'fnr') return '#D97706';
      if (item.key === 'recall' || item.key === 'precision' || item.key === 'f1') return '#0D9488';
      return '#0F1F38';
    });

    const data: Data[] = [
      {
        type: 'bar',
        orientation: 'h',
        y: labels,
        x: values,
        text: textLabels,
        textposition: 'outside',
        cliponaxis: false,
        marker: { color: colors },
        hovertemplate: '%{y}: %{text}<extra></extra>',
      },
    ];

    const layout: Partial<Layout> = {
      margin: { t: 16, r: 95, b: 42, l: 105 },
      xaxis: {
        range: [0, 118],
        ticksuffix: ' %',
        gridcolor: '#E6DFD3',
        title: { text: 'Valor porcentual (%)' },
      },
      yaxis: {
        tickfont: { size: 12, color: '#0F1F38' },
      },
    };

    return { data, layout };
  }, [summary]);

  return (
    <div className="space-y-8">
      <header className="border-b border-ivory-200 pb-5">
        <p className="text-xs font-medium text-teal-700">Módulo 5 · Métricas de desempeño</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
              Indicadores con sustitución numérica en vivo
            </h1>
            <p className="text-sm sm:text-base text-slate-700 mt-2 max-w-3xl leading-relaxed">
              Calculados sobre tu matriz actual del Simulador (
              <span className="font-mono tabular-nums font-semibold">
                TP={formatInt(matrix.tp)}, FN={formatInt(matrix.fn)}, FP={formatInt(matrix.fp)}, TN={formatInt(matrix.tn)}
              </span>
              ). Si un denominador vale cero, verás <strong>No definido</strong> y la causa exacta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-ivory-100 border border-ivory-200 rounded-lg shrink-0">
            {Object.values(MATRIX_PRESETS).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeMatrix(preset.matrix)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-md text-navy-900 hover:bg-white transition-colors whitespace-nowrap shrink-0"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Gráfico Plotly + Comparaciones clave */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-ivory-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-navy-900">
              Comparativa gráfica de los 7 indicadores (Plotly.js)
            </h2>
            <span className="text-xs text-slate-600 tabular-nums">N = {formatInt(summary.total)}</span>
          </div>
          <PlotlyChart
            data={chartData.data}
            layout={chartData.layout}
            className="w-full h-[330px]"
            ariaLabel="Gráfico de barras horizontales comparando Accuracy, Precision, Recall, Specificity, F1, FPR y FNR"
          />
          <p className="text-xs text-slate-600">
            Barras azul noche: métricas globales/negativos · Turquesa: detección de positivos · Ámbar: tasas de error (FPR y FNR).
          </p>
        </div>

        <div className="xl:col-span-5 space-y-4">
          <article className="bg-white border border-ivory-200 rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-bold text-navy-900">Diferencia entre Precisión y Recall</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Precisión</strong> responde: «De quienes alerté, ¿cuántos eran riesgo real?».{' '}
              <strong>Recall</strong> responde: «De todos los riesgos reales, ¿cuántos logré atrapar?». Bajar el umbral
              de alerta suele subir el Recall pero reduce la Precisión al generar más falsas alarmas (FP).
            </p>
          </article>

          <article className="bg-white border border-ivory-200 rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-bold text-navy-900">¿Por qué Accuracy engaña con desbalance?</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              En muestras donde el evento ocurre poco (como el preset <em>Sin alertas</em> o <em>Fraude</em>), predecir
              casi todo Negativo produce una Accuracy muy alta gracias al gran volumen de TN, aunque el Recall sea mínimo
              o cero.
            </p>
          </article>

          <article className="bg-white border border-ivory-200 rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-bold text-navy-900">Mayor FPR o mayor FNR = más error</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>FPR</strong> y <strong>FNR</strong> miden tasas de error, no de acierto. Un FPR alto implica más
              falsas alarmas sobre clientes sanos; un FNR alto significa más eventos positivos reales que pasan sin alerta.
            </p>
          </article>
        </div>
      </section>

      {/* Tarjetas detalladas de los 7 indicadores */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5" aria-label="Detalle de fórmulas y lectura bancaria">
        {INDICATORS_GUIDE.map((guide) => {
          const metric = summary.metrics[guide.key];
          const isErrorRate = guide.key === 'fpr' || guide.key === 'fnr';
          return (
            <article
              key={guide.key}
              className="bg-white border border-ivory-200 rounded-xl p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4 border-b border-ivory-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-navy-900">{guide.title}</h3>
                    <div className="font-mono text-xs text-slate-600 mt-0.5">{metric.formula}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono text-xl font-bold tabular-nums ${
                        !metric.defined
                          ? 'text-slate-500 text-base'
                          : isErrorRate
                            ? 'text-amber-700'
                            : 'text-teal-700'
                      }`}
                    >
                      {metric.formattedPercent}
                    </div>
                    {metric.defined && (
                      <div className="font-mono text-xs text-slate-500 tabular-nums">
                        ({metric.formattedDecimal})
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-ivory-50 border border-ivory-200 rounded-lg px-3 py-2 font-mono text-xs text-navy-900 tabular-nums break-words">
                  {metric.substitutionText}
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <p>
                    <strong className="text-navy-900">Explicación sencilla:</strong> {guide.simpleExplanation}
                  </p>
                  <p>
                    <strong className="text-navy-900">Lectura bancaria:</strong> {guide.bankingInterpretation}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-ivory-200 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-navy-900 block">Si es alto:</span>
                  {guide.whenHigh}
                </div>
                <div>
                  <span className="font-bold text-navy-900 block">Si es bajo:</span>
                  {guide.whenLow}
                </div>
                <div className="sm:col-span-2 bg-ivory-50 rounded-md p-2.5 text-slate-700">
                  <span className="font-bold text-navy-900">Limitación clave: </span>
                  {guide.limitations}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
