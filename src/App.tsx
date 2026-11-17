import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  CheckSquare,
  Grid2x2,
  HelpCircle,
  Menu,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ContextualHelpModal } from './components/ContextualHelpModal';
import { ComponentsModule } from './modules/ComponentsModule';
import { EconomicImpactModule } from './modules/EconomicImpactModule';
import { EvaluationModule } from './modules/EvaluationModule';
import { IndicatorsModule } from './modules/IndicatorsModule';
import { IntroductionModule } from './modules/IntroductionModule';
import { ScenariosModule } from './modules/ScenariosModule';
import { SimulatorModule } from './modules/SimulatorModule';
import type {
  ConfusionMatrix,
  CostParameters,
  ModuleId,
  OptimizationObjective,
  QuizProgress,
} from './types/bankolab';
import {
  DEFAULT_COSTS,
  DEFAULT_MODEL_A,
  DEFAULT_MODEL_B,
} from './utils/economics';
import { DEFAULT_BALANCED_MATRIX, normalizeMatrix } from './utils/metrics';

interface NavItem {
  id: ModuleId;
  step: string;
  label: string;
  icon: typeof BookOpen;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'introduccion', step: '01', label: 'Introducción', icon: BookOpen },
  { id: 'escenarios', step: '02', label: 'Escenarios', icon: Building2 },
  { id: 'componentes', step: '03', label: 'Componentes', icon: Grid2x2 },
  { id: 'simulador', step: '04', label: 'Simulador', icon: SlidersHorizontal },
  { id: 'indicadores', step: '05', label: 'Indicadores', icon: BarChart3 },
  { id: 'impacto', step: '06', label: 'Impacto económico', icon: Calculator },
  { id: 'evaluacion', step: '07', label: 'Evaluación', icon: CheckSquare },
];

const STORAGE_KEYS = {
  module: 'bancolab_active_module_v1',
  simMatrix: 'bancolab_sim_matrix_v1',
  quiz: 'bancolab_quiz_progress_v1',
  economics: 'bancolab_economics_v1',
};

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>(() => {
    const saved = loadStoredJson<string>(STORAGE_KEYS.module, 'introduccion');
    return NAV_ITEMS.some((n) => n.id === saved) ? (saved as ModuleId) : 'introduccion';
  });

  const [simMatrix, setSimMatrix] = useState<ConfusionMatrix>(() =>
    normalizeMatrix(loadStoredJson<ConfusionMatrix>(STORAGE_KEYS.simMatrix, DEFAULT_BALANCED_MATRIX)),
  );

  const [quizProgress, setQuizProgress] = useState<QuizProgress>(() =>
    loadStoredJson<QuizProgress>(STORAGE_KEYS.quiz, { answers: {} }),
  );

  const [economicsState, setEconomicsState] = useState<{
    costs: CostParameters;
    modelA: ConfusionMatrix;
    modelB: ConfusionMatrix;
    objective: OptimizationObjective;
    maxFnrPercent: number;
  }>(() =>
    loadStoredJson(STORAGE_KEYS.economics, {
      costs: DEFAULT_COSTS,
      modelA: DEFAULT_MODEL_A,
      modelB: DEFAULT_MODEL_B,
      objective: 'min_cost' as OptimizationObjective,
      maxFnrPercent: 25,
    }),
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.module, JSON.stringify(activeModule));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [activeModule]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.simMatrix, JSON.stringify(simMatrix));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [simMatrix]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.quiz, JSON.stringify(quizProgress));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [quizProgress]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.economics, JSON.stringify(economicsState));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [economicsState]);

  const handleNavigate = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendScenarioToSimulator = (matrix: ConfusionMatrix) => {
    setSimMatrix(normalizeMatrix(matrix));
    handleNavigate('simulador');
  };

  const handleSubmitQuizAnswer = (
    questionId: string,
    submittedValue: string,
    isCorrect: boolean,
  ) => {
    setQuizProgress((prev) => {
      if (prev.answers[questionId]) {
        return prev;
      }
      return {
        answers: {
          ...prev.answers,
          [questionId]: { submittedValue, isCorrect },
        },
      };
    });
  };

  const handleResetQuiz = () => {
    setQuizProgress({ answers: {} });
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-5">
      <div className="space-y-6">
        <div className="border-b border-navy-800 pb-4">
          <div className="text-lg font-bold tracking-tight text-white">
            BancoLab
          </div>
          <p className="text-xs text-ivory-200/80 mt-0.5">
            Matriz de confusión en banca
          </p>
        </div>

        <nav aria-label="Módulos educativos" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'text-ivory-100/85 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs opacity-75 tabular-nums">{item.step}</span>
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-5 border-t border-navy-800">
        <button
          type="button"
          onClick={() => {
            setHelpOpen(true);
            setMobileMenuOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-navy-700 bg-navy-800 text-xs font-semibold text-ivory-50 hover:bg-navy-700 transition-colors whitespace-nowrap"
        >
          <HelpCircle className="w-4 h-4 text-teal-400" aria-hidden="true" />
          Ayuda contextual
        </button>

        <p className="text-[11px] leading-relaxed text-ivory-200/75">
          Uso educativo · Datos y costos hipotéticos en COP · No constituye motor de aprobación crediticia real.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory-50 text-navy-900 flex flex-col lg:flex-row">
      {/* Barra móvil compacta */}
      <header className="lg:hidden sticky top-0 z-30 bg-navy-900 text-white border-b border-navy-800 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-sidebar"
            aria-label={mobileMenuOpen ? 'Cerrar menú de módulos' : 'Abrir menú de módulos'}
            className="p-2 rounded-lg bg-navy-800 text-white hover:bg-navy-700 shrink-0"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
          </button>
          <span className="font-display font-bold text-base truncate whitespace-nowrap">
            BancoLab · Matriz de confusión
          </span>
        </div>

        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="Abrir ayuda contextual"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 text-xs font-semibold text-ivory-50 hover:bg-navy-700 whitespace-nowrap shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
          Ayuda
        </button>
      </header>

      {/* Menú lateral móvil */}
      {mobileMenuOpen && (
        <div
          id="mobile-sidebar"
          className="lg:hidden fixed inset-0 z-40 flex bg-navy-950/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <aside className="w-72 max-w-[85vw] bg-navy-900 h-full overflow-y-auto shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Barra lateral fija escritorio */}
      <aside className="hidden lg:block w-72 shrink-0 bg-navy-900 text-ivory-50 sticky top-0 h-screen overflow-y-auto border-r border-navy-800">
        {renderSidebarContent()}
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          {activeModule === 'introduccion' && <IntroductionModule />}
          {activeModule === 'escenarios' && (
            <ScenariosModule onSendMatrixToSimulator={handleSendScenarioToSimulator} />
          )}
          {activeModule === 'componentes' && <ComponentsModule matrix={simMatrix} />}
          {activeModule === 'simulador' && (
            <SimulatorModule matrix={simMatrix} onChangeMatrix={setSimMatrix} />
          )}
          {activeModule === 'indicadores' && (
            <IndicatorsModule matrix={simMatrix} onChangeMatrix={setSimMatrix} />
          )}
          {activeModule === 'impacto' && (
            <EconomicImpactModule
              costs={economicsState.costs}
              onChangeCosts={(costs) => setEconomicsState((prev) => ({ ...prev, costs }))}
              modelA={economicsState.modelA}
              onChangeModelA={(modelA) => setEconomicsState((prev) => ({ ...prev, modelA }))}
              modelB={economicsState.modelB}
              onChangeModelB={(modelB) => setEconomicsState((prev) => ({ ...prev, modelB }))}
              objective={economicsState.objective}
              onChangeObjective={(objective) => setEconomicsState((prev) => ({ ...prev, objective }))}
              maxFnrPercent={economicsState.maxFnrPercent}
              onChangeMaxFnrPercent={(maxFnrPercent) =>
                setEconomicsState((prev) => ({ ...prev, maxFnrPercent }))
              }
            />
          )}
          {activeModule === 'evaluacion' && (
            <EvaluationModule
              progress={quizProgress}
              onSubmitAnswer={handleSubmitQuizAnswer}
              onResetProgress={handleResetQuiz}
            />
          )}

          <footer className="mt-12 pt-5 border-t border-ivory-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              BancoLab · Matriz de confusión · Cálculos locales deterministas en el navegador
            </div>
            <div>
              Convención fija: Filas = REAL · Columnas = PREDICHO · Datos y costos hipotéticos con fines educativos
            </div>
          </footer>
        </div>
      </main>

      <ContextualHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
