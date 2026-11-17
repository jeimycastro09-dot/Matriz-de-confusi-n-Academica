import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfusionMatrixTable } from '../components/ConfusionMatrixTable';
import {
  INTRO_12_RECORDS,
  MULTICLASS_RISK_LABELS,
  MULTICLASS_RISK_MATRIX,
} from '../data/introData';
import type { CellKey } from '../types/bankolab';
import { formatInt } from '../utils/format';
import {
  classifyRecord,
  computeMatrixFromRecords,
  computeMatrixSummary,
  oneVsRestFromMulticlass,
} from '../utils/metrics';

const CELL_BADGE_TEXT: Record<CellKey, string> = {
  tp: 'TP · Verdadero Positivo',
  fn: 'FN · Falso Negativo',
  fp: 'FP · Falso Positivo',
  tn: 'TN · Verdadero Negativo',
};

const CELL_TEXT_COLOR: Record<CellKey, string> = {
  tp: 'text-teal-700 font-semibold',
  fn: 'text-red-700 font-semibold',
  fp: 'text-amber-700 font-semibold',
  tn: 'text-navy-800 font-semibold',
};

export function IntroductionModule() {
  const [step, setStep] = useState<number>(12);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [ovrClassIndex, setOvrClassIndex] = useState<number>(2);

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= INTRO_12_RECORDS.length) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setStep((prev) => Math.min(INTRO_12_RECORDS.length, prev + 1));
    }, 850);
    return () => window.clearTimeout(timer);
  }, [isPlaying, step]);

  const visibleRecords = useMemo(() => INTRO_12_RECORDS.slice(0, step), [step]);
  const cumulativeMatrix = useMemo(() => computeMatrixFromRecords(visibleRecords), [visibleRecords]);
  const activeRecord = step > 0 ? INTRO_12_RECORDS[step - 1] : null;
  const activeCell = activeRecord ? classifyRecord(activeRecord) : null;

  const ovrMatrix = useMemo(
    () => oneVsRestFromMulticlass(MULTICLASS_RISK_MATRIX, ovrClassIndex),
    [ovrClassIndex],
  );
  const ovrSummary = useMemo(() => computeMatrixSummary(ovrMatrix), [ovrMatrix]);

  return (
    <div className="space-y-8">
      <header className="border-b border-ivory-200 pb-5">
        <p className="text-xs font-medium text-teal-700">Módulo 1 · Fundamentos</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
          ¿Qué es una matriz de confusión y cómo se construye?
        </h1>
        <p className="text-sm sm:text-base text-slate-700 mt-2 max-w-3xl leading-relaxed">
          Es una tabla de doble entrada que cruza el resultado <strong>real observado</strong> contra lo{' '}
          <strong>predicho por un modelo</strong>. En banca permite distinguir no solo cuántos aciertos hubo, sino
          qué tipo de errores se cometen al evaluar riesgo de crédito, fraude, liquidez o retención.
        </p>
      </header>

      {/* Conceptos base */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-label="Conceptos fundamentales">
        <article className="bg-white border border-ivory-200 rounded-xl p-5 space-y-2">
          <h2 className="text-base font-bold text-navy-900">Real observado vs. Predicho</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            La predicción ocurre al momento de decidir (por ejemplo, una puntuación de alerta). El estado real se confirma
            después de transcurrido el horizonte de observación (por ejemplo, si hubo incumplimiento a 12 meses).
          </p>
        </article>

        <article className="bg-white border border-ivory-200 rounded-xl p-5 space-y-2">
          <h2 className="text-base font-bold text-navy-900">Convención fija de ejes</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Usamos siempre: <strong>Filas = REAL</strong> (Positivo arriba, Negativo abajo) y{' '}
            <strong>Columnas = PREDICHO</strong> (Positivo izquierda, Negativo derecha). Así la matriz queda{' '}
            <code className="font-mono text-xs bg-ivory-100 px-1.5 py-0.5 rounded">[[TP, FN], [FP, TN]]</code>.
          </p>
        </article>

        <article className="bg-white border border-ivory-200 rounded-xl p-5 space-y-2">
          <h2 className="text-base font-bold text-navy-900">Binaria vs. Multiclase</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            En clasificación binaria existen dos estados (Positivo/Negativo, matriz 2×2). En multiclase hay tres o más
            categorías (ej. riesgo Bajo, Medio, Alto) y puede analizarse por clase con la técnica{' '}
            <strong>Uno contra Resto</strong>.
          </p>
        </article>
      </section>

      {/* Construcción paso a paso */}
      <section className="bg-white border border-ivory-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-ivory-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-navy-900">
              Construcción paso a paso con 12 solicitudes sintéticas
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Avanza registro por registro para observar cómo cada caso observado y predicho alimenta la matriz acumulada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStep(0);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-ivory-200 bg-ivory-50 text-navy-900 hover:bg-ivory-100 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reiniciar (0)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStep((s) => Math.max(0, s - 1));
              }}
              disabled={step <= 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-ivory-200 bg-white text-navy-900 hover:bg-ivory-50 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <SkipBack className="w-3.5 h-3.5" aria-hidden="true" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => {
                if (step >= INTRO_12_RECORDS.length) {
                  setStep(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying((p) => !p);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-600 whitespace-nowrap shrink-0"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" aria-hidden="true" /> : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
              {isPlaying ? 'Pausar' : step >= INTRO_12_RECORDS.length ? 'Reproducir desde 0' : 'Autoavanzar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStep((s) => Math.min(INTRO_12_RECORDS.length, s + 1));
              }}
              disabled={step >= INTRO_12_RECORDS.length}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-ivory-200 bg-white text-navy-900 hover:bg-ivory-50 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              Siguiente
              <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Estado paso actual */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ivory-50 border border-ivory-200 rounded-lg px-4 py-3 text-sm">
          <div className="font-medium text-navy-900 tabular-nums">
            Paso actual: <span className="font-mono font-bold">{step}</span> / {INTRO_12_RECORDS.length} registros incorporados
          </div>
          {activeRecord && activeCell ? (
            <div className="text-xs sm:text-sm text-slate-700">
              Último registro: <strong>{activeRecord.id}</strong> (Real:{' '}
              <strong>{activeRecord.actual ? 'Positivo' : 'Negativo'}</strong>, Predicho:{' '}
              <strong>{activeRecord.predicted ? 'Positivo' : 'Negativo'}</strong>) →{' '}
              <span className={CELL_TEXT_COLOR[activeCell]}>{CELL_BADGE_TEXT[activeCell]}</span>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-slate-600">
              Matriz vacía (0 registros). Pulsa <strong>Siguiente</strong> o haz clic en una fila para iniciar.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Tabla de 12 registros */}
          <div className="xl:col-span-7 overflow-x-auto border border-ivory-200 rounded-lg">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-navy-900 text-ivory-50">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">#</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Solicitud sintética</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold text-right">Score</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Real</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Predicho</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Celda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 bg-white">
                {INTRO_12_RECORDS.map((rec, idx) => {
                  const included = idx < step;
                  const isCurrent = idx === step - 1;
                  const cell = classifyRecord(rec);
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => {
                        setIsPlaying(false);
                        setStep(idx + 1);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-teal-50/90'
                          : included
                            ? 'bg-white hover:bg-ivory-50'
                            : 'bg-ivory-50/50 text-slate-400 hover:bg-ivory-100/60'
                      }`}
                    >
                      <td className="px-3 py-2 font-mono tabular-nums font-medium">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-navy-900">{rec.id}</div>
                        <div className="text-xs text-slate-600">{rec.detail}</div>
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-right">{rec.score.toFixed(2)}</td>
                      <td className="px-3 py-2">{rec.actual ? 'Positivo' : 'Negativo'}</td>
                      <td className="px-3 py-2">{rec.predicted ? 'Positivo' : 'Negativo'}</td>
                      <td className="px-3 py-2">
                        {included ? (
                          <span className={CELL_TEXT_COLOR[cell]}>{cell.toUpperCase()}</span>
                        ) : (
                          <span className="text-slate-400">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Matriz acumulativa */}
          <div className="xl:col-span-5 space-y-4">
            <div className="bg-ivory-50 border border-ivory-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-navy-900 mb-3">
                Matriz de confusión acumulada (Paso {step})
              </h3>
              <ConfusionMatrixTable
                matrix={cumulativeMatrix}
                positiveLabel="Incumple"
                negativeLabel="Cumple"
                highlightedCell={activeCell}
                compact
              />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Observa cómo la suma de las cuatro celdas siempre coincide con el número de registros incorporados (
              <span className="font-mono tabular-nums font-semibold">N = {step}</span>). Haz clic sobre cualquier fila de la
              tabla izquierda para saltar directamente a ese paso.
            </p>
          </div>
        </div>
      </section>

      {/* Multiclase 3x3 y Uno contra Resto */}
      <section className="bg-white border border-ivory-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-ivory-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-navy-900">
              Clasificación multiclase (3×3) y análisis Uno contra Resto
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              En segmentación de riesgo (Bajo, Medio, Alto), la diagonal principal reúne los aciertos. Selecciona una clase
              objetivo para colapsar la matriz 3×3 en una matriz binaria 2×2.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-ivory-100 rounded-lg" role="group" aria-label="Selector Uno contra Resto">
            {MULTICLASS_RISK_LABELS.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setOvrClassIndex(idx)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  ovrClassIndex === idx
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-navy-900 hover:bg-white/70'
                }`}
              >
                {label} vs. Resto
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-6 overflow-x-auto">
            <h3 className="text-sm font-bold text-navy-900 mb-3">
              Matriz 3×3 sintética (N = 1.000 clientes)
            </h3>
            <table className="w-full border-separate border-spacing-1.5 text-xs sm:text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-slate-600 font-semibold">Real \ Predicho</th>
                  {MULTICLASS_RISK_LABELS.map((lbl) => (
                    <th key={lbl} className="p-2 text-center bg-navy-900 text-ivory-50 rounded-md font-medium">
                      {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MULTICLASS_RISK_MATRIX.map((row, rIdx) => (
                  <tr key={MULTICLASS_RISK_LABELS[rIdx]}>
                    <th className="p-2 text-left bg-ivory-100 text-navy-900 rounded-md font-semibold">
                      {MULTICLASS_RISK_LABELS[rIdx]}
                    </th>
                    {row.map((val, cIdx) => {
                      const isActual = rIdx === ovrClassIndex;
                      const isPred = cIdx === ovrClassIndex;
                      let roleTag = 'TN';
                      let cellClass = 'bg-[#F6F3EC] border-ivory-200';
                      if (isActual && isPred) {
                        roleTag = 'TP';
                        cellClass = 'bg-teal-50 border-teal-300';
                      } else if (isActual && !isPred) {
                        roleTag = 'FN';
                        cellClass = 'bg-red-50 border-red-200';
                      } else if (!isActual && isPred) {
                        roleTag = 'FP';
                        cellClass = 'bg-amber-50 border-amber-200';
                      }
                      return (
                        <td
                          key={`${rIdx}-${cIdx}`}
                          className={`p-3 rounded-lg border text-center ${cellClass}`}
                        >
                          <div className="font-mono font-bold text-base tabular-nums text-navy-900">
                            {formatInt(val)}
                          </div>
                          <div className="text-[11px] font-medium text-slate-600 mt-0.5">
                            Mapea a {roleTag}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="xl:col-span-6 space-y-4">
            <div className="bg-ivory-50 border border-ivory-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-navy-900 mb-3">
                Colapso 2×2 · {MULTICLASS_RISK_LABELS[ovrClassIndex]} como Positivo
              </h3>
              <ConfusionMatrixTable
                matrix={ovrMatrix}
                positiveLabel={MULTICLASS_RISK_LABELS[ovrClassIndex]}
                negativeLabel="Resto de clases"
                compact
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
                <div className="text-xs text-slate-600">Precisión clase</div>
                <div className="font-mono font-bold text-base text-navy-900 tabular-nums mt-1">
                  {ovrSummary.metrics.precision.formattedPercent}
                </div>
              </div>
              <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
                <div className="text-xs text-slate-600">Recall clase</div>
                <div className="font-mono font-bold text-base text-navy-900 tabular-nums mt-1">
                  {ovrSummary.metrics.recall.formattedPercent}
                </div>
              </div>
              <div className="bg-ivory-50 border border-ivory-200 rounded-lg p-3">
                <div className="text-xs text-slate-600">F1 clase</div>
                <div className="font-mono font-bold text-base text-navy-900 tabular-nums mt-1">
                  {ovrSummary.metrics.f1.formattedPercent}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
