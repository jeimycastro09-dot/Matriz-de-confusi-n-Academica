import { Download, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Data, Layout } from 'plotly.js';
import { PlotlyChart } from '../components/PlotlyChart';
import type { ConfusionMatrix } from '../types/bankolab';
import { formatInt, formatPercent, sanitizeNonNegativeInt } from '../utils/format';
import {
  buildMatrixCsv,
  computeMatrixSummary,
  DEFAULT_BALANCED_MATRIX,
  generateMatrixInterpretation,
  MATRIX_PRESETS,
} from '../utils/metrics';

interface SimulatorModuleProps {
  matrix: ConfusionMatrix;
  onChangeMatrix: (next: ConfusionMatrix) => void;
}

type HeatmapMode = 'absoluto' | 'fila' | 'total';

export function SimulatorModule({ matrix, onChangeMatrix }: SimulatorModuleProps) {
  const [mode, setMode] = useState<HeatmapMode>('absoluto');

  const summary = useMemo(() => computeMatrixSummary(matrix), [matrix]);
  const interpretations = useMemo(
    () => generateMatrixInterpretation(summary, matrix),
    [summary, matrix],
  );

  const handleFieldChange = (field: keyof ConfusionMatrix, rawValue: string) => {
    onChangeMatrix({
      ...matrix,
      [field]: sanitizeNonNegativeInt(rawValue),
    });
  };

  const handleExportCsv = () => {
    const csv = buildMatrixCsv(matrix, summary, 'Simulador interactivo');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bancolab_matriz_confusion.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const heatmapConfig = useMemo(() => {
    const rowPosSum = matrix.tp + matrix.fn;
    const rowNegSum = matrix.fp + matrix.tn;
    const total = summary.total;

    const pctTotal = (val: number) => (total > 0 ? val / total : null);
    const pctRowPos = (val: number) => (rowPosSum > 0 ? val / rowPosSum : null);
    const pctRowNeg = (val: number) => (rowNegSum > 0 ? val / rowNegSum : null);

    let zValues: number[][];
    let textGrid: string[][];
    let zMax = 1;
    let subtitle = '';

    if (mode === 'absoluto') {
      zValues = [
        [matrix.tp, matrix.fn],
        [matrix.fp, matrix.tn],
      ];
      zMax = Math.max(matrix.tp, matrix.fn, matrix.fp, matrix.tn, 1);
      textGrid = [
        [
          `TP<br><b>${formatInt(matrix.tp)}</b><br>(${formatPercent(pctTotal(matrix.tp))})`,
          `FN<br><b>${formatInt(matrix.fn)}</b><br>(${formatPercent(pctTotal(matrix.fn))})`,
        ],
        [
          `FP<br><b>${formatInt(matrix.fp)}</b><br>(${formatPercent(pctTotal(matrix.fp))})`,
          `TN<br><b>${formatInt(matrix.tn)}</b><br>(${formatPercent(pctTotal(matrix.tn))})`,
        ],
      ];
      subtitle = `Modo Absoluto · Cantidades exactas y porcentaje sobre N = ${formatInt(total)}`;
    } else if (mode === 'fila') {
      const tpR = pctRowPos(matrix.tp);
      const fnR = pctRowPos(matrix.fn);
      const fpR = pctRowNeg(matrix.fp);
      const tnR = pctRowNeg(matrix.tn);
      zValues = [
        [tpR !== null ? tpR * 100 : 0, fnR !== null ? fnR * 100 : 0],
        [fpR !== null ? fpR * 100 : 0, tnR !== null ? tnR * 100 : 0],
      ];
      zMax = 100;
      textGrid = [
        [
          `TP (Recall)<br><b>${formatPercent(tpR)}</b><br>${formatInt(matrix.tp)} / ${formatInt(rowPosSum)}`,
          `FN (FNR)<br><b>${formatPercent(fnR)}</b><br>${formatInt(matrix.fn)} / ${formatInt(rowPosSum)}`,
        ],
        [
          `FP (FPR)<br><b>${formatPercent(fpR)}</b><br>${formatInt(matrix.fp)} / ${formatInt(rowNegSum)}`,
          `TN (Spec.)<br><b>${formatPercent(tnR)}</b><br>${formatInt(matrix.tn)} / ${formatInt(rowNegSum)}`,
        ],
      ];
      subtitle = `Modo Por fila · Denominadores por clase real (Fila 1: TP+FN = ${formatInt(rowPosSum)}; Fila 2: FP+TN = ${formatInt(rowNegSum)})`;
    } else {
      const tpT = pctTotal(matrix.tp);
      const fnT = pctTotal(matrix.fn);
      const fpT = pctTotal(matrix.fp);
      const tnT = pctTotal(matrix.tn);
      zValues = [
        [tpT !== null ? tpT * 100 : 0, fnT !== null ? fnT * 100 : 0],
        [fpT !== null ? fpT * 100 : 0, tnT !== null ? tnT * 100 : 0],
      ];
      zMax = 100;
      textGrid = [
        [
          `TP<br><b>${formatPercent(tpT)}</b><br>${formatInt(matrix.tp)} / ${formatInt(total)}`,
          `FN<br><b>${formatPercent(fnT)}</b><br>${formatInt(matrix.fn)} / ${formatInt(total)}`,
        ],
        [
          `FP<br><b>${formatPercent(fpT)}</b><br>${formatInt(matrix.fp)} / ${formatInt(total)}`,
          `TN<br><b>${formatPercent(tnT)}</b><br>${formatInt(matrix.tn)} / ${formatInt(total)}`,
        ],
      ];
      subtitle = `Modo Sobre el total · Denominador común N = ${formatInt(total)}`;
    }

    const data: Data[] = [
      {
        type: 'heatmap',
        x: ['Predicho: Positivo', 'Predicho: Negativo'],
        y: ['Real: Positivo', 'Real: Negativo'],
        z: zValues,
        zmin: 0,
        zmax: zMax,
        text: textGrid as unknown as string[],
        texttemplate: '%{text}',
        textfont: {
          family: '"IBM Plex Mono", monospace',
          size: 13,
          color: '#0F1F38',
        },
        hovertemplate: '%{y} · %{x}<br>%{text}<extra></extra>',
        colorscale: [
          [0, '#FAF8F4'],
          [0.35, '#CCFBF1'],
          [0.7, '#5EEAD4'],
          [1, '#0D9488'],
        ],
        showscale: true,
        colorbar: {
          title: { text: mode === 'absoluto' ? 'Casos' : '%' },
          thickness: 14,
        },
        xgap: 4,
        ygap: 4,
      },
    ];

    const layout: Partial<Layout> = {
      margin: { t: 28, r: 24, b: 56, l: 135 },
      xaxis: {
        side: 'top',
        tickfont: { size: 12, color: '#0F1F38' },
      },
      yaxis: {
        autorange: 'reversed',
        tickfont: { size: 12, color: '#0F1F38' },
      },
    };

    return { data, layout, subtitle };
  }, [matrix, mode, summary.total]);

  return (
    <div className="space-y-8">
      <header className="border-b border-ivory-200 pb-5">
        <p className="text-xs font-medium text-teal-700">Módulo 4 · Laboratorio interactivo</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
              Simulador de matriz de confusión
            </h1>
            <p className="text-sm sm:text-base text-slate-700 mt-2 max-w-3xl leading-relaxed">
              Modifica los conteos enteros (≥ 0) o carga un escenario preconfigurado. Tu configuración se conserva al
              navegar hacia Indicadores o Componentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onChangeMatrix(DEFAULT_BALANCED_MATRIX)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-ivory-200 bg-white text-navy-900 hover:bg-ivory-100 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Restablecer
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Exportar CSV
            </button>
          </div>
        </div>
      </header>

      {/* Presets */}
      <section className="space-y-2" aria-label="Escenarios preconfigurados">
        <div className="text-xs font-semibold text-slate-600">Escenarios preconfigurados</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Object.values(MATRIX_PRESETS).map((preset) => {
            const isCurrent =
              matrix.tp === preset.matrix.tp &&
              matrix.tn === preset.matrix.tn &&
              matrix.fp === preset.matrix.fp &&
              matrix.fn === preset.matrix.fn;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeMatrix(preset.matrix)}
                className={`text-left rounded-xl p-3.5 border transition-colors ${
                  isCurrent
                    ? 'bg-teal-50/70 border-teal-600'
                    : 'bg-white border-ivory-200 hover:bg-ivory-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-navy-900">{preset.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-600">
                    {preset.matrix.tp}/{preset.matrix.fn}/{preset.matrix.fp}/{preset.matrix.tn}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-snug">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Entradas + Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Panel de edición */}
        <section className="xl:col-span-5 bg-white border border-ivory-200 rounded-xl p-5 space-y-5">
          <h2 className="text-base font-bold text-navy-900">Edición directa de celdas (enteros ≥ 0)</h2>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-teal-800">
                TP · Verdadero Positivo
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={matrix.tp}
                onChange={(e) => handleFieldChange('tp', e.target.value)}
                className="w-full rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 font-mono text-base font-semibold tabular-nums text-navy-900"
              />
              <span className="block text-[11px] text-slate-600">Real + / Predicho +</span>
            </label>

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-red-800">
                FN · Falso Negativo
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={matrix.fn}
                onChange={(e) => handleFieldChange('fn', e.target.value)}
                className="w-full rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 font-mono text-base font-semibold tabular-nums text-navy-900"
              />
              <span className="block text-[11px] text-slate-600">Real + / Predicho −</span>
            </label>

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-amber-800">
                FP · Falso Positivo
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={matrix.fp}
                onChange={(e) => handleFieldChange('fp', e.target.value)}
                className="w-full rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 font-mono text-base font-semibold tabular-nums text-navy-900"
              />
              <span className="block text-[11px] text-slate-600">Real − / Predicho +</span>
            </label>

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-navy-800">
                TN · Verdadero Negativo
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={matrix.tn}
                onChange={(e) => handleFieldChange('tn', e.target.value)}
                className="w-full rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 font-mono text-base font-semibold tabular-nums text-navy-900"
              />
              <span className="block text-[11px] text-slate-600">Real − / Predicho −</span>
            </label>
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3 pt-2 border-t border-ivory-200">
            <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
              <div className="text-xs text-slate-600">Total casos (N)</div>
              <div className="font-mono font-bold text-lg text-navy-900 tabular-nums">
                {formatInt(summary.total)}
              </div>
            </div>
            <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
              <div className="text-xs text-slate-600">Prevalencia real</div>
              <div className="font-mono font-bold text-lg text-navy-900 tabular-nums">
                {summary.metrics.prevalence.formattedPercent}
              </div>
            </div>
            <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-3">
              <div className="text-xs text-teal-800">Aciertos (TP + TN)</div>
              <div className="font-mono font-bold text-lg text-navy-900 tabular-nums">
                {formatInt(summary.correct)}
              </div>
            </div>
            <div className="bg-red-50/70 border border-red-200 rounded-lg p-3">
              <div className="text-xs text-red-800">Errores (FP + FN)</div>
              <div className="font-mono font-bold text-lg text-navy-900 tabular-nums">
                {formatInt(summary.errors)}
              </div>
            </div>
          </div>

          {/* Interpretación automática */}
          <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-bold text-navy-900">Interpretación automática de la matriz</h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc pl-4">
              {interpretations.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mapa de calor Plotly */}
        <section className="xl:col-span-7 bg-white border border-ivory-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-navy-900">Mapa de calor (Plotly.js)</h2>
              <p className="text-xs text-slate-600 mt-0.5 tabular-nums">{heatmapConfig.subtitle}</p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-ivory-100 rounded-lg border border-ivory-200 shrink-0" role="group" aria-label="Modo de visualización del mapa de calor">
              {(
                [
                  { id: 'absoluto', label: 'Absoluto' },
                  { id: 'fila', label: 'Por fila' },
                  { id: 'total', label: 'Sobre total' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    mode === opt.id ? 'bg-navy-900 text-white' : 'text-navy-900 hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <PlotlyChart
            data={heatmapConfig.data}
            layout={heatmapConfig.layout}
            className="w-full h-[360px]"
            ariaLabel="Mapa de calor de la matriz de confusión con ejes Real y Predicho"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-ivory-200 text-xs">
            <div>
              <span className="text-slate-600 block">Accuracy</span>
              <span className="font-mono font-bold text-sm text-navy-900 tabular-nums">
                {summary.metrics.accuracy.formattedPercent}
              </span>
            </div>
            <div>
              <span className="text-slate-600 block">Precision</span>
              <span className="font-mono font-bold text-sm text-navy-900 tabular-nums">
                {summary.metrics.precision.formattedPercent}
              </span>
            </div>
            <div>
              <span className="text-slate-600 block">Recall</span>
              <span className="font-mono font-bold text-sm text-navy-900 tabular-nums">
                {summary.metrics.recall.formattedPercent}
              </span>
            </div>
            <div>
              <span className="text-slate-600 block">F1-Score</span>
              <span className="font-mono font-bold text-sm text-navy-900 tabular-nums">
                {summary.metrics.f1.formattedPercent}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
