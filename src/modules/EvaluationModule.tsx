import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ConfusionMatrixTable } from '../components/ConfusionMatrixTable';
import { QUIZ_QUESTIONS } from '../data/quizData';
import type { QuizProgress } from '../types/bankolab';

interface EvaluationModuleProps {
  progress: QuizProgress;
  onSubmitAnswer: (questionId: string, submittedValue: string, isCorrect: boolean) => void;
  onResetProgress: () => void;
}

function parseLocalizedNumber(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/cop|\$|%/gi, '')
    .replace(/\s+/g, '');
  if (!cleaned) return null;

  // Si contiene coma y punto (ej. 92.000.000 o 61,54 o 1.234,56)
  let normalized = cleaned;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    normalized = cleaned.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // Formato miles es-CO tipo 92.000.000
    normalized = cleaned.replace(/\./g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function EvaluationModule({
  progress,
  onSubmitAnswer,
  onResetProgress,
}: EvaluationModuleProps) {
  const [draftChoices, setDraftChoices] = useState<Record<string, string>>({});
  const [draftNumerics, setDraftNumerics] = useState<Record<string, string>>({});

  const answeredCount = Object.keys(progress.answers).length;
  const correctCount = Object.values(progress.answers).filter((a) => a.isCorrect).length;

  const handleGradeChoice = (questionId: string, correctOptionId: string) => {
    // Si ya fue respondida, no vuelve a calificar ni duplica puntaje
    if (progress.answers[questionId]) return;
    const selected = draftChoices[questionId];
    if (!selected) return;
    onSubmitAnswer(questionId, selected, selected === correctOptionId);
  };

  const handleGradeNumeric = (
    questionId: string,
    expected: number,
    tolerance: number,
  ) => {
    if (progress.answers[questionId]) return;
    const raw = draftNumerics[questionId] ?? '';
    const parsed = parseLocalizedNumber(raw);
    if (parsed === null) return;
    const isCorrect = Math.abs(parsed - expected) <= tolerance;
    onSubmitAnswer(questionId, raw.trim(), isCorrect);
  };

  const handleReset = () => {
    setDraftChoices({});
    setDraftNumerics({});
    onResetProgress();
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-ivory-200 pb-5">
        <p className="text-xs font-medium text-teal-700">Módulo 7 · Comprobación de aprendizaje</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
              Evaluación práctica ({QUIZ_QUESTIONS.length} preguntas)
            </h1>
            <p className="text-sm sm:text-base text-slate-700 mt-2 max-w-3xl leading-relaxed">
              Sin respuestas preseleccionadas. Cada pregunta entrega retroalimentación inmediata con explicación y
              operación explícita; tu progreso queda guardado localmente en este navegador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white border border-ivory-200 rounded-lg px-4 py-2 text-sm tabular-nums">
              Puntaje:{' '}
              <strong className="font-mono text-teal-700">
                {correctCount} / {QUIZ_QUESTIONS.length}
              </strong>{' '}
              <span className="text-slate-500">({answeredCount} respondidas)</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-ivory-200 bg-white text-navy-900 hover:bg-ivory-100 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reiniciar evaluación
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q, index) => {
          const submitted = progress.answers[q.id];
          const isAnswered = Boolean(submitted);

          return (
            <article
              key={q.id}
              className="bg-white border border-ivory-200 rounded-xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-teal-700">
                  Pregunta {index + 1} de {QUIZ_QUESTIONS.length} · {q.topic}
                </span>
                {isAnswered && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${
                      submitted.isCorrect ? 'text-teal-700' : 'text-red-700'
                    }`}
                  >
                    {submitted.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                    )}
                    {submitted.isCorrect ? 'Correcta (+1)' : 'Incorrecta (0)'}
                  </span>
                )}
              </div>

              <h2 className="text-base font-bold text-navy-900 leading-snug">{q.prompt}</h2>

              {q.contextTable && (
                <div className="max-w-lg bg-ivory-50 border border-ivory-200 rounded-lg p-3">
                  <ConfusionMatrixTable matrix={q.contextTable} compact />
                </div>
              )}

              {q.type === 'choice' && q.options && q.correctOptionId && (
                <div className="space-y-3">
                  <fieldset className="space-y-2" disabled={isAnswered}>
                    <legend className="sr-only">Opciones para la pregunta {index + 1}</legend>
                    {q.options.map((opt) => {
                      const currentSelection = isAnswered
                        ? submitted.submittedValue
                        : draftChoices[q.id] ?? '';
                      const isSelected = currentSelection === opt.id;
                      const showAsCorrect = isAnswered && opt.id === q.correctOptionId;
                      const showAsWrong = isAnswered && isSelected && !submitted.isCorrect;

                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                            showAsCorrect
                              ? 'bg-teal-50 border-teal-500 text-navy-900'
                              : showAsWrong
                                ? 'bg-red-50 border-red-400 text-red-950'
                                : isSelected
                                  ? 'bg-ivory-100 border-navy-900 text-navy-900'
                                  : 'bg-white border-ivory-200 hover:bg-ivory-50 text-slate-800'
                          } ${isAnswered ? 'cursor-default' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`quiz-${q.id}`}
                            value={opt.id}
                            checked={isSelected}
                            onChange={() =>
                              setDraftChoices((prev) => ({ ...prev, [q.id]: opt.id }))
                            }
                            className="mt-1 accent-teal-700"
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </fieldset>

                  {!isAnswered && (
                    <button
                      type="button"
                      disabled={!draftChoices[q.id]}
                      onClick={() => handleGradeChoice(q.id, q.correctOptionId!)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-40 transition-colors"
                    >
                      Comprobar respuesta
                    </button>
                  )}
                </div>
              )}

              {q.type === 'numeric' &&
                q.numericAnswer !== undefined &&
                q.numericTolerance !== undefined && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label htmlFor={`num-${q.id}`} className="sr-only">
                        Respuesta numérica para pregunta {index + 1}
                      </label>
                      <input
                        id={`num-${q.id}`}
                        type="text"
                        inputMode="decimal"
                        disabled={isAnswered}
                        placeholder={
                          q.numericUnit === 'COP' ? 'Ej. 92000000' : 'Ej. 61,5'
                        }
                        value={
                          isAnswered ? submitted.submittedValue : draftNumerics[q.id] ?? ''
                        }
                        onChange={(e) =>
                          setDraftNumerics((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="w-56 rounded-lg border border-ivory-300 bg-ivory-50 px-3 py-2 font-mono text-sm font-semibold tabular-nums text-navy-900 disabled:opacity-75"
                      />
                      <span className="text-xs font-semibold text-slate-600">
                        {q.numericUnit}
                      </span>
                      {!isAnswered && (
                        <button
                          type="button"
                          disabled={parseLocalizedNumber(draftNumerics[q.id] ?? '') === null}
                          onClick={() =>
                            handleGradeNumeric(q.id, q.numericAnswer!, q.numericTolerance!)
                          }
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-40 transition-colors"
                        >
                          Comprobar cálculo
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {isAnswered && (
                <div
                  className={`rounded-lg border p-4 space-y-1.5 text-sm ${
                    submitted.isCorrect
                      ? 'bg-teal-50/70 border-teal-200 text-navy-900'
                      : 'bg-red-50/70 border-red-200 text-navy-900'
                  }`}
                  aria-live="polite"
                >
                  <p className="leading-relaxed">{q.explanation}</p>
                  <div className="font-mono text-xs bg-white/80 border border-ivory-200 rounded px-2.5 py-1.5 text-navy-900 tabular-nums">
                    Operación: {q.operation}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
