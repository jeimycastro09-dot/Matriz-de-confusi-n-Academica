import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { ConfusionMatrixTable } from '../components/ConfusionMatrixTable';
import { CELL_COMPONENTS } from '../data/componentsData';
import type { CellKey, ConfusionMatrix } from '../types/bankolab';

interface ComponentsModuleProps {
  matrix: ConfusionMatrix;
}

export function ComponentsModule({ matrix }: ComponentsModuleProps) {
  const [selectedCell, setSelectedCell] = useState<CellKey>('tp');
  const info = CELL_COMPONENTS[selectedCell];

  const ToneIcon =
    info.tone === 'positive'
      ? CheckCircle2
      : info.tone === 'warning'
        ? AlertTriangle
        : info.tone === 'danger'
          ? ShieldAlert
          : Info;

  const toneHeaderStyle =
    info.tone === 'positive'
      ? 'bg-teal-50 border-teal-200 text-teal-900'
      : info.tone === 'warning'
        ? 'bg-amber-50 border-amber-200 text-amber-950'
        : info.tone === 'danger'
          ? 'bg-red-50 border-red-200 text-red-950'
          : 'bg-ivory-100 border-ivory-200 text-navy-900';

  return (
    <div className="space-y-8">
      <header className="border-b border-ivory-200 pb-5">
        <p className="text-xs font-medium text-teal-700">Módulo 3 · Anatomía de la matriz</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
          Componentes interactivos: TP, TN, FP y FN
        </h1>
        <p className="text-sm sm:text-base text-slate-700 mt-2 max-w-3xl leading-relaxed">
          Haz clic sobre cualquier celda de la matriz (o navega con Tab y las flechas del teclado) para inspeccionar su
          significado estadístico, su lectura en riesgo de crédito y las decisiones humanas posibles.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-6 bg-white border border-ivory-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-navy-900">
              Selecciona una celda (valores actuales del simulador)
            </h2>
          </div>

          <ConfusionMatrixTable
            matrix={matrix}
            positiveLabel="Incumplimiento"
            negativeLabel="Pago cumplido"
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
          />

          <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Acceso directo a celdas">
            {(['tp', 'fn', 'fp', 'tn'] as CellKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCell(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  selectedCell === key
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-ivory-50 text-navy-900 border-ivory-200 hover:bg-ivory-100'
                }`}
              >
                Ver {key.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <section
          className="xl:col-span-6 bg-white border border-ivory-200 rounded-xl p-5 sm:p-6 space-y-5"
          aria-live="polite"
        >
          <div className={`border rounded-lg p-4 flex items-start gap-3 ${toneHeaderStyle}`}>
            <ToneIcon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-xs font-semibold opacity-80">{info.axisCoordinates}</div>
              <h2 className="text-xl font-bold mt-0.5">{info.name}</h2>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-bold text-navy-900">Definición estadística</h3>
              <p className="text-slate-700 mt-1 leading-relaxed">{info.statisticalDefinition}</p>
            </div>

            <div>
              <h3 className="font-bold text-navy-900">Interpretación bancaria en crédito</h3>
              <p className="text-slate-700 mt-1 leading-relaxed">{info.creditInterpretation}</p>
            </div>

            <div>
              <h3 className="font-bold text-navy-900">Consecuencia operativa y financiera</h3>
              <p className="text-slate-700 mt-1 leading-relaxed">{info.consequence}</p>
            </div>

            <div>
              <h3 className="font-bold text-navy-900">Decisiones posibles en el flujo</h3>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                {info.possibleDecisions.map((dec) => (
                  <li key={dec}>{dec}</li>
                ))}
              </ul>
            </div>

            <div className="bg-ivory-100 border border-ivory-200 rounded-lg p-4">
              <h3 className="text-xs font-bold text-navy-900">Criterio de gobernanza y revisión humana</h3>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                La predicción del modelo es una señal estadística de apoyo: <strong>no obliga por sí sola a aprobar ni a
                rechazar</strong> una operación. Toda decisión final debe considerar políticas de crédito, capacidad de pago
                verificada y revisión humana en casos límite o con impacto relevante.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
