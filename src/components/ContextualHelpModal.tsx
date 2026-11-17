import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ContextualHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function ContextualHelpModal({ open, onClose }: ContextualHelpModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-navy-950/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-ivory-50 text-navy-900 h-full overflow-y-auto border-l border-ivory-200 p-6 shadow-2xl flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 border-b border-ivory-200 pb-4">
          <div>
            <p className="text-xs font-medium text-teal-700">Guía rápida · BancoLab</p>
            <h2 id="help-modal-title" className="text-xl font-bold text-navy-900 mt-1">
              Ayuda contextual y convenciones
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de ayuda"
            className="p-2 rounded-lg border border-ivory-200 bg-white text-navy-900 hover:bg-ivory-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-navy-900">1. Convención fija de la matriz 2×2</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            En toda la plataforma usamos la misma orientación para evitar ambigüedades:
            las <strong>filas</strong> representan el estado <strong>REAL observado</strong> (arriba Positivo, abajo Negativo)
            y las <strong>columnas</strong> representan lo <strong>PREDICHO por el modelo</strong> (izquierda Positivo, derecha Negativo).
          </p>
          <div className="bg-white border border-ivory-200 rounded-lg p-3 font-mono text-xs tabular-nums text-navy-900">
            <div>Fila 1 (Real Positivo): [ TP | FN ]</div>
            <div>Fila 2 (Real Negativo): [ FP | TN ]</div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-navy-900">2. Regla sobre denominadores en cero</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            Cuando una suma marginal vale cero (por ejemplo, si el modelo no emite alertas y{' '}
            <code className="font-mono text-xs bg-ivory-100 px-1 py-0.5 rounded">TP + FP = 0</code>),
            la métrica correspondiente muestra <strong>No definido</strong> junto con el motivo matemático exacto.
            Nunca se reemplaza por cero engañoso ni por <code className="font-mono text-xs">NaN</code>.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-navy-900">3. Flujo recomendado de estudio</h3>
          <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
            <li><strong>Introducción y Escenarios:</strong> comprende cómo nace la matriz desde registros reales y predichos.</li>
            <li><strong>Componentes:</strong> haz clic o usa flechas del teclado sobre TP, TN, FP y FN para revisar su impacto en crédito.</li>
            <li><strong>Simulador e Indicadores:</strong> prueba los presets (especialmente <em>Sin alertas</em> y <em>Fraude</em>) para observar la trampa de Accuracy.</li>
            <li><strong>Impacto económico:</strong> compara modelos con costos en COP, restricción de FNR máximo y punto de equilibrio.</li>
            <li><strong>Evaluación:</strong> resuelve las 12 preguntas con retroalimentación inmediata y operación explícita.</li>
          </ul>
        </section>

        <section className="bg-ivory-100 border border-ivory-200 rounded-lg p-4 space-y-1.5">
          <h3 className="text-sm font-bold text-navy-900">Alcance educativo</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Todos los datos, registros y costos unitarios en COP son hipotéticos y sintéticos.
            Esta herramienta es estrictamente educativa: no aprueba ni rechaza créditos reales ni constituye un cálculo regulatorio de pérdida esperada.
          </p>
        </section>
      </div>
    </div>
  );
}
