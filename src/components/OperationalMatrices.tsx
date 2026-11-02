import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ListChecks,
  Users,
  Filter,
  Briefcase,
  Layers,
  Trash2,
  ChevronDown,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X
} from 'lucide-react';
import {
  Dossier,
  Task,
  CurrencyCode,
  LanguageCode
} from '../types';
import {
  STANDARD_PHASES,
  computeTaskMetrics,
  getTodayISO
} from '../pertUtils';
import { formatCurrency, convertFromFCFA, convertToFCFA } from '../i18n';
import { mapPersonalNameToPoste } from '../db';

interface RaciMultiActorCellProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  isPrimary?: boolean;
  suggestions?: string[];
  datalistId: string;
  language?: LanguageCode;
  allowNeant?: boolean;
}

const isNeantToken = (val?: string): boolean => {
  const clean = (val || '').trim().toLowerCase();
  return clean === 'néant' || clean === 'neant' || clean === 'none';
};

const RaciMultiActorCell: React.FC<RaciMultiActorCellProps> = ({
  value,
  onChange,
  placeholder = 'Ajouter...',
  isPrimary = false,
  suggestions = [],
  datalistId,
  language = 'FR',
  allowNeant = false
}) => {
  const [draft, setDraft] = useState('');
  const [pendingRemoveIdx, setPendingRemoveIdx] = useState<number | null>(null);
  const neantLabel = language === 'EN' ? 'None' : 'Néant';

  const actors = useMemo(() => {
    if (!value || !value.trim()) return [];
    return value
      .split(',')
      .map(s => {
        const clean = s.trim();
        return (mapPersonalNameToPoste(clean) || clean).trim();
      })
      .filter(Boolean);
  }, [value]);

  const isCurrentlyNeant = useMemo(
    () => actors.length === 1 && isNeantToken(actors[0]),
    [actors]
  );

  const handleSelectNeant = () => {
    onChange(neantLabel);
    setDraft('');
  };

  const handleAddActor = (overrideVal?: string) => {
    const rawToUse = overrideVal !== undefined ? overrideVal : draft;
    const trimmed = rawToUse.trim().replace(/,/g, '');
    if (!trimmed) return;
    if (allowNeant && isNeantToken(trimmed)) {
      handleSelectNeant();
      return;
    }
    const cleanPoste = (mapPersonalNameToPoste(trimmed) || trimmed).trim();
    const baseActors = actors.filter(a => !isNeantToken(a));
    const next = [...baseActors, cleanPoste];
    onChange(next.join(', '));
    setDraft('');
  };

  const handleRemoveActor = (indexToRemove: number) => {
    const next = actors.filter((_, idx) => idx !== indexToRemove);
    onChange(next.join(', '));
  };

  const handleEditActor = (indexToEdit: number, newName: string) => {
    const cleaned = newName.replace(/,/g, '');
    const cleanPoste = (mapPersonalNameToPoste(cleaned) || cleaned).trim();
    const next = actors.map((act, idx) => (idx === indexToEdit ? cleanPoste : act));
    onChange(next.filter(s => s.trim().length > 0).join(', '));
  };

  return (
    <div className="space-y-1">
      {/* Validation modal before removing a RACI actor */}
      {pendingRemoveIdx !== null && actors[pendingRemoveIdx] !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 whitespace-normal">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#90D5FF] max-w-md w-full p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {language === 'EN'
                    ? 'Deletion Confirmation Required'
                    : 'Validation de Suppression Requise'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {language === 'EN'
                    ? 'Do you confirm the permanent removal of position/function « '
                    : 'Confirmez-vous la suppression définitive du poste / fonction « '}
                  <strong className="text-[#0c4a6e] dark:text-[#90D5FF]">
                    {actors[pendingRemoveIdx]}
                  </strong>{' '}
                  » ?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingRemoveIdx(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {language === 'EN' ? 'Cancel' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemoveActor(pendingRemoveIdx);
                  setPendingRemoveIdx(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase cursor-pointer"
              >
                {language === 'EN' ? 'Confirm deletion' : 'Valider la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing actors list */}
      {actors.length > 0 && (
        <div className="flex flex-col gap-1 w-full">
          {actors.map((actor, idx) => {
            const actorIsNeant = isNeantToken(actor);
            // Calcul automatique du nombre de lignes (rows) selon la longueur de l'intitulé
            const calculatedRows = Math.max(1, Math.min(6, Math.ceil((actor.length || 1) / 13)));
            return (
              <div
                key={`${idx}-${actor}`}
                className={`w-full flex items-start justify-between gap-1 rounded p-1 text-[10px] font-bold border whitespace-normal break-words ${
                  actorIsNeant
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 italic'
                    : isPrimary
                    ? 'bg-[#0c4a6e]/10 dark:bg-sky-950/60 border-[#90D5FF] text-[#0c4a6e] dark:text-[#90D5FF]'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <textarea
                  rows={calculatedRows}
                  value={actor}
                  onChange={e => handleEditActor(idx, e.target.value)}
                  className="bg-transparent text-[10px] font-bold focus:outline-none flex-1 min-w-0 resize-none whitespace-normal break-words leading-tight p-0 border-none m-0 text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() =>
                    actorIsNeant ? handleRemoveActor(idx) : setPendingRemoveIdx(idx)
                  }
                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer shrink-0 mt-0.5"
                  title={
                    actorIsNeant
                      ? language === 'EN'
                        ? 'Clear None'
                        : 'Retirer Néant'
                      : language === 'EN'
                      ? 'Remove this position/function'
                      : 'Retirer ce poste / fonction'
                  }
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new actor inline + Néant choice for Consulté (C) & Informé (I) */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          list={datalistId}
          value={draft}
          placeholder={placeholder}
          onChange={e => {
            const v = e.target.value;
            if (allowNeant && isNeantToken(v)) {
              handleSelectNeant();
            } else {
              setDraft(v);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddActor();
            }
          }}
          className="w-full min-w-0 flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF] truncate"
        />
        <button
          type="button"
          onClick={() => handleAddActor()}
          className="px-1 py-0.5 rounded bg-[#0c4a6e] hover:bg-[#075985] text-[#90D5FF] text-[10px] font-black flex items-center justify-center shrink-0 cursor-pointer"
          title={
            language === 'EN'
              ? 'Add a position / function'
              : 'Ajouter un poste / fonction'
          }
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
        {allowNeant && !isCurrentlyNeant && (
          <button
            type="button"
            onClick={handleSelectNeant}
            className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-slate-300 dark:border-slate-700 hover:border-amber-400 text-slate-600 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 text-[8px] font-extrabold shrink-0 cursor-pointer transition-colors"
            title={
              language === 'EN'
                ? 'Select "None" if there is no position/function for this column'
                : 'Choisir « Néant » s’il n’y a pas de poste / fonction pour cette colonne'
            }
          >
            {neantLabel}
          </button>
        )}
        {(allowNeant || suggestions.length > 0) && (
          <datalist id={datalistId}>
            {allowNeant && <option value={neantLabel} />}
            {suggestions
              .filter(s => !isNeantToken(s))
              .map(s => (
                <option key={s} value={s} />
              ))}
          </datalist>
        )}
      </div>
    </div>
  );
};

interface OperationalMatricesProps {
  mode: 'planification' | 'processus' | 'raci';
  dossier: Dossier;
  currency: CurrencyCode;
  language: LanguageCode;
  filterAxeId: string;
  setFilterAxeId: (id: string) => void;
  filterProjectId: string;
  setFilterProjectId: (id: string) => void;
  onAddAxe: () => void;
  onUpdateAxeName: (axeId: string, name: string) => void;
  onDeleteAxe: (axeId: string) => void;
  onAddProject: (axeId?: string) => void;
  onUpdateProjectName: (projectId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onAddTaskInPhase: (
    projectId: string,
    phaseName: string,
    type: 'tache' | 'jalon'
  ) => void;
  onUpdateTask: (
    projectId: string,
    taskId: string,
    patch: Partial<Task>
  ) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
}

interface EnrichedTaskItem {
  task: Task;
  projectId: string;
  projectName: string;
  axeId: string;
  axeName: string;
  code: string;
  projectTaskOptions: Array<{ id: string; code: string; name: string }>;
}

export const OperationalMatrices: React.FC<OperationalMatricesProps> = ({
  mode,
  dossier,
  currency,
  language,
  filterAxeId,
  setFilterAxeId,
  filterProjectId,
  setFilterProjectId,
  onAddTaskInPhase,
  onUpdateTask,
  onDeleteTask
}) => {
  const [filterPhase, setFilterPhase] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [pendingDelete, setPendingDelete] = useState<{
    projectId: string;
    taskId: string;
    taskName: string;
    code: string;
  } | null>(null);

  const todayISO = getTodayISO();
  const axes = dossier.axes || [];

  const filteredAxes = useMemo(() => {
    if (filterAxeId === 'ALL') return axes;
    return axes.filter(a => a.id === filterAxeId);
  }, [axes, filterAxeId]);

  const availableProjects = useMemo(() => {
    return filteredAxes.flatMap(a => a.projects || []);
  }, [filteredAxes]);

  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    const addSplit = (raw?: string) => {
      if (!raw || !raw.trim()) return;
      raw
        .split(/[,;]/)
        .map(s => {
          const clean = s.trim();
          return (mapPersonalNameToPoste(clean) || clean).trim();
        })
        .filter(
          s =>
            s.length > 0 &&
            s !== '—' &&
            s !== '-' &&
            s.toLowerCase() !== 'néant' &&
            s.toLowerCase() !== 'neant' &&
            s.toLowerCase() !== 'none'
        )
        .forEach(actor => set.add(actor));
    };
    axes.forEach(ax => {
      (ax.projects || []).forEach(pr => {
        (pr.tasks || []).forEach(tk => {
          addSplit(tk.assignee);
          if (mode === 'raci') {
            addSplit(tk.autorite);
            addSplit(tk.consulte);
            addSplit(tk.informe);
          }
        });
      });
    });
    return Array.from(set).sort();
  }, [axes, mode]);

  // Build consolidated list of tasks across filtered Axes and Projects, with consistent codes per project
  const allFilteredEnrichedTasks = useMemo<EnrichedTaskItem[]>(() => {
    const list: EnrichedTaskItem[] = [];

    filteredAxes.forEach(axe => {
      const axeProjects = (axe.projects || []).filter(
        p => filterProjectId === 'ALL' || p.id === filterProjectId
      );

      axeProjects.forEach(proj => {
        const rawTasks = proj.tasks || [];
        const codeMap = new Map<string, string>();
        const projectTaskOptions: Array<{ id: string; code: string; name: string }> = [];

        STANDARD_PHASES.forEach((pName, pIdx) => {
          const pTasks = rawTasks.filter(tk => tk.phase === pName);
          pTasks.forEach((tk, tIdx) => {
            const c = `${tk.type === 'jalon' ? 'J' : 'T'}.${pIdx + 1}.${tIdx + 1}`;
            codeMap.set(tk.id, c);
            projectTaskOptions.push({ id: tk.id, code: c, name: tk.name });
          });
        });

        rawTasks
          .filter(tk => !STANDARD_PHASES.includes(tk.phase))
          .forEach((tk, tIdx) => {
            const c = `${tk.type === 'jalon' ? 'J' : 'T'}.X.${tIdx + 1}`;
            codeMap.set(tk.id, c);
            projectTaskOptions.push({ id: tk.id, code: c, name: tk.name });
          });

        rawTasks.forEach(tk => {
          list.push({
            task: tk,
            projectId: proj.id,
            projectName: proj.name,
            axeId: axe.id,
            axeName: axe.name,
            code: codeMap.get(tk.id) || 'T.1.1',
            projectTaskOptions
          });
        });
      });
    });

    return list;
  }, [filteredAxes, filterProjectId]);

  const togglePhaseCollapse = (key: string) => {
    setCollapsedPhases(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Column count per mode:
  // Planification: 12 columns (including Livrable and Bailleur between Responsable and Budget)
  // Processus (Suivi des tâches): 12 columns
  // RACI: 6 columns
  const colSpanCount =
    mode === 'planification' ? 12 : mode === 'processus' ? 12 : 6;

  const phasesToDisplay =
    filterPhase === 'ALL'
      ? STANDARD_PHASES
      : STANDARD_PHASES.filter(ph => ph === filterPhase);

  // Target project when clicking "+" in a Phase header in Planification
  const defaultTargetProjectId = useMemo(() => {
    if (filterProjectId !== 'ALL') return filterProjectId;
    if (availableProjects.length > 0) return availableProjects[0].id;
    const anyProj = axes.flatMap(a => a.projects || [])[0];
    return anyProj ? anyProj.id : '';
  }, [filterProjectId, availableProjects, axes]);

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* VALIDATION MODAL FOR DELETION IN PLANIFICATION */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#90D5FF] max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {language === 'EN'
                    ? 'Deletion Confirmation Required'
                    : 'Validation de Suppression Requise'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {language === 'EN'
                    ? 'Do you confirm the permanent deletion of item '
                    : 'Confirmez-vous la suppression définitive de l’élément '}
                  <strong className="font-mono text-[#0c4a6e] dark:text-[#90D5FF]">
                    [{pendingDelete.code}]
                  </strong>{' '}
                  « <strong>{pendingDelete.taskName}</strong> » ?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {language === 'EN' ? 'Cancel' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(pendingDelete.projectId, pendingDelete.taskId);
                  setPendingDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase cursor-pointer"
              >
                {language === 'EN' ? 'Confirm deletion' : 'Valider la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ULTRA-COMPACT TOP FILTER BAR FOR MOBILE (PORTRAIT & LANDSCAPE) */}
      <div className="bg-white dark:bg-slate-900 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-800 p-1 md:p-2.5 shadow-xs space-y-1 md:space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[10px] sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1 truncate">
            {mode === 'planification' && (
              <>
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
                <span>
                  {language === 'EN' ? 'Macro Planning' : 'Planification Macro'}
                </span>
              </>
            )}
            {mode === 'processus' && (
              <>
                <ListChecks className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
                <span>
                  {language === 'EN'
                    ? 'Task Tracking & Variances'
                    : 'Suivi des Tâches & Écarts'}
                </span>
              </>
            )}
            {mode === 'raci' && (
              <>
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
                <span>
                  {language === 'EN'
                    ? 'RACI Matrix — Positions & Functions'
                    : 'Matrice RACI — Postes & Fonctions'}
                </span>
              </>
            )}
          </h2>
          <p className="hidden xl:block text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {mode === 'planification' &&
              (language === 'EN'
                ? 'Click on the Code to toggle Task ⇄ Milestone.'
                : 'Cliquez sur le Code pour basculer Tâche ⇄ Jalon.')}
            {mode === 'processus' &&
              (language === 'EN'
                ? 'Only Actual Start and Actual End dates are editable.'
                : 'Seules Déb. Exéc et Fin Exéc sont modifiables.')}
            {mode === 'raci' &&
              (language === 'EN'
                ? 'Enter job positions / functions in R, A, C and I (+). Single Authority (A).'
                : 'Renseignez les postes (fonctions) dans R, A, C et I (+). Autorité (A) unique.')}
          </p>
        </div>

        {/* 5 Filter Dropdowns (2x size on mobile) */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-1.5">
          {/* 1. Axe */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
            <Filter className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                {language === 'EN' ? '1. Axis' : '1. Axe'}
              </label>
              <select
                value={filterAxeId}
                onChange={e => {
                  setFilterAxeId(e.target.value);
                  setFilterProjectId('ALL');
                }}
                className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight"
              >
                <option value="ALL">
                  {language === 'EN' ? `Axis (${axes.length})` : `Axe (${axes.length})`}
                </option>
                {axes.map(ax => (
                  <option key={ax.id} value={ax.id}>
                    {ax.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Projet */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
            <Briefcase className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                {language === 'EN' ? '2. Project' : '2. Projet'}
              </label>
              <select
                value={filterProjectId}
                onChange={e => setFilterProjectId(e.target.value)}
                className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight"
              >
                <option value="ALL">
                  {language === 'EN'
                    ? `Project (${availableProjects.length})`
                    : `Projet (${availableProjects.length})`}
                </option>
                {availableProjects.map(pr => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Phase de Projet */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
            <Layers className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                3. Phase
              </label>
              <select
                value={filterPhase}
                onChange={e => setFilterPhase(e.target.value)}
                className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight"
              >
                <option value="ALL">Phases (5)</option>
                {STANDARD_PHASES.map((ph, idx) => (
                  <option key={ph} value={ph}>
                    P{idx + 1}: {ph}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Responsable / Réalisateur */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
            <UserCheck className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                4.{' '}
                {language === 'EN'
                  ? mode === 'raci'
                    ? 'Position / Role'
                    : 'Owner'
                  : mode === 'raci'
                  ? 'Poste / Fonction'
                  : 'Responsable'}
              </label>
              <select
                value={filterAssignee}
                onChange={e => setFilterAssignee(e.target.value)}
                className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight"
              >
                <option value="ALL">
                  {language === 'EN'
                    ? `${mode === 'raci' ? 'Positions' : 'Owner'} (${allAssignees.length})`
                    : `${mode === 'raci' ? 'Postes' : 'Resp.'} (${allAssignees.length})`}
                </option>
                {allAssignees.map(resp => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Statut */}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
            <CheckCircle2 className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                {language === 'EN' ? '5. Status' : '5. Statut'}
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight"
              >
                <option value="ALL">
                  {language === 'EN' ? 'Status: All' : 'Statut : Tous'}
                </option>
                <option value="À faire">
                  {language === 'EN' ? 'To Do' : 'À Faire'}
                </option>
                <option value="En cours">
                  {language === 'EN' ? 'In Progress' : 'En Cours'}
                </option>
                <option value="Bloqué">
                  {language === 'EN' ? 'Blocked' : 'Bloqué'}
                </option>
                <option value="Terminé">
                  {language === 'EN' ? 'Completed' : 'Terminé'}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SINGLE UNIFIED TABLE PER TAB (First row + First 2 columns "Code" & "Activité / Jalon" locked/sticky!) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[75vh] sm:max-h-[calc(100vh-185px)] relative">
          <table
            className={`w-full border-separate border-spacing-0 table-compact ${
              mode === 'raci'
                ? 'table-fixed min-w-[650px]'
                : mode === 'planification'
                ? 'table-fixed min-w-[1080px]'
                : 'min-w-[760px]'
            }`}
          >
            <thead className="sticky top-0 z-30">
              {mode === 'planification' && (
                <tr className="bg-[#0c4a6e] text-white">
                  {/* 1. Code (Locked Row 1 + Col 1) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 0 }}
                    className="sticky top-0 left-0 z-40 bg-[#0c4a6e] w-[50px] min-w-[50px] max-w-[50px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] px-2 py-1.5 text-[10px] font-black uppercase"
                  >
                    Code
                  </th>
                  {/* 2. Activité / Jalon (Locked Row 1 + Col 2) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 50 }}
                    className="sticky top-0 left-[50px] z-40 bg-[#0c4a6e] w-[140px] min-w-[140px] max-w-[140px] text-left border-r-2 border-[#90D5FF] border-b-2 border-[#90D5FF] shadow-[3px_0_6px_rgba(0,0,0,0.28)] px-2 py-1.5 whitespace-normal break-words text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Activity / Milestone' : 'Activité / Jalon'}
                  </th>
                  {/* 3. Responsable */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[130px] min-w-[130px] max-w-[130px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] px-2 py-1.5 whitespace-normal break-words text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Owner / Position' : 'Responsable'}
                  </th>
                  {/* 4. Livrable (between Responsable and Bailleur) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[130px] min-w-[130px] max-w-[130px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] px-2 py-1.5 whitespace-normal break-words text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Deliverable' : 'Livrable'}
                  </th>
                  {/* 5. Bailleur / Financement */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[130px] min-w-[130px] max-w-[130px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] px-2 py-1.5 whitespace-normal break-words text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Donor / Financing' : 'Bailleur / Financement'}
                  </th>
                  {/* 6. Budget */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[95px] min-w-[95px] max-w-[95px] text-right border-r border-sky-800 border-b-2 border-[#90D5FF] px-2 py-1.5 whitespace-normal break-words text-[10px] font-black uppercase"
                  >
                    Budget ({currency})
                  </th>
                  {/* 7. Mois */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[58px] min-w-[58px] max-w-[58px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF] px-1 py-1.5 text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Month' : 'Mois'}
                  </th>
                  {/* 8. Antécéd. */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[70px] min-w-[70px] max-w-[70px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF] px-1 py-1.5 text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Predec.' : 'Antécéd.'}
                  </th>
                  {/* 9. Déb. Prév */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[92px] min-w-[92px] max-w-[92px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF] px-1 py-1.5 text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Plan. Start' : 'Déb. Prév'}
                  </th>
                  {/* 10. Fin Prév */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[92px] min-w-[92px] max-w-[92px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF] px-1 py-1.5 text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Plan. End' : 'Fin Prév'}
                  </th>
                  {/* 11. Durée */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[48px] min-w-[48px] max-w-[48px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF] px-1 py-1.5 text-[10px] font-black uppercase"
                  >
                    {language === 'EN' ? 'Dur.' : 'Durée'}
                  </th>
                  {/* 12. Actions */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[44px] min-w-[44px] max-w-[44px] text-center border-b-2 border-[#90D5FF] px-1 py-1.5 text-[10px] font-black uppercase"
                  >
                    Actions
                  </th>
                </tr>
              )}

              {mode === 'processus' && (
                <tr className="bg-[#0c4a6e] text-white">
                  {/* 1. Code (Locked Row 1 + Col 1) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 0 }}
                    className="sticky top-0 left-0 z-40 bg-[#0c4a6e] w-[48px] min-w-[48px] max-w-[48px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Code
                  </th>
                  {/* 2. Activité / Jalon (Locked Row 1 + Col 2) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 48 }}
                    className="sticky top-0 left-[48px] z-40 bg-[#0c4a6e] w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] text-left border-r-2 border-[#90D5FF] border-b-2 border-[#90D5FF] shadow-[3px_0_6px_rgba(0,0,0,0.28)]"
                  >
                    {language === 'EN' ? 'Activity / Milestone' : 'Activité / Jalon'}
                  </th>
                  {/* 3. Responsable */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[76px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Owner' : 'Responsable'}
                  </th>
                  {/* 4. Statut */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-24 min-w-[84px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Status' : 'Statut'}
                  </th>
                  {/* 5. Déb. Prév */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[76px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Plan. Start' : 'Déb. Prév'}
                  </th>
                  {/* 6. Fin Prév */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[76px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Plan. End' : 'Fin Prév'}
                  </th>
                  {/* 7. Durée */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-12 min-w-[42px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Dur.' : 'Durée'}
                  </th>
                  {/* 8. Déb. Exéc */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-28 min-w-[98px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Act. Start' : 'Déb. Exéc'}
                  </th>
                  {/* 9. Fin Exéc */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-28 min-w-[98px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Act. End' : 'Fin Exéc'}
                  </th>
                  {/* 10. Réel */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-12 min-w-[44px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Actual' : 'Réel'}
                  </th>
                  {/* 11. Écart début */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[72px] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'Start Var.' : 'Écart début'}
                  </th>
                  {/* 12. Écart fin */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-20 min-w-[72px] text-center border-b-2 border-[#90D5FF]"
                  >
                    {language === 'EN' ? 'End Var.' : 'Écart fin'}
                  </th>
                </tr>
              )}

              {mode === 'raci' && (
                <tr className="bg-[#0c4a6e] text-white">
                  {/* 1. Code (Locked Row 1 + Col 1) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 0 }}
                    className="sticky top-0 left-0 z-40 bg-[#0c4a6e] w-[48px] min-w-[48px] max-w-[48px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    Code
                  </th>
                  {/* 2. Activité / Jalon (Locked Row 1 + Col 2) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 48 }}
                    className="sticky top-0 left-[48px] z-40 bg-[#0c4a6e] w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] text-left border-r-2 border-[#90D5FF] border-b-2 border-[#90D5FF] shadow-[3px_0_6px_rgba(0,0,0,0.28)]"
                  >
                    {language === 'EN' ? 'Activity / Milestone' : 'Activité / Jalon'}
                  </th>
                  {/* 3. Réalisateur (R) = Poste / Fonction (Multiple allowed) - Réduit d'1/3 (130px) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 w-[130px] min-w-[120px] max-w-[130px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] bg-[#075985] px-2 py-1.5 whitespace-normal break-words"
                  >
                    <span className="font-black text-[10px] leading-tight block">
                      {language === 'EN' ? 'Responsible (R)' : 'Réalisateur (R)'}
                    </span>
                    <span className="block text-[8px] font-normal text-[#90D5FF] leading-tight">
                      {language === 'EN' ? '(Position / Function)' : '(Poste / Fonction)'}
                    </span>
                  </th>
                  {/* 4. Autorité (A) (Single authority position only!) - Réduit d'1/3 (120px) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[120px] min-w-[110px] max-w-[120px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] px-2 py-1.5 whitespace-normal break-words"
                  >
                    <span className="font-black text-[10px] leading-tight block">
                      {language === 'EN' ? 'Accountable (A)' : 'Autorité (A)'}
                    </span>
                    <span className="block text-[8px] font-normal text-amber-300 leading-tight">
                      {language === 'EN' ? '(1 Position)' : '(1 seul Poste)'}
                    </span>
                  </th>
                  {/* 5. Consulté (C) (Multiple positions allowed) - Réduit d'1/3 (130px) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[130px] min-w-[120px] max-w-[130px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] px-2 py-1.5 whitespace-normal break-words"
                  >
                    <span className="font-black text-[10px] leading-tight block">
                      {language === 'EN' ? 'Consulted (C)' : 'Consulté (C)'}
                    </span>
                    <span className="block text-[8px] font-normal text-[#90D5FF] leading-tight">
                      {language === 'EN' ? '(Position / Function)' : '(Poste / Fonction)'}
                    </span>
                  </th>
                  {/* 6. Informé (I) (Multiple positions allowed) - Réduit d'1/3 (130px) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-[130px] min-w-[120px] max-w-[130px] text-left border-b-2 border-[#90D5FF] px-2 py-1.5 whitespace-normal break-words"
                  >
                    <span className="font-black text-[10px] leading-tight block">
                      {language === 'EN' ? 'Informed (I)' : 'Informé (I)'}
                    </span>
                    <span className="block text-[8px] font-normal text-[#90D5FF] leading-tight">
                      {language === 'EN' ? '(Position / Function)' : '(Poste / Fonction)'}
                    </span>
                  </th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {phasesToDisplay.map(phaseName => {
                const phaseIndex = STANDARD_PHASES.indexOf(phaseName) + 1;
                const collapseKey = `PHASE__${phaseName}`;
                const isCollapsed = Boolean(collapsedPhases[collapseKey]);

                const phaseItems = allFilteredEnrichedTasks
                  .filter(item => {
                    const tk = item.task;
                    const matchPhase = tk.phase === phaseName;
                    const matchAssignee =
                      filterAssignee === 'ALL' ||
                      (tk.assignee || '').includes(filterAssignee) ||
                      (mode === 'raci' &&
                        ((tk.autorite || '').includes(filterAssignee) ||
                          (tk.consulte || '').includes(filterAssignee) ||
                          (tk.informe || '').includes(filterAssignee)));
                    const effSt = computeTaskMetrics(tk, todayISO).effectiveStatus;
                    const matchStatus =
                      filterStatus === 'ALL' || effSt === filterStatus;
                    return matchPhase && matchAssignee && matchStatus;
                  })
                  .sort((a, b) => {
                    const d1 = a.task.startDate || '9999-12-31';
                    const d2 = b.task.startDate || '9999-12-31';
                    if (d1 !== d2) return d1.localeCompare(d2);
                    const e1 = a.task.endDate || '9999-12-31';
                    const e2 = b.task.endDate || '9999-12-31';
                    return e1.localeCompare(e2);
                  });

                const phaseBudgetFCFA = phaseItems.reduce(
                  (sum, item) => sum + (Number(item.task.budget) || 0),
                  0
                );

                return (
                  <React.Fragment key={collapseKey}>
                    {/* PHASE HEADER ROW */}
                    <tr className="bg-sky-100 dark:bg-slate-800 border-y border-[#90D5FF] dark:border-sky-800">
                      <td colSpan={colSpanCount} className="px-2.5 py-1 border-b border-[#90D5FF] dark:border-sky-800">
                        <div className="sticky left-2 inline-flex flex-wrap items-center justify-between gap-3 w-full max-w-[calc(100vw-2.5rem)]">
                          <button
                            onClick={() => togglePhaseCollapse(collapseKey)}
                            className="flex items-center gap-1.5 text-left cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-[#0c4a6e] dark:text-[#90D5FF]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#0c4a6e] dark:text-[#90D5FF]" />
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-[#0c4a6e] text-[#90D5FF] font-mono text-[8px] font-black uppercase">
                              PHASE {phaseIndex}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#0c4a6e] dark:text-[#90D5FF]">
                              {phaseName}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                              ({phaseItems.length})
                            </span>
                          </button>

                          <div className="flex items-center gap-2">
                            {mode === 'planification' && (
                              <>
                                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                  {language === 'EN' ? 'Subtotal:' : 'Sous-total :'}{' '}
                                  {formatCurrency(
                                    phaseBudgetFCFA,
                                    currency,
                                    language
                                  )}
                                </span>
                                {defaultTargetProjectId && (
                                  <button
                                    onClick={() =>
                                      onAddTaskInPhase(
                                        defaultTargetProjectId,
                                        phaseName,
                                        'tache'
                                      )
                                    }
                                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#0c4a6e] hover:bg-[#075985] text-[#90D5FF] font-black text-xs sm:text-sm flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                                    title={
                                      language === 'EN'
                                        ? 'Add an activity or milestone in this phase'
                                        : 'Ajouter une activité ou un jalon dans cette phase'
                                    }
                                  >
                                    +
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* PHASE TASKS & MILESTONES (ORDERED BY DATES) */}
                    {!isCollapsed &&
                      (phaseItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={colSpanCount}
                            className="py-2 text-center text-[10px] text-slate-400 italic bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
                          >
                            {language === 'EN'
                              ? `No item in phase « ${phaseName} ».`
                              : `Aucun élément dans la phase « ${phaseName} ».`}
                            {mode === 'planification' &&
                              (language === 'EN'
                                ? ' Click « + » to add one.'
                                : ' Cliquez sur « + » pour en ajouter.')}
                          </td>
                        </tr>
                      ) : (
                        phaseItems.map(item => {
                          const {
                            task,
                            projectId,
                            code,
                            projectTaskOptions
                          } = item;
                          const isJalon = task.type === 'jalon';
                          const metrics = computeTaskMetrics(task, todayISO);
                          const startD = new Date(task.startDate);
                          const monthStr = !isNaN(startD.getTime())
                            ? startD.toLocaleString(
                                language === 'EN' ? 'en-US' : 'fr-FR',
                                {
                                  month: 'short',
                                  year: '2-digit'
                                }
                              )
                            : '—';

                          const otherProjectTasks = projectTaskOptions.filter(
                            o => o.id !== task.id
                          );

                          const stickyCellBg = isJalon
                            ? 'bg-[#f0f9ff] dark:bg-[#1e293b]'
                            : 'bg-white dark:bg-[#0f172a]';

                          // ==========================================
                          // ROW MODE 1 : PLANIFICATION (10 Columns)
                          // ==========================================
                          if (mode === 'planification') {
                            const displayedBudget = Math.round(
                              convertFromFCFA(task.budget || 0, currency)
                            );

                            return (
                              <tr
                                key={task.id}
                                className={`${
                                  isJalon
                                    ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                    : 'bg-white dark:bg-slate-900'
                                } hover:bg-sky-50/70 dark:hover:bg-slate-800/70`}
                              >
                                {/* 1. Code (Locked Col 1 — click to switch Tache <-> Jalon) */}
                                <td
                                  style={{ position: 'sticky', left: 0 }}
                                  className={`sticky left-0 z-20 ${stickyCellBg} w-[50px] min-w-[50px] max-w-[50px] p-1.5 align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal break-words`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateTask(projectId, task.id, {
                                        type: isJalon ? 'tache' : 'jalon',
                                        ...(isJalon
                                          ? {}
                                          : { endDate: task.startDate })
                                      })
                                    }
                                    className={`w-full text-center font-mono text-[9px] font-black px-1 py-1 rounded leading-tight cursor-pointer transition-transform active:scale-95 ${
                                      isJalon
                                        ? 'bg-[#90D5FF] text-slate-950'
                                        : 'bg-[#0c4a6e] text-white'
                                    }`}
                                    title="Cliquez sur le code pour convertir Tâche (T) ⇄ Jalon (J)"
                                  >
                                    {code}
                                  </button>
                                </td>

                                {/* 2. Activité / Jalon (Locked Col 2) */}
                                <td
                                  style={{ position: 'sticky', left: 50 }}
                                  className={`sticky left-[50px] z-20 ${stickyCellBg} w-[140px] min-w-[140px] max-w-[140px] p-1.5 align-top border-r-2 border-[#0284c7] dark:border-[#90D5FF] border-b border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(12,74,110,0.18)] whitespace-normal break-words`}
                                >
                                  <textarea
                                    rows={Math.max(2, Math.min(6, Math.ceil((task.name || '').length / 16)))}
                                    value={task.name}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        name: e.target.value
                                      })
                                    }
                                    className={`w-full bg-transparent text-[10px] leading-tight resize-none whitespace-normal break-words focus:outline-none focus:ring-1 focus:ring-[#90D5FF] rounded p-0.5 ${
                                      isJalon
                                        ? 'font-bold italic text-slate-700 dark:text-slate-200'
                                        : 'font-extrabold text-slate-900 dark:text-white'
                                    }`}
                                  />
                                </td>

                                {/* 3. Responsable (= Réalisateur R) */}
                                <td className="w-[130px] min-w-[130px] max-w-[130px] p-1.5 align-top border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words">
                                  <textarea
                                    rows={Math.max(2, Math.min(6, Math.ceil((task.assignee || '').length / 15)))}
                                    value={task.assignee || ''}
                                    placeholder={
                                      language === 'EN'
                                        ? 'Owner / Actor...'
                                        : 'Responsable...'
                                    }
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        assignee: e.target.value
                                      })
                                    }
                                    className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF] resize-none whitespace-normal break-words leading-tight"
                                  />
                                </td>

                                {/* 4. Livrable (between Responsable and Bailleur) */}
                                <td className="w-[130px] min-w-[130px] max-w-[130px] p-1.5 align-top border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words">
                                  <textarea
                                    rows={Math.max(2, Math.min(6, Math.ceil((task.livrable || '').length / 15)))}
                                    value={task.livrable || ''}
                                    placeholder={
                                      language === 'EN'
                                        ? 'Expected deliverable...'
                                        : 'Livrable attendu...'
                                    }
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        livrable: e.target.value
                                      })
                                    }
                                    className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF] resize-none whitespace-normal break-words leading-tight"
                                  />
                                </td>

                                {/* 5. Bailleur / Financement */}
                                <td className="w-[130px] min-w-[130px] max-w-[130px] p-1.5 align-top border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words">
                                  <textarea
                                    rows={Math.max(2, Math.min(6, Math.ceil(((task.bailleur ?? task.autorite ?? '')).length / 14)))}
                                    value={task.bailleur ?? task.autorite ?? ''}
                                    placeholder={
                                      language === 'EN'
                                        ? 'Donor / Funder...'
                                        : 'Bailleur / Financement...'
                                    }
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        bailleur: e.target.value
                                      })
                                    }
                                    className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF] resize-none whitespace-normal break-words leading-tight"
                                  />
                                </td>

                                {/* 6. Budget */}
                                <td className="w-[95px] min-w-[95px] max-w-[95px] p-1.5 align-top border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words">
                                  <input
                                    type="number"
                                    value={displayedBudget}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        budget: convertToFCFA(
                                          Number(e.target.value),
                                          currency
                                        )
                                      })
                                    }
                                    className="w-full bg-transparent text-right font-mono text-[10px] font-bold text-slate-900 dark:text-white px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                  />
                                </td>

                                {/* 7. Mois (Auto) */}
                                <td className="w-[58px] min-w-[58px] max-w-[58px] p-1.5 align-top text-center font-bold text-[10px] text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words">
                                  {monthStr}
                                </td>

                                {/* 8. Antécéd. */}
                                <td className="w-[70px] min-w-[70px] max-w-[70px] p-1.5 align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <select
                                    value={task.antecedent || '—'}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        antecedent: e.target.value
                                      })
                                    }
                                    className="w-full bg-slate-50 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 rounded px-1 py-0.5"
                                  >
                                    <option value="—">—</option>
                                    {otherProjectTasks.map(opt => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.code}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* 9. Déb. Prév */}
                                <td className="w-[92px] min-w-[92px] max-w-[92px] p-1.5 align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    value={task.startDate}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        startDate: e.target.value,
                                        ...(isJalon
                                          ? { endDate: e.target.value }
                                          : {})
                                      })
                                    }
                                    className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 rounded px-0.5 py-0.5"
                                  />
                                </td>

                                {/* 10. Fin Prév */}
                                <td className="w-[92px] min-w-[92px] max-w-[92px] p-1.5 align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    value={task.endDate}
                                    onChange={e =>
                                      onUpdateTask(projectId, task.id, {
                                        endDate: e.target.value
                                      })
                                    }
                                    className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-200 rounded px-0.5 py-0.5"
                                  />
                                </td>

                                {/* 11. Durée (Auto) */}
                                <td className="w-[48px] min-w-[48px] max-w-[48px] p-1.5 align-top text-center font-mono font-black text-[10px] text-[#0c4a6e] dark:text-[#90D5FF] border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words">
                                  {metrics.plannedDurationLabel}
                                </td>

                                {/* 12. Actions (Delete with Validation) */}
                                <td className="w-[44px] min-w-[44px] max-w-[44px] p-1.5 align-top text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingDelete({
                                        projectId,
                                        taskId: task.id,
                                        taskName: task.name,
                                        code
                                      })
                                    }
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                    title="Supprimer (validation requise)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          // ==========================================
                          // ROW MODE 2 : SUIVI DES TÂCHES (12 Columns — Read-Only except Déb. Exéc & Fin Exéc, No Add/Delete)
                          // ==========================================
                          if (mode === 'processus') {
                            const effStatus = metrics.effectiveStatus;
                            const displayedStartExec =
                              effStatus === 'À faire'
                                ? ''
                                : metrics.effectiveActualStartDate;
                            const displayedEndExec =
                              effStatus === 'Terminé'
                                ? metrics.effectiveActualEndDate
                                : '';

                            const statusBadgeClass =
                              effStatus === 'Terminé'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                                : effStatus === 'En cours'
                                ? 'bg-sky-100 text-[#0c4a6e] dark:bg-sky-950/60 dark:text-[#90D5FF] border-[#90D5FF]'
                                : effStatus === 'Bloqué'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';

                            return (
                              <tr
                                key={task.id}
                                className={`${
                                  isJalon
                                    ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                    : 'bg-white dark:bg-slate-900'
                                } hover:bg-sky-50/70 dark:hover:bg-slate-800/70`}
                              >
                                {/* 1. Code (Locked Col 1, Read-only) */}
                                <td
                                  style={{ position: 'sticky', left: 0 }}
                                  className={`sticky left-0 z-20 ${stickyCellBg} w-[48px] min-w-[48px] max-w-[48px] align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal break-words`}
                                >
                                  <span
                                    className={`inline-block font-mono text-[9px] font-black px-1 py-0.5 rounded leading-tight ${
                                      isJalon
                                        ? 'bg-[#90D5FF] text-slate-950'
                                        : 'bg-[#0c4a6e] text-white'
                                    }`}
                                  >
                                    {code}
                                  </span>
                                </td>

                                {/* 2. Activité / Jalon (Locked Col 2, Read-only) */}
                                <td
                                  style={{ position: 'sticky', left: 48 }}
                                  className={`sticky left-[48px] z-20 ${stickyCellBg} w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] align-top border-r-2 border-[#0284c7] dark:border-[#90D5FF] border-b border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(12,74,110,0.18)] whitespace-normal break-words`}
                                >
                                  <div
                                    className={`text-[10px] leading-snug whitespace-normal break-words ${
                                      isJalon
                                        ? 'font-bold italic text-slate-700 dark:text-slate-200'
                                        : 'font-extrabold text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {isJalon ? `◆ ${task.name}` : task.name}
                                  </div>
                                </td>

                                {/* 3. Responsable (Read-only) */}
                                <td className="align-top border-r border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-normal break-words">
                                  {task.assignee}
                                </td>

                                {/* 4. Statut (Auto-calculated; click to toggle Bloqué) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextBlocked = effStatus !== 'Bloqué';
                                      onUpdateTask(projectId, task.id, {
                                        manualBlocked: nextBlocked,
                                        status: nextBlocked
                                          ? 'Bloqué'
                                          : displayedStartExec
                                          ? 'En cours'
                                          : 'À faire',
                                        actualEndDate: ''
                                      });
                                    }}
                                    title={
                                      language === 'EN'
                                        ? 'Auto-computed status (Click to toggle Blocked)'
                                        : 'Statut automatique (Cliquer pour basculer Bloqué)'
                                    }
                                    className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-black cursor-pointer transition-transform active:scale-95 ${statusBadgeClass}`}
                                  >
                                    {effStatus}
                                  </button>
                                </td>

                                {/* 5. Déb. Prév (Read-only) */}
                                <td className="align-top text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                                  {task.startDate}
                                </td>

                                {/* 6. Fin Prév (Read-only) */}
                                <td className="align-top text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                                  {task.endDate}
                                </td>

                                {/* 7. Durée (Read-only) */}
                                <td className="align-top text-center font-mono font-bold text-[10px] text-[#0c4a6e] dark:text-[#90D5FF] border-r border-slate-200 dark:border-slate-800">
                                  {metrics.plannedDurationLabel}
                                </td>

                                {/* 8. Déb. Exéc (Editable, max = todayISO, empty if À faire) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    max={todayISO}
                                    value={displayedStartExec}
                                    onChange={e => {
                                      const rawVal = e.target.value;
                                      if (!rawVal) {
                                        onUpdateTask(projectId, task.id, {
                                          actualStartDate: '',
                                          actualEndDate: '',
                                          status: task.manualBlocked
                                            ? 'Bloqué'
                                            : 'À faire'
                                        });
                                        return;
                                      }
                                      const clampedStart =
                                        rawVal > todayISO ? todayISO : rawVal;
                                      const validEnd =
                                        displayedEndExec &&
                                        displayedEndExec <= todayISO &&
                                        displayedEndExec >= clampedStart
                                          ? displayedEndExec
                                          : '';
                                      onUpdateTask(projectId, task.id, {
                                        actualStartDate: clampedStart,
                                        actualEndDate: validEnd,
                                        status: validEnd
                                          ? 'Terminé'
                                          : task.manualBlocked
                                          ? 'Bloqué'
                                          : 'En cours',
                                        ...(validEnd
                                          ? { manualBlocked: false }
                                          : {})
                                      });
                                    }}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-900 dark:text-white rounded px-1 py-0.5"
                                  />
                                </td>

                                {/* 9. Fin Exéc (Editable only when started & not blocked; max = todayISO; filling both Déb. Exéc & Fin Exéc marks Terminé) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  {effStatus === 'Bloqué' ||
                                  effStatus === 'À faire' ||
                                  !displayedStartExec ? (
                                    <span
                                      className="inline-block text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 py-0.5"
                                      title={
                                        effStatus === 'Bloqué'
                                          ? language === 'EN'
                                            ? 'Task is blocked: Actual End cannot be displayed'
                                            : 'Tâche bloquée : Fin Exéc ne doit pas être affichée'
                                          : language === 'EN'
                                          ? 'Enter Actual Start first (<= Today)'
                                          : 'Renseignez d’abord Déb. Exéc (<= Aujourd’hui)'
                                      }
                                    >
                                      —
                                    </span>
                                  ) : (
                                    <input
                                      type="date"
                                      min={displayedStartExec}
                                      max={todayISO}
                                      value={displayedEndExec}
                                      onChange={e => {
                                        const rawVal = e.target.value;
                                        if (!rawVal) {
                                          onUpdateTask(projectId, task.id, {
                                            actualEndDate: '',
                                            status: task.manualBlocked
                                              ? 'Bloqué'
                                              : 'En cours'
                                          });
                                          return;
                                        }
                                        const clampedEnd =
                                          rawVal > todayISO ? todayISO : rawVal;
                                        const finalEnd =
                                          clampedEnd < displayedStartExec
                                            ? displayedStartExec
                                            : clampedEnd;
                                        onUpdateTask(projectId, task.id, {
                                          actualStartDate: displayedStartExec,
                                          actualEndDate: finalEnd,
                                          status: 'Terminé',
                                          manualBlocked: false
                                        });
                                      }}
                                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-900 dark:text-white rounded px-1 py-0.5"
                                    />
                                  )}
                                </td>

                                {/* 10. Réel (Auto) */}
                                <td className="align-top text-center font-mono font-bold text-[10px] text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                                  {metrics.realDurationLabel}
                                </td>

                                {/* 11. Écart début (Auto) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                      metrics.ecartDebutDays > 0
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        : metrics.ecartDebutDays < 0
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {metrics.ecartDebutLabel}
                                  </span>
                                </td>

                                {/* 12. Écart fin (Auto) */}
                                <td className="align-top text-center">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                      metrics.ecartFinDays > 0
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        : metrics.ecartFinDays < 0
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {metrics.ecartFinLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          }

                          // ==========================================
                          // ROW MODE 3 : MATRICE RACI (6 Columns — Sticky First 2 cols, Multi-actor add in R, C, I)
                          // ==========================================
                          return (
                            <tr
                              key={task.id}
                              className={`${
                                isJalon
                                  ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                  : 'bg-white dark:bg-slate-900'
                              } hover:bg-sky-50/70 dark:hover:bg-slate-800/70`}
                            >
                              {/* 1. Code (Locked Col 1, Read-only) */}
                              <td
                                style={{ position: 'sticky', left: 0 }}
                                className={`sticky left-0 z-20 ${stickyCellBg} w-[48px] min-w-[48px] max-w-[48px] align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal break-words`}
                              >
                                <span
                                  className={`inline-block font-mono text-[10px] font-black px-1 py-0.5 rounded leading-tight ${
                                    isJalon
                                      ? 'bg-[#90D5FF] text-slate-950'
                                      : 'bg-[#0c4a6e] text-white'
                                  }`}
                                >
                                  {code}
                                </span>
                              </td>

                              {/* 2. Activité / Jalon (Locked Col 2, Read-only) */}
                              <td
                                style={{ position: 'sticky', left: 48 }}
                                className={`sticky left-[48px] z-20 ${stickyCellBg} w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] align-top border-r-2 border-[#0284c7] dark:border-[#90D5FF] border-b border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(12,74,110,0.18)] whitespace-normal break-words`}
                              >
                                <div
                                  className={`text-[10px] leading-snug whitespace-normal break-words ${
                                    isJalon
                                      ? 'font-bold italic text-slate-700 dark:text-slate-200'
                                      : 'font-extrabold text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {isJalon ? `◆ ${task.name}` : task.name}
                                </div>
                              </td>

                              {/* 3. Réalisateur (R) = Poste / Fonction (Multi-actor addition in cell) - Réduit d'1/3 (130px) */}
                              <td className="w-[130px] min-w-[120px] max-w-[130px] p-1.5 align-top border-r border-slate-200 dark:border-slate-800 bg-sky-50/30 dark:bg-sky-950/20 whitespace-normal break-words">
                                <RaciMultiActorCell
                                  value={mapPersonalNameToPoste(task.assignee) || task.assignee || ''}
                                  isPrimary
                                  language={language}
                                  placeholder={
                                    language === 'EN'
                                      ? '+ Position (R)...'
                                      : '+ Poste (R)...'
                                  }
                                  suggestions={allAssignees}
                                  datalistId={`raci-r-${task.id}`}
                                  onChange={newVal =>
                                    onUpdateTask(projectId, task.id, {
                                      assignee: mapPersonalNameToPoste(newVal) || newVal
                                    })
                                  }
                                />
                              </td>

                              {/* 4. Autorité (A) — STRICTLY 1 SINGLE AUTHORITY POSITION PER ACTION - Réduit d'1/3 (120px) */}
                              <td className="w-[120px] min-w-[110px] max-w-[120px] p-1.5 align-top border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words">
                                {(() => {
                                  const rawA = task.autorite || '';
                                  const aVal = mapPersonalNameToPoste(rawA) || rawA;
                                  // Calcul automatique du nombre de lignes (rows) selon la longueur de l'intitulé
                                  const aRows = Math.max(1, Math.min(6, Math.ceil((aVal.length || 1) / 13)));
                                  return (
                                    <div className="space-y-1">
                                      <textarea
                                        rows={aRows}
                                        value={aVal}
                                        placeholder={
                                          language === 'EN'
                                            ? '1 Accountable (A)...'
                                            : '1 Poste Autorité (A)...'
                                        }
                                        onChange={e => {
                                          const singleAuthority = e.target.value.split(/[,;\n]+/)[0];
                                          const cleanPoste = (mapPersonalNameToPoste(singleAuthority) || singleAuthority).trim();
                                          onUpdateTask(projectId, task.id, {
                                            autorite: cleanPoste
                                          });
                                        }}
                                        className="w-full resize-none whitespace-normal break-words bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] leading-tight font-bold text-slate-800 dark:text-slate-200 px-1.5 py-1 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                      />
                                      {allAssignees.length > 0 && (
                                        <>
                                          <input
                                            type="text"
                                            list={`raci-a-${task.id}`}
                                            placeholder={language === 'EN' ? 'Pick (A)...' : 'Choisir (A)...'}
                                            onChange={e => {
                                              if (e.target.value) {
                                                const singleAuthority = e.target.value.split(/[,;]+/)[0].trim();
                                                if (singleAuthority) {
                                                  const cleanPoste = (mapPersonalNameToPoste(singleAuthority) || singleAuthority).trim();
                                                  onUpdateTask(projectId, task.id, {
                                                    autorite: cleanPoste
                                                  });
                                                }
                                                e.target.value = '';
                                              }
                                            }}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-semibold text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#90D5FF] truncate"
                                          />
                                          <datalist id={`raci-a-${task.id}`}>
                                            {allAssignees.map(s => (
                                              <option key={s} value={s} />
                                            ))}
                                          </datalist>
                                        </>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* 5. Consulté (C) — Multi-position addition in cell + option Néant - Réduit d'1/3 (130px) */}
                              <td className="w-[130px] min-w-[120px] max-w-[130px] p-1.5 align-top border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words">
                                <RaciMultiActorCell
                                  value={mapPersonalNameToPoste(task.consulte) || task.consulte || ''}
                                  allowNeant
                                  language={language}
                                  placeholder={
                                    language === 'EN'
                                      ? '+ Consulted (C)...'
                                      : '+ Poste Consulté (C)...'
                                  }
                                  suggestions={allAssignees}
                                  datalistId={`raci-c-${task.id}`}
                                  onChange={newVal =>
                                    onUpdateTask(projectId, task.id, {
                                      consulte: mapPersonalNameToPoste(newVal) || newVal
                                    })
                                  }
                                />
                              </td>

                              {/* 6. Informé (I) — Multi-position addition in cell + option Néant - Réduit d'1/3 (130px) */}
                              <td className="w-[130px] min-w-[120px] max-w-[130px] p-1.5 align-top whitespace-normal break-words">
                                <RaciMultiActorCell
                                  value={mapPersonalNameToPoste(task.informe) || task.informe || ''}
                                  allowNeant
                                  language={language}
                                  placeholder={
                                    language === 'EN'
                                      ? '+ Informed (I)...'
                                      : '+ Poste Informé (I)...'
                                  }
                                  suggestions={allAssignees}
                                  datalistId={`raci-i-${task.id}`}
                                  onChange={newVal =>
                                    onUpdateTask(projectId, task.id, {
                                      informe: mapPersonalNameToPoste(newVal) || newVal
                                    })
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
