import type { CellKey, ConfusionMatrix } from '../types/bankolab';
import { formatInt } from '../utils/format';

interface ConfusionMatrixTableProps {
  matrix: ConfusionMatrix;
  positiveLabel?: string;
  negativeLabel?: string;
  selectedCell?: CellKey | null;
  onSelectCell?: (cell: CellKey) => void;
  highlightedCell?: CellKey | null;
  compact?: boolean;
}

export function ConfusionMatrixTable({
  matrix,
  positiveLabel = 'Positivo',
  negativeLabel = 'Negativo',
  selectedCell = null,
  onSelectCell,
  highlightedCell = null,
  compact = false,
}: ConfusionMatrixTableProps) {
  const interactive = Boolean(onSelectCell);

  const cellStyle = (key: CellKey, isPositiveHit: boolean, isWarning: boolean, isDanger: boolean) => {
    const isSelected = selectedCell === key;
    const isHighlighted = highlightedCell === key;
    let base = 'border transition-colors duration-150 text-left ';
    if (isPositiveHit) {
      base += 'bg-teal-50/75 border-teal-200 text-navy-900 ';
    } else if (isWarning) {
      base += 'bg-amber-50/80 border-amber-200 text-navy-900 ';
    } else if (isDanger) {
      base += 'bg-red-50/80 border-red-200 text-navy-900 ';
    } else {
      base += 'bg-[#F6F3EC] border-ivory-200 text-navy-900 ';
    }

    if (isSelected || isHighlighted) {
      base += 'ring-2 ring-teal-600 ring-offset-1 ';
    }
    if (interactive) {
      base += 'hover:brightness-95 cursor-pointer ';
    }
    return base;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: CellKey) => {
    if (!onSelectCell) return;
    const navMap: Record<CellKey, Partial<Record<string, CellKey>>> = {
      tp: { ArrowRight: 'fn', ArrowDown: 'fp' },
      fn: { ArrowLeft: 'tp', ArrowDown: 'tn' },
      fp: { ArrowRight: 'tn', ArrowUp: 'tp' },
      tn: { ArrowLeft: 'fp', ArrowUp: 'fn' },
    };
    const next = navMap[current][e.key];
    if (next) {
      e.preventDefault();
      onSelectCell(next);
      const targetBtn = e.currentTarget
        .closest('[role="grid"]')
        ?.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`);
      targetBtn?.focus();
    }
  };

  const renderCellContent = (
    key: CellKey,
    code: string,
    subtitle: string,
    value: number,
  ) => {
    const padding = compact ? 'p-3' : 'p-4';
    const isSelected = selectedCell === key;
    const isPositiveHit = key === 'tp';
    const isWarning = key === 'fp';
    const isDanger = key === 'fn';

    const inner = (
      <div className="flex flex-col justify-between h-full gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold tracking-wide text-navy-800">
            {code} · {subtitle}
          </span>
          {isSelected && (
            <span className="text-[11px] font-semibold text-teal-700">Seleccionada</span>
          )}
        </div>
        <div className={`font-mono font-semibold tabular-nums text-navy-900 ${compact ? 'text-xl' : 'text-2xl'}`}>
          {formatInt(value)}
        </div>
      </div>
    );

    if (interactive && onSelectCell) {
      return (
        <button
          type="button"
          data-cell={key}
          onClick={() => onSelectCell(key)}
          onKeyDown={(e) => handleKeyDown(e, key)}
          aria-pressed={isSelected}
          aria-label={`${code}: ${subtitle}, valor ${value}`}
          className={`w-full h-full rounded-lg ${padding} ${cellStyle(key, isPositiveHit, isWarning, isDanger)}`}
        >
          {inner}
        </button>
      );
    }

    return (
      <div className={`w-full h-full rounded-lg ${padding} ${cellStyle(key, isPositiveHit, isWarning, isDanger)}`}>
        {inner}
      </div>
    );
  };

  const totalRowPos = matrix.tp + matrix.fn;
  const totalRowNeg = matrix.fp + matrix.tn;
  const totalColPos = matrix.tp + matrix.fp;
  const totalColNeg = matrix.fn + matrix.tn;
  const totalAll = totalRowPos + totalRowNeg;

  return (
    <div className="overflow-x-auto" role="grid" aria-label="Matriz de confusión 2 por 2 con filas Reales y columnas Predichas">
      <table className="w-full border-separate border-spacing-2 text-sm">
        <thead>
          <tr>
            <th scope="col" className="text-left p-2 text-xs font-semibold text-slate-600 align-bottom">
              Real \ Predicho
            </th>
            <th scope="col" className="p-2 text-center bg-navy-900 text-ivory-50 rounded-md font-medium text-xs">
              Predicho: {positiveLabel}
            </th>
            <th scope="col" className="p-2 text-center bg-navy-900 text-ivory-50 rounded-md font-medium text-xs">
              Predicho: {negativeLabel}
            </th>
            <th scope="col" className="p-2 text-center text-xs font-semibold text-slate-600">
              Total Real
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="p-2 text-left bg-ivory-100 text-navy-900 rounded-md font-semibold text-xs align-middle min-w-[125px]">
              Real: {positiveLabel}
            </th>
            <td className="min-w-[140px]">{renderCellContent('tp', 'TP', 'Verdadero Positivo', matrix.tp)}</td>
            <td className="min-w-[140px]">{renderCellContent('fn', 'FN', 'Falso Negativo', matrix.fn)}</td>
            <td className="p-2 text-center font-mono tabular-nums font-semibold text-navy-900">
              {formatInt(totalRowPos)}
            </td>
          </tr>
          <tr>
            <th scope="row" className="p-2 text-left bg-ivory-100 text-navy-900 rounded-md font-semibold text-xs align-middle min-w-[125px]">
              Real: {negativeLabel}
            </th>
            <td className="min-w-[140px]">{renderCellContent('fp', 'FP', 'Falso Positivo', matrix.fp)}</td>
            <td className="min-w-[140px]">{renderCellContent('tn', 'TN', 'Verdadero Negativo', matrix.tn)}</td>
            <td className="p-2 text-center font-mono tabular-nums font-semibold text-navy-900">
              {formatInt(totalRowNeg)}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="p-2 text-left text-xs font-semibold text-slate-600">
              Total Predicho
            </th>
            <td className="p-2 text-center font-mono tabular-nums font-semibold text-navy-900">
              {formatInt(totalColPos)}
            </td>
            <td className="p-2 text-center font-mono tabular-nums font-semibold text-navy-900">
              {formatInt(totalColNeg)}
            </td>
            <td className="p-2 text-center font-mono tabular-nums font-bold text-teal-700">
              N = {formatInt(totalAll)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
