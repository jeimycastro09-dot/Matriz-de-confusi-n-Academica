import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfusionMatrixTable } from '../components/ConfusionMatrixTable';
import { SCENARIOS } from '../data/scenariosData';
import type { CellKey, ConfusionMatrix, ScenarioId } from '../types/bankolab';
import { classifyRecord, computeMatrixFromRecords, computeMatrixSummary } from '../utils/metrics';

interface ScenariosModuleProps {
  onSendMatrixToSimulator: (matrix: ConfusionMatrix) => void;
}

const SCENARIO_ORDER: ScenarioId[] = ['credito', 'fraude', 'liquidez', 'retencion'];

const CELL_LABELS: Record<CellKey, string> = {
  tp: 'TP',
  fn: 'FN',
  fp: 'FP',
  tn: 'TN',
};

export function ScenariosModule({ onSendMatrixToSimulator }: ScenariosModuleProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('credito');
  const [filterCell, setFilterCell] = useState<CellKey | 'all'>('all');

  const scenario = SCENARIOS[selectedScenario];

  // Matriz derivada deterministamente desde la tabla completa de registros del escenario
  const derivedMatrix = useMemo(
    () => computeMatrixFromRecords(scenario.records),
    [scenario.records],
  );

  const summary = useMemo(() => computeMatrixSummary(derivedMatrix), [derivedMatrix]);

  const filteredRecords = useMemo(() => {
    if (filterCell === 'all') return scenario.records;
    return scenario.records.filter((r) => classifyRecord(r) === filterCell);
  }, [filterCell, scenario.records]);

  return (
    <div className="space-y-8">
      <header className="border-b border-ivory-200 pb-5">
        <p className="text-xs font-medium text-teal-700">Módulo 2 · Aplicaciones bancarias</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
              Escenarios bancarios con datos sintéticos
            </h1>
            <p className="text-sm sm:text-base text-slate-700 mt-2 max-w-3xl leading-relaxed">
              Explora cómo cambia la unidad de análisis, el horizonte temporal y la definición del evento positivo según el
              proceso bancario. Cada matriz se calcula directamente a partir de su tabla sintética.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center gap-1 p-1 bg-ivory-100 rounded-lg border border-ivory-200 shrink-0"
            role="tablist"
            aria-label="Selector de escenario bancario"
          >
            {SCENARIO_ORDER.map((id) => {
              const item = SCENARIOS[id];
              const active = id === selectedScenario;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedScenario(id);
                    setFilterCell('all');
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-900 hover:bg-white'
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Ficha del escenario */}
      <section className="bg-white border border-ivory-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ivory-200 pb-4">
          <div>
            <p className="text-xs font-medium text-slate-600">{scenario.subtitle} · Muestra sintética educativa</p>
            <h2 className="text-xl font-bold text-navy-900 mt-0.5">{scenario.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => onSendMatrixToSimulator(derivedMatrix)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-600 transition-colors whitespace-nowrap shrink-0"
          >
            Llevar matriz al Simulador
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-600">Unidad de análisis</div>
            <div className="font-semibold text-navy-900">{scenario.unit}</div>
          </div>
          <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-600">Horizonte</div>
            <div className="font-semibold text-navy-900">{scenario.horizon}</div>
          </div>
          <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-4 space-y-1">
            <div className="text-xs font-semibold text-teal-800">Evento Positivo (1)</div>
            <div className="font-semibold text-navy-900">{scenario.positiveLabel}</div>
            <p className="text-xs text-slate-700">{scenario.positiveMeaning}</p>
          </div>
          <div className="bg-[#F6F3EC] border border-ivory-200 rounded-lg p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-600">Evento Negativo (0)</div>
            <div className="font-semibold text-navy-900">{scenario.negativeLabel}</div>
            <p className="text-xs text-slate-700">{scenario.negativeMeaning}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div className="space-y-1">
            <h3 className="font-bold text-navy-900">Problema de negocio</h3>
            <p className="text-slate-700 leading-relaxed">{scenario.problem}</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-navy-900">Objetivo operativo del modelo</h3>
            <p className="text-slate-700 leading-relaxed">{scenario.objective}</p>
          </div>
        </div>
      </section>

      {/* Matriz calculada + Lectura financiera */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-6 bg-white border border-ivory-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-navy-900">
              Matriz calculada desde la tabla ({scenario.records.length} registros)
            </h3>
            <span className="text-xs text-slate-600 tabular-nums">
              Prevalencia: {summary.metrics.prevalence.formattedPercent}
            </span>
          </div>

          <ConfusionMatrixTable
            matrix={derivedMatrix}
            positiveLabel={scenario.positiveLabel}
            negativeLabel={scenario.negativeLabel}
            compact
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
              <div className="text-xs text-slate-600">Accuracy</div>
              <div className="font-mono font-bold text-navy-900 tabular-nums mt-0.5">
                {summary.metrics.accuracy.formattedPercent}
              </div>
            </div>
            <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
              <div className="text-xs text-slate-600">Precision</div>
              <div className="font-mono font-bold text-navy-900 tabular-nums mt-0.5">
                {summary.metrics.precision.formattedPercent}
              </div>
            </div>
            <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
              <div className="text-xs text-slate-600">Recall</div>
              <div className="font-mono font-bold text-navy-900 tabular-nums mt-0.5">
                {summary.metrics.recall.formattedPercent}
              </div>
            </div>
            <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
              <div className="text-xs text-slate-600">F1-Score</div>
              <div className="font-mono font-bold text-navy-900 tabular-nums mt-0.5">
                {summary.metrics.f1.formattedPercent}
              </div>
            </div>
          </div>

          <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-4 space-y-1">
            <h4 className="text-xs font-bold text-navy-900">Lectura financiera del escenario</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{scenario.financialReading}</p>
          </div>
        </div>

        {/* Tabla completa de registros reales vs predichos */}
        <div className="xl:col-span-6 bg-white border border-ivory-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-navy-900">
              Tabla sintética de casos ({filteredRecords.length} visibles)
            </h3>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-ivory-100 rounded-lg" role="group" aria-label="Filtrar casos por celda">
              {(['all', 'tp', 'fn', 'fp', 'tn'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterCell(key)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    filterCell === key ? 'bg-navy-900 text-white' : 'text-navy-900 hover:bg-white'
                  }`}
                >
                  {key === 'all' ? 'Todos' : CELL_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[440px] overflow-y-auto border border-ivory-200 rounded-lg">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-navy-900 text-ivory-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Registro</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-right">Score</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Real</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Predicho</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Celda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 bg-white">
                {filteredRecords.map((rec) => {
                  const cell = classifyRecord(rec);
                  return (
                    <tr key={rec.id} className="hover:bg-ivory-50">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-navy-900">{rec.label}</div>
                        <div className="text-xs text-slate-600">{rec.detail}</div>
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-right">{rec.score.toFixed(2)}</td>
                      <td className="px-3 py-2">{rec.actual ? 'Positivo' : 'Negativo'}</td>
                      <td className="px-3 py-2">{rec.predicted ? 'Positivo' : 'Negativo'}</td>
                      <td className="px-3 py-2 font-mono font-bold">
                        <span
                          className={
                            cell === 'tp'
                              ? 'text-teal-700'
                              : cell === 'fn'
                                ? 'text-red-700'
                                : cell === 'fp'
                                  ? 'text-amber-700'
                                  : 'text-navy-800'
                          }
                        >
                          {cell.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
