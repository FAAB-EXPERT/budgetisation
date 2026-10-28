import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  LayoutDashboard,
  FolderTree,
  Folder,
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Activity,
  Target,
  Trash2,
  Diamond,
  DollarSign,
  Edit3,
  Filter,
  FileSpreadsheet,
  FlaskConical,
  Building2,
  TestTube,
  RefreshCw,
  Sparkles,
  Briefcase,
  Layers,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import type { Dossier as ParentDossier, LanguageCode, CurrencyCode } from '../types';
import { computeTaskMetrics, getTodayISO } from '../pertUtils';

export interface EvmTask {
  id: string;
  type?: 'tache' | 'jalon' | string;
  name: string;
  phase?: string;
  antecedent?: string;
  moisStr?: string;
  assignee?: string;
  responsabilite?: string;
  responsableTresorerie?: string;
  startDate: string;
  endDate: string;
  dateDecaissementPrevu?: string;
  dateDecaissementReel?: string;
  montantDecaissementPrevu?: number | string;
  montantDecaissementReel?: number | string;
  coutPlanifie: number;
  valeurAcquise?: number;
  coutReel: number;
  status: 'À faire' | 'En cours' | 'Terminé' | 'Bloqué' | string;
  motifBlocage?: string;
  valideVA?: boolean;
  dateVA?: string;
}

export interface EvmProject {
  id: string;
  name: string;
  budgetsAnnuels?: Record<string, string | number>;
  tasks: EvmTask[];
  dossierName?: string;
  dossierId?: string;
  axeName?: string;
  axeId?: string;
  isReadOnly?: boolean;
}

export interface EvmAxe {
  id: string;
  name: string;
  budget?: number;
  projects: EvmProject[];
}

export interface EvmDossier {
  id: string;
  name: string;
  institution?: string;
  isReadOnly?: boolean;
  startYear?: string;
  endYear?: string;
  axes: EvmAxe[];
}

const COLORS: Record<string, string> = {
  Terminé: '#10B981',
  'En cours': '#7C3AED',
  Bloqué: '#EF4444',
  'À faire': '#9CA3AF',
  Completed: '#10B981',
  'In Progress': '#7C3AED',
  Blocked: '#EF4444',
  'To Do': '#9CA3AF'
};

const DISTRIBUTION_COLORS = [
  '#7C3AED',
  '#8B5CF6',
  '#6D28D9',
  '#A855F7',
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#EC4899',
  '#14B8A6',
  '#6366F1',
  '#D946EF',
  '#64748B',
  '#0EA5E9'
];

const STANDARD_PHASES = [
  'PHASE DU CYCLE : AVANT PROJET',
  'PHASE DU CYCLE : CONCEPTION',
  'PHASE DU CYCLE : PLANIFICATION',
  'PHASE DU CYCLE : EXÉCUTION & SUIVI',
  'PHASE DU CYCLE : CLÔTURE'
];

const CANONICAL_APP_PHASES = [
  'AVANT PROJET',
  'CONCEPTION',
  'PLANIFICATION',
  'EXÉCUTION & SUIVI',
  'CLÔTURE'
];

function mapPhaseToStandard(phase?: string): string {
  if (!phase) return STANDARD_PHASES[0];
  if (STANDARD_PHASES.includes(phase)) return phase;
  const upper = phase.toUpperCase();
  if (upper.includes('AVANT')) return STANDARD_PHASES[0];
  if (upper.includes('CONCEPTION')) return STANDARD_PHASES[1];
  if (upper.includes('PLANIFICATION')) return STANDARD_PHASES[2];
  if (upper.includes('EXÉCUTION') || upper.includes('EXECUTION') || upper.includes('SUIVI'))
    return STANDARD_PHASES[3];
  if (upper.includes('CLÔTURE') || upper.includes('CLOTURE')) return STANDARD_PHASES[4];
  return STANDARD_PHASES[0];
}

function mapStandardToCanonicalPhase(phase?: string): string {
  const idx = STANDARD_PHASES.indexOf(mapPhaseToStandard(phase));
  return CANONICAL_APP_PHASES[idx >= 0 ? idx : 0];
}

function toMillions(val?: number | string): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  if (isNaN(num)) return 0;
  if (Math.abs(num) >= 10000) {
    return Math.round((num / 1000000) * 100) / 100;
  }
  return Math.round(num * 100) / 100;
}

function fromMillionsToFCFA(val?: number | string): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  if (isNaN(num)) return 0;
  if (Math.abs(num) > 0 && Math.abs(num) < 10000) {
    return Math.round(num * 1000000);
  }
  return Math.round(num);
}

function extractDossierYears(d: ParentDossier): { startYear: string; endYear: string } {
  const match = (d.horizonPlan || '').match(/(\d{4})\D+(\d{4})/);
  if (match) {
    return { startYear: match[1], endYear: match[2] };
  }
  const sy = Number(d.psdYear) || 2026;
  const ey = sy + Math.max(1, (Number(d.horizonYears) || 3) - 1);
  return { startYear: String(sy), endYear: String(ey) };
}

export function convertParentDossiersToEvm(parentDossiers: ParentDossier[]): EvmDossier[] {
  const todayISO = getTodayISO();
  return (parentDossiers || []).map(d => {
    const { startYear, endYear } = extractDossierYears(d);
    const y1 = String(Number(startYear) || 2026);
    const y2 = String((Number(startYear) || 2026) + 1);
    const y3 = String((Number(startYear) || 2026) + 2);
    return {
      id: d.id,
      name: d.name,
      institution: d.institution || '',
      isReadOnly: Boolean(d.isReadOnly),
      startYear,
      endYear,
      axes: (d.axes || []).map(a => ({
        id: a.id,
        name: a.name,
        budget: 0,
        projects: (a.projects || []).map(p => ({
          id: p.id,
          name: p.name,
          budgetsAnnuels: { [y1]: '', [y2]: '', [y3]: '' },
          tasks: (p.tasks || []).map(tk => {
            const metrics = computeTaskMetrics(tk, todayISO);
            const vp = toMillions(metrics.budgetPrevu);
            const effStatus = metrics.effectiveStatus;
            const isDone = effStatus === 'Terminé';
            const decReel = toMillions(metrics.montantDecaisse);
            const va = toMillions(metrics.valeurAcquise);
            const cr = toMillions(metrics.coutReel);
            const decPrevu = vp;

            return {
              id: tk.id,
              type: tk.type || 'tache',
              name: tk.name,
              phase: mapPhaseToStandard(tk.phase),
              antecedent: tk.antecedent || '—',
              assignee: tk.assignee || '',
              responsabilite: tk.responsabilite || '',
              responsableTresorerie: tk.bailleur || tk.autorite || '',
              startDate: tk.startDate,
              endDate: tk.endDate,
              dateDecaissementPrevu: metrics.dateDecaissementPrevu || tk.startDate,
              dateDecaissementReel: metrics.dateDecaissementReel || '',
              montantDecaissementPrevu: decPrevu,
              montantDecaissementReel: decReel,
              coutPlanifie: vp,
              valeurAcquise: va,
              coutReel: cr,
              status: effStatus || 'À faire',
              motifBlocage: tk.motifBlocage || '',
              valideVA: isDone,
              dateVA: tk.actualEndDate || (isDone ? tk.endDate : '')
            };
          })
        }))
      }))
    };
  });
}

function mergeEvmIntoParentDossiers(
  evmDossiers: EvmDossier[],
  prevParentDossiers: ParentDossier[]
): ParentDossier[] {
  const todayISO = getTodayISO();
  return evmDossiers.map(ed => {
    const existingDossier = prevParentDossiers.find(pd => pd.id === ed.id);
    const startY = Number(ed.startYear) || existingDossier?.psdYear || 2026;
    const endY = Number(ed.endYear) || startY + 2;
    const horizonYears = Math.max(1, endY - startY + 1);
    const horizonPlan = `${startY}-${endY}`;

    return {
      ...(existingDossier || {
        id: ed.id,
        type: 'Portefeuille Stratégique',
        description: 'Portefeuille de projets planifié et suivi dans FAAB PLAN.'
      }),
      id: ed.id,
      name: ed.name,
      institution: ed.institution || existingDossier?.institution || '',
      psdYear: startY,
      horizonYears,
      horizonPlan,
      isReadOnly: ed.isReadOnly ?? existingDossier?.isReadOnly ?? false,
      axes: (ed.axes || []).map(ea => {
        const existingAxe = existingDossier?.axes?.find(pa => pa.id === ea.id);
        return {
          ...(existingAxe || {}),
          id: ea.id,
          name: ea.name,
          projects: (ea.projects || []).map(ep => {
            const existingProj = existingAxe?.projects?.find(pp => pp.id === ep.id);
            return {
              ...(existingProj || {}),
              id: ep.id,
              name: ep.name,
              tasks: (ep.tasks || []).map(et => {
                const existingTask = existingProj?.tasks?.find(pt => pt.id === et.id);
                const statusCast = (
                  ['À faire', 'En cours', 'Terminé', 'Bloqué'].includes(et.status)
                    ? et.status
                    : 'À faire'
                ) as 'À faire' | 'En cours' | 'Terminé' | 'Bloqué';
                const clampedStart =
                  et.startDate && et.startDate <= todayISO ? et.startDate : todayISO;
                const nextActualStart =
                  existingTask?.actualStartDate !== undefined
                    ? existingTask.actualStartDate
                    : statusCast === 'À faire'
                    ? ''
                    : clampedStart;
                const nextActualEnd =
                  existingTask?.actualEndDate !== undefined
                    ? existingTask.actualEndDate
                    : statusCast === 'Terminé'
                    ? todayISO
                    : '';
                return {
                  ...(existingTask || {
                    consulte: '',
                    informe: '',
                    livrable: '',
                    antecedent: '—'
                  }),
                  id: et.id,
                  type: (et.type === 'jalon' ? 'jalon' : 'tache') as 'tache' | 'jalon',
                  phase: mapStandardToCanonicalPhase(et.phase),
                  name: et.name,
                  startDate: et.startDate,
                  endDate: et.endDate,
                  actualStartDate: nextActualStart,
                  actualEndDate: nextActualEnd,
                  status: existingTask?.status || statusCast,
                  manualBlocked: existingTask?.manualBlocked ?? statusCast === 'Bloqué',
                  assignee: et.assignee || existingTask?.assignee || '',
                  autorite: existingTask?.autorite || et.responsableTresorerie || '',
                  bailleur: et.responsableTresorerie || existingTask?.bailleur || existingTask?.autorite || '',
                  responsabilite:
                    et.responsabilite || existingTask?.responsabilite || '',
                  budget: fromMillionsToFCFA(et.coutPlanifie),
                  valeurAcquise:
                    et.valeurAcquise !== undefined
                      ? fromMillionsToFCFA(et.valeurAcquise)
                      : undefined,
                  coutReel:
                    et.coutReel !== undefined ? fromMillionsToFCFA(et.coutReel) : undefined,
                  dateDecaissementPrevu:
                    et.dateDecaissementPrevu !== undefined
                      ? et.dateDecaissementPrevu
                      : et.startDate,
                  dateDecaissementReel: et.dateDecaissementReel || '',
                  montantDecaissementPrevu:
                    et.montantDecaissementPrevu !== undefined &&
                    et.montantDecaissementPrevu !== ''
                      ? fromMillionsToFCFA(et.montantDecaissementPrevu)
                      : fromMillionsToFCFA(et.coutPlanifie),
                  montantDecaissementReel:
                    et.montantDecaissementReel !== undefined &&
                    et.montantDecaissementReel !== ''
                      ? fromMillionsToFCFA(et.montantDecaissementReel)
                      : fromMillionsToFCFA(et.coutReel),
                  motifBlocage: et.motifBlocage || '',
                  validated: (existingTask?.status || statusCast) === 'Terminé',
                  antecedent: et.antecedent || existingTask?.antecedent || '—'
                };
              })
            };
          })
        };
      })
    };
  });
}

interface FaabGarEvmTabsProps {
  activeSubTab: 'evm_dashboard' | 'evm_ptba' | 'evm_suivi';
  onChangeSubTab: (tab: 'evm_dashboard' | 'evm_ptba' | 'evm_suivi') => void;
  parentDossiers?: ParentDossier[];
  activeDossierId?: string;
  onSelectDossier?: (id: string) => void;
  onUpdateDossiers?: React.Dispatch<React.SetStateAction<ParentDossier[]>>;
  filterAxeId?: string;
  setFilterAxeId?: (id: string) => void;
  filterProjectId?: string;
  setFilterProjectId?: (id: string) => void;
  language?: LanguageCode;
  currency?: CurrencyCode;
}

export const FaabGarEvmTabs: React.FC<FaabGarEvmTabsProps> = ({
  activeSubTab,
  onChangeSubTab,
  parentDossiers = [],
  activeDossierId,
  onSelectDossier,
  onUpdateDossiers,
  filterAxeId,
  setFilterAxeId,
  filterProjectId,
  setFilterProjectId,
  language = 'FR',
  currency = 'FCFA'
}) => {
  const isEn = language === 'EN';
  const data = useMemo<EvmDossier[]>(() => {
    return convertParentDossiersToEvm(parentDossiers);
  }, [parentDossiers]);

  const setData = (nextData: EvmDossier[]) => {
    if (onUpdateDossiers) {
      onUpdateDossiers(prev => mergeEvmIntoParentDossiers(nextData, prev));
    }
  };

  const initialSelectedDossier =
    activeDossierId && parentDossiers.some(d => d.id === activeDossierId)
      ? activeDossierId
      : parentDossiers[0]?.id || 'FULL';

  const [filterProcessusDossier, setFilterProcessusDossier] =
    useState<string>(initialSelectedDossier);
  const [filterProcessusYear, setFilterProcessusYear] = useState('ALL');
  const [filterProcessusAxe, setFilterProcessusAxe] = useState('FULL');
  const [filterProcessusProj, setFilterProcessusProj] = useState('FULL');
  const [filterProcessusQuarter, setFilterProcessusQuarter] = useState('FULL');
  const [filterProcessusPhase, setFilterProcessusPhase] = useState('ALL');
  const [filterProcessusAssignee, setFilterProcessusAssignee] = useState('ALL');
  const [filterProcessusStatus, setFilterProcessusStatus] = useState('ALL');

  const [filterDashDossier, setFilterDashDossier] = useState<string>(initialSelectedDossier);
  const [filterDashYear, setFilterDashYear] = useState('ALL');
  const [filterDashAxe, setFilterDashAxe] = useState('FULL');
  const [filterDashProj, setFilterDashProj] = useState('FULL');
  const [filterDashQuarter, setFilterDashQuarter] = useState('FULL');

  const [filterPTBADossier, setFilterPTBADossier] = useState<string>(initialSelectedDossier);
  const [filterPTBAYear, setFilterPTBAYear] = useState('ALL');
  const [filterPTBAAxe, setFilterPTBAAxe] = useState('FULL');
  const [filterPTBAProj, setFilterPTBAProj] = useState('FULL');
  const [filterPTBAQuarter, setFilterPTBAQuarter] = useState('FULL');
  const [filterPTBAPhase, setFilterPTBAPhase] = useState('ALL');
  const [filterPTBAAssignee, setFilterPTBAAssignee] = useState('ALL');
  const [filterPTBAStatus, setFilterPTBAStatus] = useState('ALL');

  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const togglePhaseCollapse = (key: string) => {
    setCollapsedPhases(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Synchronize all 4 EVM tabs whenever the programme selector in the Slidebar changes
  useEffect(() => {
    if (activeDossierId && parentDossiers.some(d => d.id === activeDossierId)) {
      setFilterDashDossier(activeDossierId);
      setFilterProcessusDossier(activeDossierId);
      setFilterPTBADossier(activeDossierId);
      setFilterDashAxe('FULL');
      setFilterDashProj('FULL');
      setFilterProcessusAxe('FULL');
      setFilterProcessusProj('FULL');
      setFilterPTBAAxe('FULL');
      setFilterPTBAProj('FULL');
    }
  }, [activeDossierId, parentDossiers.length]);

  // Synchronize with shared Axe / Project filters from App.tsx
  useEffect(() => {
    if (filterAxeId !== undefined) {
      const mappedAxe = filterAxeId === 'ALL' ? 'FULL' : filterAxeId;
      setFilterDashAxe(mappedAxe);
      setFilterProcessusAxe(mappedAxe);
      setFilterPTBAAxe(mappedAxe);
    }
  }, [filterAxeId]);

  useEffect(() => {
    if (filterProjectId !== undefined) {
      const mappedProj = filterProjectId === 'ALL' ? 'FULL' : filterProjectId;
      setFilterDashProj(mappedProj);
      setFilterProcessusProj(mappedProj);
      setFilterPTBAProj(mappedProj);
    }
  }, [filterProjectId]);

  const handleSelectDossierFilter = (dossierId: string) => {
    setFilterDashDossier(dossierId);
    setFilterProcessusDossier(dossierId);
    setFilterPTBADossier(dossierId);
    setFilterDashAxe('FULL');
    setFilterDashProj('FULL');
    setFilterProcessusAxe('FULL');
    setFilterProcessusProj('FULL');
    setFilterPTBAAxe('FULL');
    setFilterPTBAProj('FULL');
    setFilterAxeId?.('ALL');
    setFilterProjectId?.('ALL');
    if (dossierId !== 'FULL') {
      onSelectDossier?.(dossierId);
    }
  };

  const handleSelectAxeFilter = (axeId: string) => {
    setFilterDashAxe(axeId);
    setFilterProcessusAxe(axeId);
    setFilterPTBAAxe(axeId);
    setFilterDashProj('FULL');
    setFilterProcessusProj('FULL');
    setFilterPTBAProj('FULL');
    setFilterAxeId?.(axeId === 'FULL' ? 'ALL' : axeId);
    setFilterProjectId?.('ALL');
  };

  const handleSelectProjFilter = (projId: string) => {
    setFilterDashProj(projId);
    setFilterProcessusProj(projId);
    setFilterPTBAProj(projId);
    setFilterProjectId?.(projId === 'FULL' ? 'ALL' : projId);
  };

  const handleInlineUpdateTask = (
    projectId: string,
    taskId: string,
    patch: Partial<EvmTask>
  ) => {
    const todayISO = getTodayISO();
    if (onUpdateDossiers) {
      onUpdateDossiers(prev =>
        prev.map(d => ({
          ...d,
          axes: (d.axes || []).map(a => ({
            ...a,
            projects: (a.projects || []).map(p => {
              if (p.id !== projectId) return p;
              return {
                ...p,
                tasks: (p.tasks || []).map(tk => {
                  if (tk.id !== taskId) return tk;
                  const budgetFCFA = fromMillionsToFCFA(tk.budget);
                  const nextTask = { ...tk };

                  if (patch.dateDecaissementPrevu !== undefined) {
                    nextTask.dateDecaissementPrevu = patch.dateDecaissementPrevu;
                  }
                  if (patch.dateDecaissementReel !== undefined) {
                    nextTask.dateDecaissementReel = patch.dateDecaissementReel;
                  }
                  if (patch.montantDecaissementReel !== undefined) {
                    const rawDec = Math.max(0, Math.round(Number(patch.montantDecaissementReel) || 0));
                    nextTask.montantDecaissementReel = rawDec;
                    nextTask.coutReel = rawDec;
                    nextTask.valeurAcquise = budgetFCFA > 0 ? Math.min(budgetFCFA, rawDec) : rawDec;
                    if (rawDec > 0 && !nextTask.dateDecaissementReel) {
                      nextTask.dateDecaissementReel = todayISO;
                    }
                  }
                  if (patch.valeurAcquise !== undefined) {
                    const rawVA = Math.max(0, Math.round(Number(patch.valeurAcquise) || 0));
                    nextTask.valeurAcquise = rawVA;
                  }
                  if (patch.coutReel !== undefined) {
                    const rawCR = Math.max(0, Math.round(Number(patch.coutReel) || 0));
                    nextTask.coutReel = rawCR;
                    if (patch.montantDecaissementReel === undefined) {
                      nextTask.montantDecaissementReel = rawCR;
                    }
                  }

                  const currentDec = Number(nextTask.montantDecaissementReel ?? nextTask.coutReel ?? 0);
                  const currentVA = Number(nextTask.valeurAcquise ?? currentDec);
                  const progressVal = Math.max(currentDec, currentVA);

                  if (budgetFCFA > 0) {
                    if (progressVal >= budgetFCFA) {
                      nextTask.status = 'Terminé';
                      nextTask.manualBlocked = false;
                      nextTask.validated = true;
                    } else if (progressVal > 0) {
                      nextTask.status = 'En cours';
                      nextTask.manualBlocked = false;
                      nextTask.validated = false;
                    } else {
                      nextTask.status = 'À faire';
                      nextTask.manualBlocked = false;
                      nextTask.validated = false;
                    }
                  }

                  return nextTask;
                })
              };
            })
          }))
        }))
      );
      return;
    }

    const newData = data.map(d => ({
      ...d,
      axes: (d.axes || []).map(a => ({
        ...a,
        projects: (a.projects || []).map(p =>
          p.id === projectId
            ? {
                ...p,
                tasks: (p.tasks || []).map(t =>
                  t.id === taskId ? { ...t, ...patch } : t
                )
              }
            : p
        )
      }))
    }));
    setData(newData);
  };

  const ptbaAvailableProjects = useMemo(() => {
    const projs: EvmProject[] = [];
    data.forEach(d => {
      if (filterPTBADossier === 'FULL' || d.id === filterPTBADossier) {
        d.axes?.forEach(a => {
          if (filterPTBAAxe === 'FULL' || a.id === filterPTBAAxe) {
            a.projects?.forEach(p => projs.push(p));
          }
        });
      }
    });
    return projs;
  }, [data, filterPTBADossier, filterPTBAAxe]);

  const allProjects = useMemo(() => {
    const projects: EvmProject[] = [];
    data.forEach(dossier => {
      if (Array.isArray(dossier.axes)) {
        dossier.axes.forEach(axe => {
          if (Array.isArray(axe.projects)) {
            axe.projects.forEach(proj => {
              projects.push({
                ...proj,
                dossierName: dossier.name,
                dossierId: dossier.id,
                axeName: axe.name,
                axeId: axe.id,
                isReadOnly: dossier.isReadOnly
              });
            });
          }
        });
      }
    });
    return projects;
  }, [data]);

  const addDossier = () => {
    const currentYear = new Date().getFullYear();
    const newDossier: EvmDossier = {
      id: `dossier-${Date.now()}`,
      name: 'Nouveau Programme Stratégique',
      institution: 'Organisation / Institution',
      isReadOnly: false,
      startYear: currentYear.toString(),
      endYear: (currentYear + 2).toString(),
      axes: [
        {
          id: `axe-${Date.now()}`,
          name: 'Axe 1 : Orientation Stratégique Principale',
          budget: 0,
          projects: [
            {
              id: `proj-${Date.now()}`,
              name: 'Projet 1.1 : Projet Opérationnel Pilote',
              budgetsAnnuels: {},
              tasks: []
            }
          ]
        }
      ]
    };
    setData([...data, newDossier]);
    handleSelectDossierFilter(newDossier.id);
  };

  const updateDossierYear = (dossierId: string, year: string) => {
    const newData = data.map(d => (d.id === dossierId ? { ...d, startYear: year } : d));
    setData(newData);
  };

  const updateDossierEndYear = (dossierId: string, year: string) => {
    const newData = data.map(d => (d.id === dossierId ? { ...d, endYear: year } : d));
    setData(newData);
  };

  const updateDossierInstitution = (dossierId: string, institution: string) => {
    const newData = data.map(d => (d.id === dossierId ? { ...d, institution } : d));
    setData(newData);
  };

  const addAxe = (dossierId: string) => {
    const newData = data.map(d =>
      d.id === dossierId
        ? {
            ...d,
            axes: [
              ...(d.axes || []),
              {
                id: `axe-${Date.now()}`,
                name: `Axe ${(d.axes || []).length + 1} : Nouvelle Composante Stratégique`,
                budget: 0,
                projects: []
              }
            ]
          }
        : d
    );
    setData(newData);
  };

  const addProject = (dossierId: string, axeId: string) => {
    const newData = data.map(d =>
      d.id === dossierId
        ? {
            ...d,
            axes: (d.axes || []).map(a =>
              a.id === axeId
                ? {
                    ...a,
                    projects: [
                      ...(a.projects || []),
                      {
                        id: `proj-${Date.now()}`,
                        name: `Projet ${(a.projects || []).length + 1} : Nouveau Projet Opérationnel`,
                        budgetsAnnuels: {},
                        tasks: []
                      }
                    ]
                  }
                : a
            )
          }
        : d
    );
    setData(newData);
  };

  const updateDossierItemName = (
    dossierId: string,
    axeId: string | null,
    projId: string | null,
    newName: string
  ) => {
    const newData = data.map(d => {
      if (d.id !== dossierId) return d;
      if (projId && axeId) {
        return {
          ...d,
          axes: (d.axes || []).map(a =>
            a.id === axeId
              ? {
                  ...a,
                  projects: (a.projects || []).map(p =>
                    p.id === projId ? { ...p, name: newName } : p
                  )
                }
              : a
          )
        };
      }
      if (axeId) {
        return {
          ...d,
          axes: (d.axes || []).map(a => (a.id === axeId ? { ...a, name: newName } : a))
        };
      }
      return { ...d, name: newName };
    });
    setData(newData);
  };

  const deleteDossier = (dossierId: string) => {
    if (data.length <= 1) return;
    const remaining = data.filter(d => d.id !== dossierId);
    setData(remaining);
    if (filterDashDossier === dossierId && remaining[0]) {
      handleSelectDossierFilter(remaining[0].id);
    }
  };

  const deleteAxe = (dossierId: string, axeId: string) => {
    const newData = data.map(d =>
      d.id === dossierId ? { ...d, axes: (d.axes || []).filter(a => a.id !== axeId) } : d
    );
    setData(newData);
  };

  const deleteProject = (dossierId: string, axeId: string, projId: string) => {
    const newData = data.map(d =>
      d.id === dossierId
        ? {
            ...d,
            axes: (d.axes || []).map(a =>
              a.id === axeId
                ? { ...a, projects: (a.projects || []).filter(p => p.id !== projId) }
                : a
            )
          }
        : d
    );
    setData(newData);
  };

  const getQuarterOverlapDays = (
    startDateStr?: string,
    endDateStr?: string,
    targetYear?: string,
    qIndex?: number
  ): number => {
    if (!startDateStr || !endDateStr || !targetYear || qIndex === undefined) return 0;
    const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
    const start = new Date(sYear, sMonth - 1, sDay).getTime();
    const end = new Date(eYear, eMonth - 1, eDay).getTime();

    const qStart = new Date(parseInt(targetYear), qIndex * 3, 1).getTime();
    const qEnd = new Date(parseInt(targetYear), qIndex * 3 + 3, 0).getTime();

    if (start > qEnd || end < qStart) return 0;
    const overlapStart = Math.max(start, qStart);
    const overlapEnd = Math.min(end, qEnd);
    return Math.max(0, (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1);
  };

  const getYearOverlapDays = (
    startDateStr?: string,
    endDateStr?: string,
    targetYear?: string
  ): number => {
    if (!startDateStr || !endDateStr || !targetYear) return 0;
    const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
    const start = new Date(sYear, sMonth - 1, sDay).getTime();
    const end = new Date(eYear, eMonth - 1, eDay).getTime();

    if (targetYear === 'ALL') {
      return Math.max(0, (end - start) / (1000 * 60 * 60 * 24) + 1);
    }

    const yStart = new Date(parseInt(targetYear), 0, 1).getTime();
    const yEnd = new Date(parseInt(targetYear), 11, 31).getTime();

    if (start > yEnd || end < yStart) return 0;
    const overlapStart = Math.max(start, yStart);
    const overlapEnd = Math.min(end, yEnd);
    return Math.max(0, (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1);
  };

  const getProjectTotalBudget = (proj: EvmProject, isReadOnly?: boolean): number => {
    if (isReadOnly) {
      const annuels = proj.budgetsAnnuels || {};
      return (
        (Number(annuels['2025']) || 0) +
        (Number(annuels['2026']) || 0) +
        (Number(annuels['2027']) || 0)
      );
    }
    return (proj.tasks || []).reduce((sum, t) => sum + (Number(t.coutPlanifie) || 0), 0);
  };

  const getProjectAnnualBudget = (proj: EvmProject, year: string, isReadOnly?: boolean): number => {
    if (isReadOnly) {
      if (year === 'ALL') return getProjectTotalBudget(proj, true);
      return Number(proj.budgetsAnnuels?.[year]) || 0;
    }
    let total = 0;
    if (proj.tasks) {
      proj.tasks.forEach(t => {
        const vp = Number(t.coutPlanifie) || 0;
        if (vp > 0 && t.startDate && t.endDate) {
          const dYear = getYearOverlapDays(t.startDate, t.endDate, year);
          const [sYear, sMonth, sDay] = t.startDate.split('-').map(Number);
          const [eYear, eMonth, eDay] = t.endDate.split('-').map(Number);
          const start = new Date(sYear, sMonth - 1, sDay).getTime();
          const end = new Date(eYear, eMonth - 1, eDay).getTime();
          const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24) + 1);
          total += vp * (dYear / totalDays);
        }
      });
    }
    return Math.round(total);
  };

  const fmtBudget = (val: number | string | undefined | null): string => {
    if (val === 0 || !val) return '0';
    return Number(val).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });
  };

  const fmtFullAmount = (val: number | string | undefined | null): string => {
    const n = Math.round(Number(val) || 0);
    if (n === 0) return '0';
    return n.toLocaleString('fr-FR');
  };

  const renderDashboard = () => {
    let filteredDashProjects = allProjects;
    if (filterDashDossier !== 'FULL')
      filteredDashProjects = filteredDashProjects.filter(p => p.dossierId === filterDashDossier);
    if (filterDashAxe !== 'FULL')
      filteredDashProjects = filteredDashProjects.filter(p => p.axeId === filterDashAxe);
    if (filterDashProj !== 'FULL')
      filteredDashProjects = filteredDashProjects.filter(p => p.id === filterDashProj);

    const filteredDashTasks: (EvmTask & { projectId: string })[] = [];
    filteredDashProjects.forEach(proj => {
      if (Array.isArray(proj.tasks)) {
        proj.tasks.forEach(task => {
          let keep = true;
          if (filterDashYear !== 'ALL') {
            const startYear = task.startDate
              ? new Date(task.startDate).getFullYear().toString()
              : '9999';
            const endYear = task.endDate
              ? new Date(task.endDate).getFullYear().toString()
              : '0000';
            if (!(startYear <= filterDashYear && endYear >= filterDashYear)) keep = false;

            if (keep && filterDashQuarter !== 'FULL') {
              let qOverlap = 0;
              if (filterDashQuarter === 'T1')
                qOverlap = getQuarterOverlapDays(task.startDate, task.endDate, filterDashYear, 0);
              else if (filterDashQuarter === 'T2')
                qOverlap = getQuarterOverlapDays(task.startDate, task.endDate, filterDashYear, 1);
              else if (filterDashQuarter === 'T3')
                qOverlap = getQuarterOverlapDays(task.startDate, task.endDate, filterDashYear, 2);
              else if (filterDashQuarter === 'T4')
                qOverlap = getQuarterOverlapDays(task.startDate, task.endDate, filterDashYear, 3);
              if (qOverlap <= 0) keep = false;
            }
          }
          if (keep) {
            filteredDashTasks.push({ ...task, projectId: proj.id });
          }
        });
      }
    });

    const today = new Date();
    let totalVP = 0;
    let totalVA = 0;
    let totalCR = 0;
    let completedCount = 0;
    let blockedCount = 0;
    let inProgressCount = 0;
    let todoCount = 0;
    let totalDecaissementPrevuADate = 0;
    let totalDecaisse = 0;
    let taskCompletionSum = 0;

    let delayedDisbursementCount = 0;
    let delayedByDateCount = 0;
    let delayedByAmountCount = 0;
    let sumDecaissementDelayDays = 0;

    let minStartCPM: number | null = null;
    let maxEndCPM: number | null = null;

    filteredDashTasks.forEach(t => {
      const vp = Number(t.coutPlanifie) || 0;
      const cr = Number(t.coutReel) || 0;
      const va =
        t.valeurAcquise !== undefined
          ? Number(t.valeurAcquise)
          : t.status === 'Terminé' || t.valideVA
          ? vp
          : 0;
      const decaisse =
        t.montantDecaissementReel !== undefined && t.montantDecaissementReel !== ''
          ? Number(t.montantDecaissementReel)
          : cr;

      totalVP += vp;
      totalCR += cr;
      totalVA += va;
      totalDecaisse += decaisse;

      let logicalStatus = t.status;
      if (logicalStatus !== 'Bloqué') {
        if (vp > 0) {
          if (va >= vp) logicalStatus = 'Terminé';
          else if (va > 0 && va < vp) logicalStatus = 'En cours';
          else if (va <= 0) logicalStatus = 'À faire';
        } else {
          if (va > 0) logicalStatus = 'Terminé';
        }
      }

      if (logicalStatus === 'Terminé') completedCount++;
      else if (logicalStatus === 'Bloqué') blockedCount++;
      else if (logicalStatus === 'En cours') inProgressCount++;
      else todoCount++;

      let taskProg = 0;
      if (vp > 0) taskProg = Math.min(100, (va / vp) * 100);
      else if (logicalStatus === 'Terminé') taskProg = 100;
      taskCompletionSum += taskProg;

      const sDateMs = new Date(t.startDate).getTime();
      const eDateMs = new Date(t.endDate).getTime();
      if (!isNaN(sDateMs)) {
        if (minStartCPM === null || sDateMs < minStartCPM) minStartCPM = sDateMs;
      }
      if (!isNaN(eDateMs)) {
        if (maxEndCPM === null || eDateMs > maxEndCPM) maxEndCPM = eDateMs;
      }

      let isDelayedByDate = false;
      let isDelayedByAmount = false;

      const expectedAmount =
        t.montantDecaissementPrevu !== undefined && t.montantDecaissementPrevu !== ''
          ? Number(t.montantDecaissementPrevu)
          : vp;
      const hasPassedPrevu = t.dateDecaissementPrevu
        ? new Date(t.dateDecaissementPrevu) <= today
        : new Date(t.endDate) <= today;

      if (hasPassedPrevu) {
        totalDecaissementPrevuADate += expectedAmount;
        if (decaisse < expectedAmount) isDelayedByAmount = true;
      }

      if (t.dateDecaissementPrevu) {
        const prevuDate = new Date(t.dateDecaissementPrevu);
        let delayDays = 0;
        if (t.dateDecaissementReel) {
          const reelDate = new Date(t.dateDecaissementReel);
          if (reelDate > prevuDate) {
            isDelayedByDate = true;
            delayDays = Math.ceil((reelDate.getTime() - prevuDate.getTime()) / 86400000);
          }
        } else if (today > prevuDate) {
          isDelayedByDate = true;
          delayDays = Math.ceil((today.getTime() - prevuDate.getTime()) / 86400000);
        }
        if (delayDays > 0) sumDecaissementDelayDays += delayDays;
      }

      if (isDelayedByDate) delayedByDateCount++;
      if (isDelayedByAmount) delayedByAmountCount++;
      if (isDelayedByDate || isDelayedByAmount) delayedDisbursementCount++;
    });

    const sumDecaissementDelay = sumDecaissementDelayDays;
    const cpmDays =
      minStartCPM !== null && maxEndCPM !== null
        ? Math.max(1, Math.ceil((maxEndCPM - minStartCPM) / (1000 * 60 * 60 * 24)) + 1)
        : 0;

    const dashStatsTotal = filteredDashTasks.length;
    const dashGlobalProgress =
      dashStatsTotal > 0 ? Math.round(taskCompletionSum / dashStatsTotal) : 0;

    const dashPieData = [
      { name: isEn ? 'Completed' : 'Terminé', value: completedCount },
      { name: isEn ? 'In Progress' : 'En cours', value: inProgressCount },
      { name: isEn ? 'Blocked' : 'Bloqué', value: blockedCount },
      { name: isEn ? 'To Do' : 'À faire', value: todoCount }
    ];

    const hasFinancialData = totalVP > 0 || totalCR > 0 || totalVA > 0;

    const EC = totalVA - totalCR;
    const ED = totalVA - totalVP;
    const IPC = hasFinancialData
      ? totalCR > 0
        ? (totalVA / totalCR).toFixed(2)
        : totalVA > 0
        ? 'Max'
        : '1.00'
      : '-';
    const IPD = hasFinancialData
      ? totalVP > 0
        ? (totalVA / totalVP).toFixed(2)
        : totalVA > 0
        ? 'Max'
        : '1.00'
      : '-';

    let ecStatus;
    if (!hasFinancialData)
      ecStatus = {
        label: 'N/A',
        desc: isEn ? 'Awaiting budgeting.' : 'En attente de budgétisation.',
        color: 'text-slate-400',
        bg: 'bg-slate-100',
        tooltip: isEn ? 'No financial data available.' : "Aucune donnée financière n'est disponible."
      };
    else if (EC > 0)
      ecStatus = {
        label: isEn ? 'Favorable' : 'Favorable',
        desc: isEn ? 'Under budget, the project costs less than planned.' : 'Sous le budget, le projet coûte moins que prévu.',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        tooltip: isEn ? 'CV (Cost Variance) = EV - AC' : 'EC (Écart Coût) = VA - CR'
      };
    else if (EC < 0)
      ecStatus = {
        label: isEn ? 'Unfavorable' : 'Défavorable',
        desc: isEn ? 'Budget overrun, the project costs more than planned.' : 'Dépassement budgétaire, le projet coûte plus que prévu.',
        color: 'text-red-600',
        bg: 'bg-red-50',
        tooltip: isEn ? 'CV (Cost Variance) = EV - AC' : 'EC (Écart Coût) = VA - CR'
      };
    else
      ecStatus = {
        label: isEn ? 'Compliant' : 'Conforme',
        desc: isEn ? 'The project strictly adheres to the budget.' : 'Le projet respecte strictement le budget.',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        tooltip: isEn ? 'CV (Cost Variance) = EV - AC' : 'EC (Écart Coût) = VA - CR'
      };

    let edStatus;
    if (!hasFinancialData)
      edStatus = {
        label: 'N/A',
        desc: isEn ? 'Awaiting budgeting.' : 'En attente de budgétisation.',
        color: 'text-slate-400',
        bg: 'bg-slate-100',
        tooltip: isEn ? 'No financial data available.' : "Aucune donnée financière n'est disponible."
      };
    else if (ED > 0)
      edStatus = {
        label: isEn ? 'Favorable' : 'Favorable',
        desc: isEn ? 'Ahead of schedule.' : 'Avance sur le planning.',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        tooltip: isEn ? 'SV (Schedule Variance) = EV - PV' : 'ED (Écart Délai) = VA - VP'
      };
    else if (ED < 0)
      edStatus = {
        label: isEn ? 'Unfavorable' : 'Défavorable',
        desc: isEn ? 'Behind schedule.' : 'Retard par rapport au planning.',
        color: 'text-red-600',
        bg: 'bg-red-50',
        tooltip: isEn ? 'SV (Schedule Variance) = EV - PV' : 'ED (Écart Délai) = VA - VP'
      };
    else
      edStatus = {
        label: isEn ? 'Compliant' : 'Conforme',
        desc: isEn ? 'The project is on schedule.' : 'Le projet est en ligne avec le planning.',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        tooltip: isEn ? 'SV (Schedule Variance) = EV - PV' : 'ED (Écart Délai) = VA - VP'
      };

    const ipcNum = parseFloat(IPC);
    let ipcStatus;
    if (!hasFinancialData)
      ipcStatus = { label: 'N/A', desc: isEn ? 'Pending.' : 'En attente.', color: 'text-slate-400', tooltip: '' };
    else if (isNaN(ipcNum) || ipcNum === 1)
      ipcStatus = {
        label: isEn ? 'Compliant' : 'Conforme',
        desc: isEn ? 'Project is on budget.' : 'Le projet est exactement sur le budget.',
        color: 'text-blue-600',
        tooltip: isEn ? 'CPI (Cost Performance Index) = EV / AC' : 'IPC (Indice de Performance Coût) = VA / CR'
      };
    else if (ipcNum > 1)
      ipcStatus = {
        label: isEn ? 'Favorable' : 'Favorable',
        desc: isEn ? 'High efficiency, under budget.' : 'Efficacité élevée, sous le budget.',
        color: 'text-emerald-600',
        tooltip: isEn ? 'CPI (Cost Performance Index) = EV / AC' : 'IPC (Indice de Performance Coût) = VA / CR'
      };
    else
      ipcStatus = {
        label: isEn ? 'Unfavorable' : 'Défavorable',
        desc: isEn ? 'Inefficiency, cost overrun.' : 'Inefficacité, dépassement de coûts.',
        color: 'text-red-600',
        tooltip: isEn ? 'CPI (Cost Performance Index) = EV / AC' : 'IPC (Indice de Performance Coût) = VA / CR'
      };

    const ipdNum = parseFloat(IPD);
    let ipdStatus;
    if (!hasFinancialData)
      ipdStatus = { label: 'N/A', desc: isEn ? 'Pending.' : 'En attente.', color: 'text-slate-400', tooltip: '' };
    else if (isNaN(ipdNum) || ipdNum === 1)
      ipdStatus = {
        label: isEn ? 'Compliant' : 'Conforme',
        desc: isEn ? 'Project is on schedule.' : 'Le projet respecte le planning.',
        color: 'text-blue-600',
        tooltip: isEn ? 'SPI (Schedule Performance Index) = EV / PV' : 'IPD (Indice de Performance Délai) = VA / VP'
      };
    else if (ipdNum > 1)
      ipdStatus = {
        label: isEn ? 'Favorable' : 'Favorable',
        desc: isEn ? 'Project progressing faster than planned.' : 'Le projet progresse plus vite que prévu.',
        color: 'text-emerald-600',
        tooltip: isEn ? 'SPI (Schedule Performance Index) = EV / PV' : 'IPD (Indice de Performance Délai) = VA / VP'
      };
    else
      ipdStatus = {
        label: isEn ? 'Unfavorable' : 'Défavorable',
        desc: isEn ? 'Project progressing slower than planned, delayed.' : 'Le projet progresse moins vite que prévu, retard.',
        color: 'text-red-600',
        tooltip: isEn ? 'SPI (Schedule Performance Index) = EV / PV' : 'IPD (Indice de Performance Délai) = VA / VP'
      };

    const ecartDecaissement = totalDecaisse - totalDecaissementPrevuADate;
    const tauxRespectDecaissement =
      totalDecaissementPrevuADate > 0
        ? Math.round((totalDecaisse / totalDecaissementPrevuADate) * 100)
        : totalDecaisse > 0
        ? 100
        : 0;

    const timeSeries: Record<
      string,
      { month: string; vp: number; va: number; cr: number; decPrevu: number; decReel: number }
    > = {};

    filteredDashTasks.forEach(t => {
      const s = t.startDate ? new Date(t.startDate) : today;
      const e = t.endDate ? new Date(t.endDate) : today;
      const safeE = new Date(Math.max(s.getTime(), e.getTime()));

      const vp = Number(t.coutPlanifie) || 0;
      const cr = Number(t.coutReel) || 0;
      const va =
        t.valeurAcquise !== undefined
          ? Number(t.valeurAcquise)
          : t.status === 'Terminé' || t.valideVA
          ? vp
          : 0;

      let logicalStatus = t.status;
      if (logicalStatus !== 'Bloqué') {
        if (vp > 0) {
          if (va >= vp) logicalStatus = 'Terminé';
          else if (va > 0 && va < vp) logicalStatus = 'En cours';
          else if (va <= 0) logicalStatus = 'À faire';
        } else {
          if (va > 0) logicalStatus = 'Terminé';
        }
      }

      const isDone = logicalStatus === 'Terminé' || t.valideVA;
      const actualEndRaw = isDone && t.dateVA ? new Date(t.dateVA) : today;
      const safeActualEnd = new Date(Math.max(s.getTime(), actualEndRaw.getTime()));

      if (isNaN(s.getTime()) || isNaN(safeE.getTime())) return;

      const durationVP = Math.max(1, Math.floor((safeE.getTime() - s.getTime()) / 86400000) + 1);
      const vpPerDay = vp / durationVP;

      const durationActual = Math.max(
        1,
        Math.floor((safeActualEnd.getTime() - s.getTime()) / 86400000) + 1
      );
      const crPerDay = cr / durationActual;

      const totalEstimatedVA =
        t.valeurAcquise !== undefined
          ? Number(t.valeurAcquise)
          : isDone
          ? vp
          : vp * Math.min(1, durationActual / durationVP);
      const vaPerDay = totalEstimatedVA / durationActual;

      for (const d = new Date(s); d <= safeE; d.setDate(d.getDate() + 1)) {
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!timeSeries[m])
          timeSeries[m] = { month: m, vp: 0, va: 0, cr: 0, decPrevu: 0, decReel: 0 };
        timeSeries[m].vp += vpPerDay;
      }

      if (logicalStatus !== 'À faire') {
        for (const d = new Date(s); d <= safeActualEnd; d.setDate(d.getDate() + 1)) {
          const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!timeSeries[m])
            timeSeries[m] = { month: m, vp: 0, va: 0, cr: 0, decPrevu: 0, decReel: 0 };
          timeSeries[m].cr += crPerDay;
          timeSeries[m].va += vaPerDay;
        }
      }

      if (t.dateDecaissementPrevu) {
        const dp = new Date(t.dateDecaissementPrevu);
        if (!isNaN(dp.getTime())) {
          const m = `${dp.getFullYear()}-${String(dp.getMonth() + 1).padStart(2, '0')}`;
          if (!timeSeries[m])
            timeSeries[m] = { month: m, vp: 0, va: 0, cr: 0, decPrevu: 0, decReel: 0 };
          const prevuAmount =
            t.montantDecaissementPrevu !== undefined && t.montantDecaissementPrevu !== ''
              ? Number(t.montantDecaissementPrevu)
              : vp;
          timeSeries[m].decPrevu += prevuAmount;
        }
      }

      if (t.dateDecaissementReel) {
        const dr = new Date(t.dateDecaissementReel);
        if (!isNaN(dr.getTime())) {
          const m = `${dr.getFullYear()}-${String(dr.getMonth() + 1).padStart(2, '0')}`;
          if (!timeSeries[m])
            timeSeries[m] = { month: m, vp: 0, va: 0, cr: 0, decPrevu: 0, decReel: 0 };
          const decaisse =
            t.montantDecaissementReel !== undefined && t.montantDecaissementReel !== ''
              ? Number(t.montantDecaissementReel)
              : cr;
          timeSeries[m].decReel += decaisse;
        }
      }
    });

    const sortedMonths = Object.keys(timeSeries).sort();
    let cVP = 0,
      cVA = 0,
      cCR = 0;
    const sCurveData = sortedMonths.map(m => {
      cVP += timeSeries[m].vp;
      cVA += timeSeries[m].va;
      cCR += timeSeries[m].cr;
      const dateObj = new Date(m + '-01');
      return {
        label: dateObj.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        vpMensuel: Math.round(timeSeries[m].vp),
        crMensuel: Math.round(timeSeries[m].cr),
        vaMensuel: Math.round(timeSeries[m].va),
        decPrevuMensuel: Math.round(timeSeries[m].decPrevu || 0),
        decReelMensuel: Math.round(timeSeries[m].decReel || 0),
        cumulVP: Math.round(cVP),
        cumulVA: Math.round(cVA),
        cumulCR: Math.round(cCR)
      };
    });

    const selectedDashDossier = data.find(d => d.id === filterDashDossier);
    const defaultYear = selectedDashDossier ? selectedDashDossier.startYear : 'ALL';
    const targetPieYear = filterDashYear !== 'ALL' ? filterDashYear : defaultYear || 'ALL';

    const ptba2025Data: { name: string; value: number; fullName: string }[] = [];
    data.forEach(dossier => {
      if (filterDashDossier !== 'FULL' && dossier.id !== filterDashDossier) return;
      if (dossier.axes) {
        dossier.axes.forEach(axe => {
          if (filterDashAxe !== 'FULL' && axe.id !== filterDashAxe) return;

          if (filterDashProj !== 'FULL') {
            if (axe.projects) {
              axe.projects.forEach(p => {
                if (p.id !== filterDashProj) return;
                if (p.tasks) {
                  p.tasks.forEach(t => {
                    const vp = Number(t.coutPlanifie) || 0;
                    if (vp > 0 && t.startDate && t.endDate) {
                      const dYear = getYearOverlapDays(t.startDate, t.endDate, targetPieYear);
                      const [sYear, sMonth, sDay] = t.startDate.split('-').map(Number);
                      const [eYear, eMonth, eDay] = t.endDate.split('-').map(Number);
                      const start = new Date(sYear, sMonth - 1, sDay).getTime();
                      const end = new Date(eYear, eMonth - 1, eDay).getTime();
                      const totalDays = Math.max(
                        1,
                        (end - start) / (1000 * 60 * 60 * 24) + 1
                      );
                      const taskBYear = vp * (dYear / totalDays);

                      if (taskBYear > 0) {
                        ptba2025Data.push({
                          name: t.name,
                          value: Math.round(taskBYear),
                          fullName: t.name
                        });
                      }
                    }
                  });
                }
              });
            }
          } else if (filterDashAxe !== 'FULL') {
            if (axe.projects) {
              axe.projects.forEach(p => {
                const projBYear = getProjectAnnualBudget(p, targetPieYear, dossier.isReadOnly);
                if (projBYear > 0) {
                  ptba2025Data.push({ name: p.name, value: projBYear, fullName: p.name });
                }
              });
            }
          } else {
            let axeBYear = 0;
            if (axe.projects) {
              axe.projects.forEach(p => {
                axeBYear += getProjectAnnualBudget(p, targetPieYear, dossier.isReadOnly);
              });
            }
            if (axeBYear > 0) {
              ptba2025Data.push({ name: axe.name, value: axeBYear, fullName: axe.name });
            }
          }
        });
      }
    });

    const dossierAxes = selectedDashDossier?.axes || [];
    const dashAvailableProjects = allProjects
      .filter(p => filterDashDossier === 'FULL' || p.dossierId === filterDashDossier)
      .filter(p => filterDashAxe === 'FULL' || p.axeId === filterDashAxe);

    return (
      <div className="space-y-2.5 sm:space-y-5">
        {/* Shared Macro Filter Bar (Exact same buttons, style & font size as Tableau de Bord Décisionnel) */}
        <div className="bg-white dark:bg-slate-900 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-800 p-1 sm:p-1.5 md:p-2.5 shadow-xs mb-1.5 sm:mb-3">
          <div className="grid grid-cols-2 gap-1 sm:gap-2 items-center">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 md:px-2.5 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 sm:h-7 md:h-auto">
              <Filter className="hidden sm:block w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '1. Strategic Axis' : '1. Axe Stratégique'}
                </label>
                <select
                  value={filterDashAxe}
                  onChange={e => handleSelectAxeFilter(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight"
                >
                  <option value="FULL">{isEn ? `Axis: All (${dossierAxes.length})` : `Axe : Tous (${dossierAxes.length})`}</option>
                  {dossierAxes.map(axe => (
                    <option key={axe.id} value={axe.id}>
                      {axe.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 md:px-2.5 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 sm:h-7 md:h-auto">
              <Briefcase className="hidden sm:block w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '2. Operational Project' : '2. Projet Opérationnel'}
                </label>
                <select
                  value={filterDashProj}
                  onChange={e => handleSelectProjFilter(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight"
                >
                  <option value="FULL">{isEn ? `Project: All (${dashAvailableProjects.length})` : `Projet : Tous (${dashAvailableProjects.length})`}</option>
                  {dashAvailableProjects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards EVM (Exact same presentation, borders & font sizes as Tableau de Bord Décisionnel) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-1.5 sm:gap-3">
          {/* 1. Avancement */}
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#0c4a6e] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
                <span className="truncate">{isEn ? 'Progress' : 'Avancement'}</span>
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-[#0284c7] shrink-0" />
              </div>
              <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                {dashGlobalProgress}%
              </div>
              <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-slate-500 truncate leading-tight">
                {dashStatsTotal} {isEn ? 'Item(s)' : 'Élément(s)'} • CPM : {cpmDays}{isEn ? 'd' : 'j'}
              </div>
            </div>
            <div className="w-full h-1 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 sm:mt-2">
              <div
                className="h-full bg-[#0284c7]"
                style={{ width: `${Math.min(100, dashGlobalProgress)}%` }}
              />
            </div>
          </div>

          {/* 2. Valeur Acquise (VA) & Écart de Coût */}
          <div
            className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-emerald-500 shadow-xs flex flex-col justify-between"
            title={ecStatus.tooltip}
          >
            <div>
              <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
                <span className="truncate">{isEn ? 'Earned Value (EV)' : 'Valeur Acquise (VA)'}</span>
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              </div>
              <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight truncate">
                {fmtBudget(totalVA)} M
              </div>
            </div>
            <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-slate-500 truncate leading-tight flex items-center justify-between gap-1">
              <span className="truncate">
                {isEn ? 'CV : ' : 'EC : '}
                <strong className={ecStatus.color}>
                  {!hasFinancialData ? '-' : `${EC > 0 ? '+' : ''}${fmtBudget(EC)} M`}
                </strong>
              </span>
              <span
                className={`text-[7.5px] sm:text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${ecStatus.bg} ${ecStatus.color}`}
              >
                {ecStatus.label}
              </span>
            </div>
          </div>

          {/* 3. Valeur Prévue (VP) & Écart de Délai */}
          <div
            className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#0284c7] shadow-xs flex flex-col justify-between"
            title={edStatus.tooltip}
          >
            <div>
              <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
                <span className="truncate">{isEn ? 'Budget / PV' : 'Budget / VP'}</span>
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-[#0284c7] shrink-0" />
              </div>
              <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                {fmtBudget(totalVP)} M
              </div>
            </div>
            <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-slate-500 truncate leading-tight flex items-center justify-between gap-1">
              <span className="truncate">
                {isEn ? 'SV : ' : 'ED : '}
                <strong className={edStatus.color}>
                  {!hasFinancialData ? '-' : `${ED > 0 ? '+' : ''}${fmtBudget(ED)} M`}
                </strong>
              </span>
              <span
                className={`text-[7.5px] sm:text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${edStatus.bg} ${edStatus.color}`}
              >
                {edStatus.label}
              </span>
            </div>
          </div>

          {/* 4. Coût Réel (CR) */}
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
                <span className="truncate">{isEn ? 'Actual Cost (AC)' : 'Coût Réel (CR)'}</span>
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              </div>
              <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-amber-600 dark:text-amber-400 leading-tight truncate">
                {fmtBudget(totalCR)} M
              </div>
            </div>
            <div className="w-full h-1 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 sm:mt-2">
              <div
                className="h-full bg-amber-500"
                style={{
                  width: `${totalVP > 0 ? Math.min(100, (totalCR / totalVP) * 100) : 0}%`
                }}
              />
            </div>
          </div>

          {/* 5. Indices de Performance (IPC / IPD) */}
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#90D5FF] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
              <span className="truncate">{isEn ? 'EVM Indices' : 'Indices EVM'}</span>
              <Layers className="w-3 h-3 sm:w-4 sm:h-4 text-[#0284c7] shrink-0" />
            </div>
            <div className="mt-0.5 sm:mt-1.5 text-xs sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
              {isEn ? 'CPI' : 'IPC'} : <span className={ipcStatus.color}>{IPC}</span> • {isEn ? 'SPI' : 'IPD'} :{' '}
              <span className={ipdStatus.color}>{IPD}</span>
            </div>
            <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-slate-500 truncate leading-tight">
              {isEn ? 'Cost' : 'Coût'} : {ipcStatus.label} • {isEn ? 'Schedule' : 'Délai'} : {ipdStatus.label}
            </div>
          </div>

          {/* 6. Suivi Décaissements */}
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#0284c7] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
              <span className="truncate">{isEn ? 'Disbursements' : 'Décaissements'}</span>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#0284c7] shrink-0" />
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-[#0284c7] dark:text-[#90D5FF] leading-tight truncate">
              {tauxRespectDecaissement}%
            </div>
            <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-slate-500 truncate leading-tight">
              {!hasFinancialData
                ? (isEn ? 'Pending' : 'En attente')
                : sumDecaissementDelay > 0
                ? (isEn ? `${sumDecaissementDelay}d late (${delayedDisbursementCount})` : `${sumDecaissementDelay}j de retard (${delayedDisbursementCount})`)
                : (isEn ? 'Disbursements up to date' : 'Décaissements à jour')}
            </div>
          </div>
        </div>

        {/* Statuts Opérationnels & Retards Décaissement (Même style et taille de police que Tableau de Bord Décisionnel) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-3">
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#0c4a6e] shadow-xs">
            <div className="text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight truncate">
              {isEn ? 'Activities & Milestones' : 'Activités & Jalons'}
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {dashStatsTotal}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-emerald-500 shadow-xs">
            <div className="text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight truncate">
              {isEn ? 'Completed' : 'Terminées'}
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              {completedCount}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-[#0284c7] shadow-xs">
            <div className="text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight truncate">
              {isEn ? 'In Progress' : 'En Cours'}
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-[#0284c7] dark:text-[#90D5FF] leading-tight">
              {inProgressCount}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-rose-500 shadow-xs">
            <div className="text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight truncate">
              {isEn ? 'Blocked' : 'Bloqués'}
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-rose-600 dark:text-rose-400 leading-tight">
              {blockedCount}
            </div>
          </div>
          <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 sm:border-l-4 border-l-amber-500 shadow-xs">
            <div className="flex items-center justify-between text-[8.5px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight">
              <span className="truncate">{isEn ? 'Disbursement Delay' : 'Retard Décaissement'}</span>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            </div>
            <div className="mt-0.5 sm:mt-2 text-xs sm:text-2xl font-black text-amber-600 dark:text-amber-400 leading-tight">
              {delayedDisbursementCount}
            </div>
            <div className="mt-0.5 sm:mt-1 text-[8px] sm:text-[11px] text-slate-500 truncate leading-tight">
              {isEn ? 'Delay' : 'Délai'} : {delayedByDateCount || 0} • {isEn ? 'Amount' : 'Montant'} : {delayedByAmountCount || 0}
            </div>
          </div>
        </div>

        {/* Graphiques EVM (Même style de cartes et taille de police que Tableau de Bord Décisionnel) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm">
            <h3 className="text-[11px] sm:text-base font-extrabold text-slate-800 dark:text-white mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-[#90D5FF] shrink-0" />
              <span>{isEn ? 'Periodic Evolution (EVM & Disbursements)' : 'Évolution Périodique (EVM & Décaissements)'}</span>
            </h3>
            <div className="h-56 sm:h-64">
              {sCurveData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${v}M`}
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Bar
                      dataKey="vpMensuel"
                      name={isEn ? 'Budget / PV' : 'Budget / VP'}
                      fill="#3b82f6"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="vaMensuel"
                      name={isEn ? 'Earned Value (EV)' : 'Valeur Acquise (VA)'}
                      fill="#10b981"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="crMensuel"
                      name={isEn ? 'Actual Cost (AC)' : 'Coût Réel (CR)'}
                      fill="#f59e0b"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="decPrevuMensuel"
                      name={isEn ? 'Planned Budget' : 'Budget Prévu'}
                      fill="#0284c7"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="decReelMensuel"
                      name={isEn ? 'Actual Disbursement' : 'Décaissement Réel'}
                      fill="#14b8a6"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  {isEn ? 'Insufficient timeline data or empty dossier' : 'Données temporelles insuffisantes ou dossier vide'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm">
            <h3 className="text-[11px] sm:text-base font-extrabold text-slate-800 dark:text-white mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-[#90D5FF] shrink-0" />
              <span>{isEn ? 'Earned Value Analysis (S-Curve)' : 'Analyse de la Valeur Acquise (Courbe en S)'}</span>
            </h3>
            <div className="h-56 sm:h-64">
              {sCurveData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={sCurveData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${v}M`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      iconType="plainline"
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulVP"
                      name={isEn ? 'Planned Value (PV)' : 'Valeur Planifiée (VP)'}
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulVA"
                      name={isEn ? 'Earned Value (EV)' : 'Valeur Acquise (VA)'}
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulCR"
                      name={isEn ? 'Actual Cost (AC)' : 'Coût Réel (CR)'}
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  {isEn ? 'Insufficient timeline data or empty dossier' : 'Données temporelles insuffisantes ou dossier vide'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm">
            <h3 className="text-[11px] sm:text-base font-extrabold text-slate-800 dark:text-white mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-[#90D5FF] shrink-0" />
              <span>
                {isEn
                  ? `AWPB Breakdown (Programmed Budget ${targetPieYear === 'ALL' ? 'Global' : targetPieYear})`
                  : `Répartition PTBA (Budget Programmé ${targetPieYear === 'ALL' ? 'Global' : targetPieYear})`}
              </span>
            </h3>
            <div className="h-52 sm:h-60">
              {ptba2025Data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ptba2025Data}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {ptba2025Data.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v: any) => `${fmtBudget(v)} M`} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  {isEn ? 'No programmed budget for this selection' : 'Aucun budget programmé pour cette sélection'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-5 shadow-sm">
            <h3 className="text-[11px] sm:text-base font-extrabold text-slate-800 dark:text-white mb-1.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-[#90D5FF] shrink-0" />
              <span>{isEn ? 'Task Execution Status' : "Statut d'exécution des Tâches"}</span>
            </h3>
            <div className="h-52 sm:h-60">
              {dashStatsTotal > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashPieData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {dashPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9CA3AF'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  {isEn ? 'No tasks registered in this dossier' : 'Aucune tâche enregistrée dans ce dossier'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectManager = () => {
    const displayedDossiers = data.filter(
      d => filterDashDossier === 'FULL' || d.id === filterDashDossier
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 border-violet-200 shrink-0 gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center">
              <Folder className="w-6 h-6 mr-2 text-violet-600" />
              Programmes Stratégiques
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Structurez vos portefeuilles, composantes et projets institutionnels
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <select
                className="w-full appearance-none bg-white border border-violet-300 text-slate-800 text-xs font-bold rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 py-2 pl-3 pr-8 outline-none shadow-xs cursor-pointer"
                value={filterDashDossier}
                onChange={e => handleSelectDossierFilter(e.target.value)}
              >
                <option value="FULL">Tous les programmes</option>
                {data.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-violet-500 absolute right-2.5 top-2.5 rotate-90 pointer-events-none" />
            </div>
            <button
              onClick={addDossier}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> Nouveau Programme
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {displayedDossiers.map(dossier => {
            const startY = parseInt(String(dossier.startYear)) || 2026;
            const dossierYears = [String(startY), String(startY + 1), String(startY + 2)];

            return (
              <div
                key={dossier.id}
                className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden"
              >
                <div className="px-5 py-4 flex flex-col lg:flex-row lg:justify-between lg:items-end text-white gap-4 transition-colors bg-violet-700">
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row gap-4 w-full items-end">
                      <div className="flex-1 w-full">
                        <label className="text-[10px] font-bold text-violet-100 uppercase tracking-wider mb-1.5 block">
                          Nom du Programme
                        </label>
                        <div className="flex items-center w-full">
                          <FolderTree className="w-6 h-6 mr-3 text-violet-100 shrink-0" />
                          <input
                            className="bg-transparent border-b border-violet-400 focus:border-white outline-none w-full placeholder-violet-200 text-white font-bold text-lg pb-1"
                            value={dossier.name}
                            onChange={e =>
                              updateDossierItemName(dossier.id, null, null, e.target.value)
                            }
                            placeholder="Saisissez le nom du programme..."
                          />
                        </div>
                      </div>
                      <div className="flex-1 w-full sm:w-1/3">
                        <label className="text-[10px] font-bold text-violet-100 uppercase tracking-wider mb-1.5 block">
                          Institution Rattachée
                        </label>
                        <div className="flex items-center w-full">
                          <Building2 className="w-5 h-5 mr-2 text-violet-100 shrink-0" />
                          <input
                            className="bg-transparent border-b border-violet-400 focus:border-white outline-none w-full placeholder-violet-200 text-white font-bold text-sm pb-1"
                            value={dossier.institution || ''}
                            onChange={e => updateDossierInstitution(dossier.id, e.target.value)}
                            placeholder="Ex: Ministère, ONG, Entreprise..."
                          />
                        </div>
                      </div>
                      <div className="w-24 shrink-0">
                        <label className="text-[10px] font-bold text-violet-100 uppercase tracking-wider mb-1.5 block">
                          Année (Début)
                        </label>
                        <input
                          type="number"
                          className="w-full bg-white text-violet-900 border-none outline-none rounded p-1.5 font-bold text-sm text-center shadow-inner focus:ring-2 focus:ring-violet-300"
                          value={dossier.startYear || ''}
                          onChange={e => updateDossierYear(dossier.id, e.target.value)}
                          placeholder="Ex: 2026"
                        />
                      </div>
                      <div className="w-24 shrink-0">
                        <label className="text-[10px] font-bold text-violet-100 uppercase tracking-wider mb-1.5 block">
                          Année (Fin)
                        </label>
                        <input
                          type="number"
                          className="w-full bg-white text-violet-900 border-none outline-none rounded p-1.5 font-bold text-sm text-center shadow-inner focus:ring-2 focus:ring-violet-300"
                          value={
                            dossier.endYear ||
                            (dossier.startYear ? Number(dossier.startYear) + 2 : '')
                          }
                          onChange={e => updateDossierEndYear(dossier.id, e.target.value)}
                          placeholder="Ex: 2028"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 mt-2 lg:mt-0">
                    <button
                      onClick={() => {
                        handleSelectDossierFilter(dossier.id);
                        onChangeSubTab('evm_suivi');
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition-colors cursor-pointer"
                    >
                      <Activity className="w-4 h-4 mr-1.5" /> Suivi EVM
                    </button>

                    <button
                      onClick={() => addAxe(dossier.id)}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition-colors ml-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Composante
                    </button>
                    <button
                      onClick={() => deleteDossier(dossier.id)}
                      className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                      title="Supprimer ce programme"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {(!dossier.axes || dossier.axes.length === 0) && (
                    <div className="text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-8">
                      <p className="text-slate-500 text-sm mb-4 font-medium">
                        Ce programme est vide. Créez une composante stratégique pour commencer.
                      </p>
                      <button
                        onClick={() => addAxe(dossier.id)}
                        className="bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm inline-flex items-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Créer une Composante
                      </button>
                    </div>
                  )}
                  {dossier.axes &&
                    dossier.axes.map(axe => {
                      const computedAxeBudget = (axe.projects || []).reduce(
                        (acc, proj) => acc + getProjectTotalBudget(proj, dossier.isReadOnly),
                        0
                      );

                      return (
                        <div
                          key={axe.id}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-4 group/axe relative"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-3 mb-4 gap-3">
                            <div className="flex items-center flex-1 max-w-xl">
                              <Target className="w-5 h-5 mr-2 text-violet-600 shrink-0" />
                              <div className="flex items-center w-full">
                                <input
                                  className="font-bold text-slate-800 text-base bg-white border border-dashed border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none w-full px-2 py-1 rounded"
                                  value={axe.name}
                                  onChange={e =>
                                    updateDossierItemName(dossier.id, axe.id, null, e.target.value)
                                  }
                                  placeholder="Nom de la composante..."
                                  readOnly={dossier.isReadOnly}
                                />
                                {!dossier.isReadOnly && (
                                  <button
                                    onClick={() => deleteAxe(dossier.id, axe.id)}
                                    className="ml-2 text-slate-400 hover:text-red-500 p-1.5 bg-white rounded shadow-sm opacity-0 group-hover/axe:opacity-100 transition-opacity cursor-pointer"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-sm bg-white border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center">
                                <DollarSign className="w-4 h-4 mr-1 text-violet-600" />
                                <input
                                  type="number"
                                  className="w-24 outline-none bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-right mr-2 text-slate-500 cursor-not-allowed font-semibold"
                                  value={computedAxeBudget}
                                  readOnly
                                />
                                <span>M / Monnaie</span>
                              </div>
                              <button
                                onClick={() => addProject(dossier.id, axe.id)}
                                className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-800 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center shrink-0 shadow-sm cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Projet
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(!axe.projects || axe.projects.length === 0) && (
                              <div className="col-span-full flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-xl py-6">
                                <p className="text-slate-400 text-sm italic mb-3">
                                  Aucun projet n&apos;a encore été ajouté.
                                </p>
                                <button
                                  onClick={() => addProject(dossier.id, axe.id)}
                                  className="bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center shadow-sm cursor-pointer"
                                >
                                  <Plus className="w-4 h-4 mr-2" /> Créer le premier projet
                                </button>
                              </div>
                            )}
                            {axe.projects &&
                              axe.projects.map(proj => {
                                const projBudget = getProjectTotalBudget(proj, dossier.isReadOnly);

                                return (
                                  <div
                                    key={proj.id}
                                    className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative group"
                                  >
                                    <button
                                      onClick={() => deleteProject(dossier.id, axe.id, proj.id)}
                                      className="absolute top-2 right-2 text-slate-300 hover:text-white hover:bg-red-500 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer"
                                      title="Supprimer ce projet"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="mb-4 pr-6">
                                      <div className="flex items-start mb-2">
                                        <Edit3 className="w-3 h-3 text-violet-500 mr-1.5 mt-1 shrink-0" />
                                        <textarea
                                          className="font-bold text-slate-700 text-sm bg-slate-50 border border-slate-200 outline-none w-full resize-none focus:ring-1 focus:ring-violet-400 focus:bg-white rounded p-1.5"
                                          rows={2}
                                          value={proj.name}
                                          onChange={e =>
                                            updateDossierItemName(
                                              dossier.id,
                                              axe.id,
                                              proj.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder="Nom du projet..."
                                          readOnly={dossier.isReadOnly}
                                        />
                                      </div>
                                      <div className="text-xs text-slate-500 flex items-center mt-2 bg-slate-50 px-2 py-1.5 rounded border border-slate-100 w-max mb-3">
                                        <DollarSign className="w-3.5 h-3.5 mr-1 text-violet-600" />
                                        Budget projet :{' '}
                                        <strong className="ml-1 text-slate-700">
                                          {projBudget} M
                                        </strong>
                                      </div>

                                      <div className="bg-slate-100/60 rounded-lg p-2.5 border border-slate-200">
                                        <div className="font-bold text-slate-500 mb-2 flex items-center text-[9px] uppercase tracking-wider">
                                          <Calendar className="w-3 h-3 mr-1 text-violet-500" />{' '}
                                          Répartition par Tâches
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {dossierYears.map(year => (
                                            <div
                                              key={year}
                                              className="bg-white rounded border border-slate-200 p-1.5 flex flex-col items-center shadow-sm"
                                            >
                                              <span className="text-[9px] font-bold text-slate-400 mb-0.5">
                                                {year}
                                              </span>
                                              <span className="font-bold text-[10px] text-violet-700 bg-violet-50/80 px-2 py-0.5 rounded w-full text-center">
                                                {fmtBudget(getProjectAnnualBudget(proj, year, false))}{' '}
                                                M
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        handleSelectDossierFilter(dossier.id);
                                        handleSelectAxeFilter(axe.id);
                                        handleSelectProjFilter(proj.id);
                                        onChangeSubTab('evm_suivi');
                                      }}
                                      className="w-full text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 py-2 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                    >
                                      <Activity className="w-3.5 h-3.5 mr-1.5" /> Suivi & Tableau PTBA
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPTBA = () => {
    const selectedPTBADossier =
      data.find(d => d.id === (activeDossierId || filterPTBADossier)) ||
      data.find(d => d.id === filterPTBADossier) ||
      data[0];
    const baseStartY = parseInt(String(selectedPTBADossier?.startYear)) || 2026;
    const y1 = String(baseStartY);
    const y2 = String(baseStartY + 1);
    const y3 = String(baseStartY + 2);

    const dossierAxes = selectedPTBADossier?.axes || [];
    let allAxes: (EvmAxe & { isReadOnly?: boolean })[] = (dossierAxes || []).map(a => ({
      ...a,
      isReadOnly: selectedPTBADossier?.isReadOnly
    }));

    if (filterPTBAAxe !== 'FULL') {
      allAxes = allAxes.filter(a => a.id === filterPTBAAxe);
    }

    const ptbaAssignees = Array.from(
      new Set(
        dossierAxes.flatMap(ax =>
          (ax.projects || []).flatMap(pr =>
            (pr.tasks || []).flatMap(tk =>
              (tk.assignee || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
            )
          )
        )
      )
    ).sort();

    // Exact same consolidated task list & code generation per project/phase as OperationalMatrices.tsx
    const allFilteredEnrichedTasks: Array<{
      task: EvmTask;
      projectId: string;
      projectName: string;
      axeId: string;
      axeName: string;
      code: string;
    }> = [];

    allAxes.forEach(axe => {
      const axeProjects = (axe.projects || []).filter(
        p => filterPTBAProj === 'FULL' || p.id === filterPTBAProj
      );

      axeProjects.forEach(proj => {
        const rawTasks = proj.tasks || [];
        const codeMap = new Map<string, string>();

        STANDARD_PHASES.forEach((pName, pIdx) => {
          const pTasks = rawTasks.filter(tk => tk.phase === pName);
          pTasks.forEach((tk, tIdx) => {
            const c = `${tk.type === 'jalon' ? 'J' : 'T'}.${pIdx + 1}.${tIdx + 1}`;
            codeMap.set(tk.id, c);
          });
        });

        rawTasks
          .filter(tk => !STANDARD_PHASES.includes(tk.phase || ''))
          .forEach((tk, tIdx) => {
            const c = `${tk.type === 'jalon' ? 'J' : 'T'}.X.${tIdx + 1}`;
            codeMap.set(tk.id, c);
          });

        rawTasks.forEach(tk => {
          allFilteredEnrichedTasks.push({
            task: tk,
            projectId: proj.id,
            projectName: proj.name,
            axeId: axe.id,
            axeName: axe.name,
            code: codeMap.get(tk.id) || 'T.1.1'
          });
        });
      });
    });

    const isAllYears = filterPTBAYear === 'ALL';
    const ptbaColSpan = isAllYears ? 8 : 10;
    const phasesToDisplay =
      filterPTBAPhase === 'ALL'
        ? STANDARD_PHASES
        : STANDARD_PHASES.filter(ph => ph === filterPTBAPhase);

    let globalTotalVP = 0;
    let globalTotalYear = 0;
    let globalTotalQ1 = 0,
      globalTotalQ2 = 0,
      globalTotalQ3 = 0,
      globalTotalQ4 = 0;
    let globalTotalY1 = 0,
      globalTotalY2 = 0,
      globalTotalY3 = 0;

    return (
      <div className="space-y-2 sm:space-y-3">
        {/* BLOC DE FILTRES UNIFIÉ (Même design, blocs et taille de police que l'application — Sans filtre Programme) */}
        <div className="bg-white dark:bg-slate-900 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-800 p-1 md:p-2.5 shadow-xs space-y-1 md:space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[10px] sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1 truncate">
              <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
              <span>
                PTBA — {isAllYears ? (isEn ? `Overall Period (${y1}-${y3})` : `Période Globale (${y1}-${y3})`) : (isEn ? `Fiscal Year ${filterPTBAYear}` : `Exercice ${filterPTBAYear}`)}
              </span>
            </h2>
            <p className="hidden xl:block text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {isEn
                ? 'Annual Work Plan and Budget — Quarterly and multi-year breakdown'
                : 'Plan de Travail et Budget Annuel — Ventilation trimestrielle et pluriannuelle'}
            </p>
          </div>

          {/* Boutons filtres : Axe, Projet, Phase, Resp., Statut + Année & Trimestre */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 sm:gap-1.5">
            {/* 1. Axe */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <Filter className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '1. Axis' : '1. Axe'}
                </label>
                <select
                  value={filterPTBAAxe}
                  onChange={e => handleSelectAxeFilter(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="FULL">{isEn ? `Axis (${dossierAxes.length})` : `Axe (${dossierAxes.length})`}</option>
                  {dossierAxes.map(axe => (
                    <option key={axe.id} value={axe.id}>
                      {axe.name}
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
                  {isEn ? '2. Project' : '2. Projet'}
                </label>
                <select
                  value={filterPTBAProj}
                  onChange={e => handleSelectProjFilter(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="FULL">{isEn ? `Project (${ptbaAvailableProjects.length})` : `Projet (${ptbaAvailableProjects.length})`}</option>
                  {ptbaAvailableProjects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Phase */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <Layers className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '3. Phase' : '3. Phase'}
                </label>
                <select
                  value={filterPTBAPhase}
                  onChange={e => setFilterPTBAPhase(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'Phases (5)' : 'Phases (5)'}</option>
                  {STANDARD_PHASES.map((ph, idx) => (
                    <option key={ph} value={ph}>
                      P{idx + 1}: {isEn ? (idx === 0 ? 'PRE-PROJECT' : idx === 1 ? 'DESIGN' : idx === 2 ? 'PLANNING' : idx === 3 ? 'EXECUTION & MONITORING' : 'CLOSING') : CANONICAL_APP_PHASES[idx]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Responsable */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <UserCheck className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '4. Owner' : '4. Responsable'}
                </label>
                <select
                  value={filterPTBAAssignee}
                  onChange={e => setFilterPTBAAssignee(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="ALL">{isEn ? `Owner (${ptbaAssignees.length})` : `Resp. (${ptbaAssignees.length})`}</option>
                  {ptbaAssignees.map(resp => (
                    <option key={resp} value={resp}>
                      {resp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Statut */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <CheckCircle2 className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '5. Status' : '5. Statut'}
                </label>
                <select
                  value={filterPTBAStatus}
                  onChange={e => setFilterPTBAStatus(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'Status: All' : 'Statut : Tous'}</option>
                  <option value="À faire">{isEn ? 'To Do' : 'À Faire'}</option>
                  <option value="En cours">{isEn ? 'In Progress' : 'En Cours'}</option>
                  <option value="Bloqué">{isEn ? 'Blocked' : 'Bloqué'}</option>
                  <option value="Terminé">{isEn ? 'Completed' : 'Terminé'}</option>
                </select>
              </div>
            </div>

            {/* 6. Année d'Exercice */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <Calendar className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '6. Year' : '6. Année'}
                </label>
                <select
                  value={filterPTBAYear}
                  onChange={e => {
                    setFilterPTBAYear(e.target.value);
                    if (e.target.value === 'ALL') setFilterPTBAQuarter('FULL');
                  }}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'Overall Period' : 'Période Globale'}</option>
                  <option value="2024">{isEn ? 'Year 2024' : 'Année 2024'}</option>
                  <option value="2025">{isEn ? 'Year 2025' : 'Année 2025'}</option>
                  <option value="2026">{isEn ? 'Year 2026' : 'Année 2026'}</option>
                  <option value="2027">{isEn ? 'Year 2027' : 'Année 2027'}</option>
                  <option value="2028">{isEn ? 'Year 2028' : 'Année 2028'}</option>
                  <option value="2029">{isEn ? 'Year 2029' : 'Année 2029'}</option>
                  <option value="2030">{isEn ? 'Year 2030' : 'Année 2030'}</option>
                </select>
              </div>
            </div>

            {/* 7. Trimestre */}
            <div className="col-span-2 sm:col-span-1 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <Activity className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '7. Quarter' : '7. Trimestre'}
                </label>
                <select
                  value={filterPTBAQuarter}
                  onChange={e => setFilterPTBAQuarter(e.target.value)}
                  disabled={isAllYears}
                  className={`w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer ${
                    isAllYears ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="FULL">{isEn ? 'Full Year' : 'Année entière'}</option>
                  <option value="T1">{isEn ? 'Q1 (Jan-Mar)' : 'T1 (Jan-Mar)'}</option>
                  <option value="T2">{isEn ? 'Q2 (Apr-Jun)' : 'T2 (Avr-Juin)'}</option>
                  <option value="T3">{isEn ? 'Q3 (Jul-Sep)' : 'T3 (Juil-Sep)'}</option>
                  <option value="T4">{isEn ? 'Q4 (Oct-Dec)' : 'T4 (Oct-Déc)'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLEAU PTBA UNIFIÉ (Même logique de phases et mêmes 2 premières colonnes "Code" & "Activité / Jalon" que Planification et Suivi des tâches) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-auto max-h-[75vh] sm:max-h-[calc(100vh-185px)] relative">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 table-compact">
              <thead className="sticky top-0 z-30">
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
                    className="sticky top-0 left-[48px] z-40 bg-[#0c4a6e] w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] text-left border-r-2 border-[#90D5FF] border-b-2 border-[#90D5FF] shadow-[3px_0_6px_rgba(0,0,0,0.28)] whitespace-normal"
                  >
                    {isEn ? 'Activity / Milestone' : 'Activité / Jalon'}
                  </th>
                  {/* 3. Responsable */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] w-24 min-w-[84px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {isEn ? 'Owner' : 'Responsable'}
                  </th>
                  {/* 4. Période */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {isEn ? 'Period' : 'Période'}
                  </th>
                  {/* 5. Budget (VP) */}
                  <th
                    style={{ position: 'sticky', top: 0 }}
                    className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                  >
                    {isEn ? 'Budget (PV)' : 'Budget (VP)'}
                  </th>
                  {isAllYears ? (
                    <>
                      <th
                        style={{ position: 'sticky', top: 0 }}
                        className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                      >
                        {isEn ? `Year ${y1}` : `Année ${y1}`}
                      </th>
                      <th
                        style={{ position: 'sticky', top: 0 }}
                        className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                      >
                        {isEn ? `Year ${y2}` : `Année ${y2}`}
                      </th>
                      <th
                        style={{ position: 'sticky', top: 0 }}
                        className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-b-2 border-[#90D5FF]"
                      >
                        {isEn ? `Year ${y3}` : `Année ${y3}`}
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        style={{ position: 'sticky', top: 0 }}
                        className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                      >
                        {isEn ? `Plan. ${filterPTBAYear}` : `Prog. ${filterPTBAYear}`}
                      </th>
                      <th
                        style={{ position: 'sticky', top: 0 }}
                        className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                      >
                        {isEn ? 'Q1' : 'T1'}
                      </th>
                      <th
                        style={{ position: 'sticky', top: 0 }}
                        className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                      >
                        {isEn ? 'Q2' : 'T2'}
                      </th>
                      <th
                        style={{ position: 'sticky', top: 0 }}
                        className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                      >
                        {isEn ? 'Q3' : 'T3'}
                      </th>
                      <th
                        style={{ position: 'sticky', top: 0 }}
                        className="sticky top-0 z-30 bg-[#0c4a6e] text-center border-b-2 border-[#90D5FF]"
                      >
                        {isEn ? 'Q4' : 'T4'}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {phasesToDisplay.map(phaseName => {
                  const phaseIndex = STANDARD_PHASES.indexOf(phaseName) + 1;
                  const canonicalPhaseName = CANONICAL_APP_PHASES[phaseIndex - 1] || phaseName;
                  const collapseKey = `PTBA_PHASE__${phaseName}`;
                  const isCollapsed = Boolean(collapsedPhases[collapseKey]);

                  const phaseItems = allFilteredEnrichedTasks
                    .filter(item => {
                      const t = item.task;
                      if (t.phase !== phaseName) return false;
                      if (
                        filterPTBAAssignee !== 'ALL' &&
                        !(t.assignee || '').includes(filterPTBAAssignee)
                      )
                        return false;
                      if (filterPTBAStatus !== 'ALL' && t.status !== filterPTBAStatus)
                        return false;
                      if (!isAllYears) {
                        const startYear = t.startDate
                          ? new Date(t.startDate).getFullYear().toString()
                          : '9999';
                        const endYear = t.endDate
                          ? new Date(t.endDate).getFullYear().toString()
                          : '0000';
                        if (!(startYear <= filterPTBAYear && endYear >= filterPTBAYear))
                          return false;
                        if (filterPTBAQuarter !== 'FULL') {
                          if (
                            filterPTBAQuarter === 'T1' &&
                            getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 0) <= 0
                          )
                            return false;
                          if (
                            filterPTBAQuarter === 'T2' &&
                            getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 1) <= 0
                          )
                            return false;
                          if (
                            filterPTBAQuarter === 'T3' &&
                            getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 2) <= 0
                          )
                            return false;
                          if (
                            filterPTBAQuarter === 'T4' &&
                            getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 3) <= 0
                          )
                            return false;
                        }
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      const d1 = a.task.startDate || '9999-12-31';
                      const d2 = b.task.startDate || '9999-12-31';
                      if (d1 !== d2) return d1.localeCompare(d2);
                      const e1 = a.task.endDate || '9999-12-31';
                      const e2 = b.task.endDate || '9999-12-31';
                      return e1.localeCompare(e2);
                    });

                  let phaseTotalVP = 0;

                  const processedPhaseItems = phaseItems.map(item => {
                    const t = item.task;
                    const vp = Number(t.coutPlanifie) || 0;
                    const [sYear, sMonth, sDay] = (t.startDate || '2026-01-01')
                      .split('-')
                      .map(Number);
                    const [eYear, eMonth, eDay] = (t.endDate || '2026-01-01')
                      .split('-')
                      .map(Number);
                    const start = new Date(sYear, sMonth - 1, sDay).getTime();
                    const end = new Date(eYear, eMonth - 1, eDay).getTime();
                    const totalDays = Math.max(
                      1,
                      (end - start) / (1000 * 60 * 60 * 24) + 1
                    );

                    let q1B = 0,
                      q2B = 0,
                      q3B = 0,
                      q4B = 0,
                      yearB = 0;
                    let y1B = 0,
                      y2B = 0,
                      y3B = 0;

                    if (isAllYears) {
                      y1B = vp * (getYearOverlapDays(t.startDate, t.endDate, y1) / totalDays);
                      y2B = vp * (getYearOverlapDays(t.startDate, t.endDate, y2) / totalDays);
                      y3B = vp * (getYearOverlapDays(t.startDate, t.endDate, y3) / totalDays);
                    } else {
                      q1B =
                        vp *
                        (getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 0) /
                          totalDays);
                      q2B =
                        vp *
                        (getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 1) /
                          totalDays);
                      q3B =
                        vp *
                        (getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 2) /
                          totalDays);
                      q4B =
                        vp *
                        (getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 3) /
                          totalDays);
                      yearB = q1B + q2B + q3B + q4B;
                    }

                    phaseTotalVP += vp;
                    globalTotalVP += vp;
                    globalTotalYear += yearB;
                    globalTotalQ1 += q1B;
                    globalTotalQ2 += q2B;
                    globalTotalQ3 += q3B;
                    globalTotalQ4 += q4B;
                    globalTotalY1 += y1B;
                    globalTotalY2 += y2B;
                    globalTotalY3 += y3B;

                    return {
                      ...item,
                      vp,
                      yearB,
                      q1B,
                      q2B,
                      q3B,
                      q4B,
                      y1B,
                      y2B,
                      y3B
                    };
                  });

                  return (
                    <React.Fragment key={collapseKey}>
                      {/* PHASE HEADER ROW (Identique à Planification & Suivi des tâches) */}
                      <tr className="bg-sky-100 dark:bg-slate-800 border-y border-[#90D5FF] dark:border-sky-800">
                        <td
                          colSpan={ptbaColSpan}
                          className="px-2.5 py-1 border-b border-[#90D5FF] dark:border-sky-800"
                        >
                          <div className="sticky left-2 inline-flex flex-wrap items-center justify-between gap-3 w-full max-w-[calc(100vw-2.5rem)]">
                            <button
                              type="button"
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
                                {canonicalPhaseName}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                ({processedPhaseItems.length})
                              </span>
                            </button>

                            <div className="flex items-center gap-2">
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                {isEn ? 'Subtotal: ' : 'Sous-total : '} {fmtBudget(phaseTotalVP)} M
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {!isCollapsed &&
                        (processedPhaseItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={ptbaColSpan}
                              className="py-2 text-center text-[10px] text-slate-400 italic bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
                            >
                              {isEn
                                ? `No items in phase "${canonicalPhaseName}".`
                                : `Aucun élément dans la phase « ${canonicalPhaseName} ».`}
                            </td>
                          </tr>
                        ) : (
                          processedPhaseItems.map(item => {
                            const t = item.task;
                            const isJalon = t.type === 'jalon';
                            const stickyCellBg = isJalon
                              ? 'bg-[#f0f9ff] dark:bg-[#1e293b]'
                              : 'bg-white dark:bg-[#0f172a]';

                            return (
                              <tr
                                key={t.id}
                                className={`${
                                  isJalon
                                    ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                    : 'bg-white dark:bg-slate-900'
                                } hover:bg-sky-50/70 dark:hover:bg-slate-800/70`}
                              >
                                {/* 1. Code (Locked Col 1 — exact same badge as Planification) */}
                                <td
                                  style={{ position: 'sticky', left: 0 }}
                                  className={`sticky left-0 z-20 ${stickyCellBg} w-[48px] min-w-[48px] max-w-[48px] align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal break-words`}
                                >
                                  <span
                                    className={`inline-block w-full text-center font-mono text-[9px] font-black px-1 py-1 rounded leading-tight ${
                                      isJalon
                                        ? 'bg-[#90D5FF] text-slate-950'
                                        : 'bg-[#0c4a6e] text-white'
                                    }`}
                                  >
                                    {item.code}
                                  </span>
                                </td>

                                {/* 2. Activité / Jalon (Locked Col 2 — exact same text and typography as Planification) */}
                                <td
                                  style={{ position: 'sticky', left: 48 }}
                                  className={`sticky left-[48px] z-20 ${stickyCellBg} w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] align-top border-r-2 border-[#0284c7] dark:border-[#90D5FF] border-b border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(12,74,110,0.18)] whitespace-normal break-words`}
                                >
                                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-snug whitespace-normal break-words py-0.5">
                                    {t.name}
                                  </div>
                                </td>

                                {/* 3. Responsable */}
                                <td className="align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-normal break-words">
                                  {t.assignee || '—'}
                                </td>

                                {/* 4. Période */}
                                <td className="align-top text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                  {new Date(t.startDate).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit'
                                  })}{' '}
                                  -{' '}
                                  {new Date(t.endDate).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </td>

                                {/* 5. Budget (VP) */}
                                <td className="align-top text-center font-mono font-bold text-[10px] text-[#0c4a6e] dark:text-[#90D5FF] border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  {item.vp > 0 ? `${fmtBudget(item.vp)} M` : '—'}
                                </td>

                                {isAllYears ? (
                                  <>
                                    <td
                                      className={`align-top text-center font-mono text-[10px] border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 ${
                                        item.y1B > 0
                                          ? 'font-bold text-slate-800 dark:text-slate-200'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.y1B > 0 ? `${fmtBudget(item.y1B)} M` : '—'}
                                    </td>
                                    <td
                                      className={`align-top text-center font-mono text-[10px] border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 ${
                                        item.y2B > 0
                                          ? 'font-bold text-slate-800 dark:text-slate-200'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.y2B > 0 ? `${fmtBudget(item.y2B)} M` : '—'}
                                    </td>
                                    <td
                                      className={`align-top text-center font-mono text-[10px] border-b border-slate-200 dark:border-slate-800 ${
                                        item.y3B > 0
                                          ? 'font-bold text-slate-800 dark:text-slate-200'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.y3B > 0 ? `${fmtBudget(item.y3B)} M` : '—'}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="align-top text-center font-mono font-bold text-[10px] text-blue-700 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                      {fmtBudget(item.yearB)} {item.yearB > 0 ? 'M' : ''}
                                    </td>
                                    <td
                                      className={`align-top text-center font-mono text-[10px] border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 ${
                                        item.q1B > 0
                                          ? 'font-bold text-[#0c4a6e] dark:text-[#90D5FF]'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.q1B > 0 ? `${fmtBudget(item.q1B)} M` : '—'}
                                    </td>
                                    <td
                                      className={`align-top text-center font-mono text-[10px] border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 ${
                                        item.q2B > 0
                                          ? 'font-bold text-[#0c4a6e] dark:text-[#90D5FF]'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.q2B > 0 ? `${fmtBudget(item.q2B)} M` : '—'}
                                    </td>
                                    <td
                                      className={`align-top text-center font-mono text-[10px] border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 ${
                                        item.q3B > 0
                                          ? 'font-bold text-[#0c4a6e] dark:text-[#90D5FF]'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.q3B > 0 ? `${fmtBudget(item.q3B)} M` : '—'}
                                    </td>
                                    <td
                                      className={`align-top text-center font-mono text-[10px] border-b border-slate-200 dark:border-slate-800 ${
                                        item.q4B > 0
                                          ? 'font-bold text-[#0c4a6e] dark:text-[#90D5FF]'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.q4B > 0 ? `${fmtBudget(item.q4B)} M` : '—'}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#0c4a6e] text-white font-black sticky bottom-0 z-30">
                <tr>
                  <td colSpan={4} className="text-right uppercase text-[10px] border-r border-sky-800">
                    {isEn ? 'Grand Total Programmed' : 'Total Global Programmé'} ({isAllYears ? `${y1}-${y3}` : filterPTBAYear})
                  </td>
                  <td className="text-center font-mono text-[10px] text-[#90D5FF] border-r border-sky-800">
                    {fmtBudget(globalTotalVP)} M
                  </td>
                  {isAllYears ? (
                    <>
                      <td className="text-center font-mono text-[10px] text-[#90D5FF] border-r border-sky-800">
                        {fmtBudget(globalTotalY1)} M
                      </td>
                      <td className="text-center font-mono text-[10px] text-[#90D5FF] border-r border-sky-800">
                        {fmtBudget(globalTotalY2)} M
                      </td>
                      <td className="text-center font-mono text-[10px] text-[#90D5FF]">
                        {fmtBudget(globalTotalY3)} M
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="text-center font-mono text-[10px] text-blue-200 border-r border-sky-800">
                        {fmtBudget(globalTotalYear)} M
                      </td>
                      <td className="text-center font-mono text-[10px] text-[#90D5FF] border-r border-sky-800">
                        {fmtBudget(globalTotalQ1)} M
                      </td>
                      <td className="text-center font-mono text-[10px] text-[#90D5FF] border-r border-sky-800">
                        {fmtBudget(globalTotalQ2)} M
                      </td>
                      <td className="text-center font-mono text-[10px] text-[#90D5FF] border-r border-sky-800">
                        {fmtBudget(globalTotalQ3)} M
                      </td>
                      <td className="text-center font-mono text-[10px] text-[#90D5FF]">
                        {fmtBudget(globalTotalQ4)} M
                      </td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderProcessus = () => {
    const selectedProcessusDossier =
      data.find(d => d.id === (activeDossierId || filterProcessusDossier)) ||
      data.find(d => d.id === filterProcessusDossier) ||
      data[0];
    const dossierAxes = selectedProcessusDossier?.axes || [];

    let allProcessusAxes: (EvmAxe & { isReadOnly?: boolean })[] = (dossierAxes || []).map(a => ({
      ...a,
      isReadOnly: selectedProcessusDossier?.isReadOnly
    }));

    if (filterProcessusAxe !== 'FULL') {
      allProcessusAxes = allProcessusAxes.filter(a => a.id === filterProcessusAxe);
    }

    const currentDossierId = selectedProcessusDossier?.id || '';
    const processusAvailableProjects = allProjects
      .filter(p => p.dossierId === currentDossierId)
      .filter(p => filterProcessusAxe === 'FULL' || p.axeId === filterProcessusAxe);

    const processusAssignees = Array.from(
      new Set(
        dossierAxes.flatMap(ax =>
          (ax.projects || []).flatMap(pr =>
            (pr.tasks || []).flatMap(tk =>
              (tk.assignee || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
            )
          )
        )
      )
    ).sort();

    // Target project when clicking "+" in a Phase header in Suivi EVM (same logic as OperationalMatrices.tsx)
    const defaultTargetProjectId =
      filterProcessusProj !== 'FULL'
        ? filterProcessusProj
        : processusAvailableProjects[0]?.id ||
          dossierAxes.flatMap(a => a.projects || [])[0]?.id ||
          '';

    // Exact same consolidated task list & code generation per project/phase as OperationalMatrices.tsx
    const allFilteredEnrichedTasks: Array<{
      task: EvmTask;
      projectId: string;
      projectName: string;
      axeId: string;
      axeName: string;
      isReadOnly: boolean;
      code: string;
    }> = [];

    allProcessusAxes.forEach(axe => {
      const axeProjects = (axe.projects || []).filter(
        p => filterProcessusProj === 'FULL' || p.id === filterProcessusProj
      );

      axeProjects.forEach(proj => {
        const rawTasks = proj.tasks || [];
        const codeMap = new Map<string, string>();

        STANDARD_PHASES.forEach((pName, pIdx) => {
          const pTasks = rawTasks.filter(tk => tk.phase === pName);
          pTasks.forEach((tk, tIdx) => {
            const c = `${tk.type === 'jalon' ? 'J' : 'T'}.${pIdx + 1}.${tIdx + 1}`;
            codeMap.set(tk.id, c);
          });
        });

        rawTasks
          .filter(tk => !STANDARD_PHASES.includes(tk.phase || ''))
          .forEach((tk, tIdx) => {
            const c = `${tk.type === 'jalon' ? 'J' : 'T'}.X.${tIdx + 1}`;
            codeMap.set(tk.id, c);
          });

        rawTasks.forEach(tk => {
          allFilteredEnrichedTasks.push({
            task: tk,
            projectId: proj.id,
            projectName: proj.name,
            axeId: axe.id,
            axeName: axe.name,
            isReadOnly: Boolean(axe.isReadOnly || proj.isReadOnly),
            code: codeMap.get(tk.id) || 'T.1.1'
          });
        });
      });
    });

    const today = new Date();

    const matchesTaskFilters = (t: EvmTask) => {
      if (filterProcessusPhase !== 'ALL' && t.phase !== filterProcessusPhase) return false;
      if (
        filterProcessusAssignee !== 'ALL' &&
        !(t.assignee || '').includes(filterProcessusAssignee)
      )
        return false;
      if (filterProcessusStatus !== 'ALL' && t.status !== filterProcessusStatus) return false;
      if (filterProcessusYear !== 'ALL') {
        const startYear = t.startDate
          ? new Date(t.startDate).getFullYear().toString()
          : '9999';
        const endYear = t.endDate ? new Date(t.endDate).getFullYear().toString() : '0000';
        if (!(startYear <= filterProcessusYear && endYear >= filterProcessusYear)) return false;
        if (filterProcessusQuarter !== 'FULL') {
          let qOverlap = 0;
          if (filterProcessusQuarter === 'T1')
            qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 0);
          else if (filterProcessusQuarter === 'T2')
            qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 1);
          else if (filterProcessusQuarter === 'T3')
            qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 2);
          else if (filterProcessusQuarter === 'T4')
            qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 3);
          if (qOverlap <= 0) return false;
        }
      }
      return true;
    };

    let totalVP = 0;
    let totalVA = 0;
    let totalCR = 0;

    const phasesToDisplay =
      filterProcessusPhase === 'ALL'
        ? STANDARD_PHASES
        : STANDARD_PHASES.filter(ph => ph === filterProcessusPhase);

    return (
      <div className="space-y-2 sm:space-y-3">
        {/* BLOC DE FILTRES UNIFIÉ (Même design, blocs et taille de police que l'application — Sans filtre Programme) */}
        <div className="bg-white dark:bg-slate-900 rounded-md sm:rounded-xl border border-slate-200 dark:border-slate-800 p-1 md:p-2.5 shadow-xs space-y-1 md:space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[10px] sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1 truncate">
              <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] dark:text-[#90D5FF] shrink-0" />
              <span>{isEn ? 'Scientific & Budgetary Tracking (EVM)' : 'Suivi Scientifique & Budgétaire (EVM)'}</span>
            </h2>
            <p className="hidden xl:block text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {isEn
                ? 'Tracking of earned value, schedule and operational disbursements'
                : 'Suivi de la valeur acquise, planning et décaissements opérationnels'}
            </p>
          </div>

          {/* Boutons filtres : Axe, Projet, Phase, Resp., Statut + Année & Trimestre */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 sm:gap-1.5">
            {/* 1. Axe */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <Filter className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '1. Axis' : '1. Axe'}
                </label>
                <select
                  value={filterProcessusAxe}
                  onChange={e => handleSelectAxeFilter(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="FULL">{isEn ? `Axis (${dossierAxes.length})` : `Axe (${dossierAxes.length})`}</option>
                  {dossierAxes.map(axe => (
                    <option key={axe.id} value={axe.id}>
                      {axe.name}
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
                  {isEn ? '2. Project' : '2. Projet'}
                </label>
                <select
                  value={filterProcessusProj}
                  onChange={e => handleSelectProjFilter(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="FULL">{isEn ? `Project (${processusAvailableProjects.length})` : `Projet (${processusAvailableProjects.length})`}</option>
                  {processusAvailableProjects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Phase */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <Layers className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '3. Phase' : '3. Phase'}
                </label>
                <select
                  value={filterProcessusPhase}
                  onChange={e => setFilterProcessusPhase(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'Phases (5)' : 'Phases (5)'}</option>
                  {STANDARD_PHASES.map((ph, idx) => (
                    <option key={ph} value={ph}>
                      P{idx + 1}: {isEn ? (idx === 0 ? 'PRE-PROJECT' : idx === 1 ? 'DESIGN' : idx === 2 ? 'PLANNING' : idx === 3 ? 'EXECUTION & MONITORING' : 'CLOSING') : CANONICAL_APP_PHASES[idx]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Responsable */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <UserCheck className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '4. Owner' : '4. Responsable'}
                </label>
                <select
                  value={filterProcessusAssignee}
                  onChange={e => setFilterProcessusAssignee(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="ALL">{isEn ? `Owner (${processusAssignees.length})` : `Resp. (${processusAssignees.length})`}</option>
                  {processusAssignees.map(resp => (
                    <option key={resp} value={resp}>
                      {resp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Statut */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <CheckCircle2 className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '5. Status' : '5. Statut'}
                </label>
                <select
                  value={filterProcessusStatus}
                  onChange={e => setFilterProcessusStatus(e.target.value)}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'Status: All' : 'Statut : Tous'}</option>
                  <option value="À faire">{isEn ? 'To Do' : 'À Faire'}</option>
                  <option value="En cours">{isEn ? 'In Progress' : 'En Cours'}</option>
                  <option value="Bloqué">{isEn ? 'Blocked' : 'Bloqué'}</option>
                  <option value="Terminé">{isEn ? 'Completed' : 'Terminé'}</option>
                </select>
              </div>
            </div>

            {/* 6. Année */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <Calendar className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '6. Year' : '6. Année'}
                </label>
                <select
                  value={filterProcessusYear}
                  onChange={e => {
                    setFilterProcessusYear(e.target.value);
                    if (e.target.value === 'ALL') setFilterProcessusQuarter('FULL');
                  }}
                  className="w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'Overall Period' : 'Période Globale'}</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                </select>
              </div>
            </div>

            {/* 7. Trimestre */}
            <div className="col-span-2 sm:col-span-1 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-1.5 py-1 md:px-2 md:py-1 rounded border border-slate-200 dark:border-slate-700 h-7 md:h-auto">
              <Activity className="hidden md:block w-3 h-3 text-[#0284c7] shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="hidden md:block text-[8px] font-bold uppercase text-slate-400 leading-none">
                  {isEn ? '7. Quarter' : '7. Trimestre'}
                </label>
                <select
                  value={filterProcessusQuarter}
                  onChange={e => setFilterProcessusQuarter(e.target.value)}
                  disabled={filterProcessusYear === 'ALL'}
                  className={`w-full bg-transparent text-[13px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate leading-tight cursor-pointer ${
                    filterProcessusYear === 'ALL' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="FULL">{isEn ? 'Full Year' : 'Année entière'}</option>
                  <option value="T1">{isEn ? 'Quarter 1' : 'Trimestre 1'}</option>
                  <option value="T2">{isEn ? 'Quarter 2' : 'Trimestre 2'}</option>
                  <option value="T3">{isEn ? 'Quarter 3' : 'Trimestre 3'}</option>
                  <option value="T4">{isEn ? 'Quarter 4' : 'Trimestre 4'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLEAU SUIVI EVM UNIFIÉ (Même logique de phases et mêmes 2 premières colonnes "Code" & "Activité / Jalon" que Planification et Suivi des tâches) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-auto max-h-[75vh] sm:max-h-[calc(100vh-185px)] relative">
            <table className="w-full min-w-[960px] border-separate border-spacing-0 table-compact">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#0c4a6e] text-white">
                  {/* 1. Code (Locked Row 1 + Col 1) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 0 }}
                    className="sticky top-0 left-0 z-40 bg-[#0c4a6e] w-[48px] min-w-[48px] max-w-[48px] text-left border-r border-sky-800 border-b-2 border-[#90D5FF]"
                    rowSpan={2}
                  >
                    Code
                  </th>
                  {/* 2. Activité / Jalon (Locked Row 1 + Col 2) */}
                  <th
                    style={{ position: 'sticky', top: 0, left: 48 }}
                    className="sticky top-0 left-[48px] z-40 bg-[#0c4a6e] w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] text-left border-r-2 border-[#90D5FF] border-b-2 border-[#90D5FF] shadow-[3px_0_6px_rgba(0,0,0,0.28)]"
                    rowSpan={2}
                  >
                    {isEn ? 'Activity / Milestone' : 'Activité / Jalon'}
                  </th>
                  <th
                    className="bg-[#0c4a6e] text-left border-r border-sky-800 border-b-2 border-[#90D5FF] whitespace-normal w-24 min-w-[84px]"
                    rowSpan={2}
                  >
                    {isEn ? 'Owner' : 'Responsable'}
                  </th>
                  <th
                    className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                    rowSpan={2}
                  >
                    {isEn ? 'Status' : 'Statut'}
                  </th>
                  <th
                    className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b border-sky-800"
                    colSpan={2}
                  >
                    {isEn ? 'Scheduled Period' : 'Période Prévue'}
                  </th>
                  <th
                    className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF] whitespace-normal w-[110px]"
                    rowSpan={2}
                  >
                    {isEn ? 'Donor / Financing' : 'Bailleur / Financement'}
                  </th>
                  <th
                    className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b border-sky-800"
                    colSpan={2}
                  >
                    Budget
                  </th>
                  <th
                    className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b border-sky-800"
                    colSpan={2}
                  >
                    {isEn ? 'Disbursement Executed' : 'Décaissement Effectué'}
                  </th>
                  <th
                    className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b-2 border-[#90D5FF]"
                    rowSpan={2}
                  >
                    {isEn ? 'Disbursement Status' : 'Statut Décaissement'}
                  </th>
                  <th className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b border-sky-800">
                    {isEn ? 'Planned Value' : 'Valeur Prévue'}
                  </th>
                  <th className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b border-sky-800">
                    {isEn ? 'Earned Value' : 'Valeur Acquise'}
                  </th>
                  <th className="bg-[#0c4a6e] text-center border-r border-sky-800 border-b border-sky-800">
                    {isEn ? 'Budget Progress' : 'Progrès Budget'}
                  </th>
                  <th className="bg-[#0c4a6e] text-center border-b border-sky-800">
                    {isEn ? 'Actual Cost' : 'Coût Réel'}
                  </th>
                </tr>
                <tr className="bg-[#082f49] text-white">
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    {isEn ? 'Plan. Start' : 'Déb. Prév'}
                  </th>
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    {isEn ? 'Plan. End' : 'Fin Prév'}
                  </th>
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    Date
                  </th>
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    Budget ({currency})
                  </th>
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    Date
                  </th>
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    {isEn ? `Amount (${currency})` : `Montant (${currency})`}
                  </th>
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    {isEn ? `PV (${currency})` : `VP (${currency})`}
                  </th>
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    {isEn ? `EV (${currency})` : `VA (${currency})`}
                  </th>
                  <th className="text-center border-r border-sky-800 border-b-2 border-[#90D5FF]">
                    %
                  </th>
                  <th className="text-center border-b-2 border-[#90D5FF]">
                    {isEn ? `AC (${currency})` : `CR (${currency})`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {phasesToDisplay.map(phaseName => {
                  const phaseIndex = STANDARD_PHASES.indexOf(phaseName) + 1;
                  const canonicalPhaseName = CANONICAL_APP_PHASES[phaseIndex - 1] || phaseName;
                  const collapseKey = `EVM_PHASE__${phaseName}`;
                  const isCollapsed = Boolean(collapsedPhases[collapseKey]);

                  const phaseItems = allFilteredEnrichedTasks
                    .filter(item => item.task.phase === phaseName && matchesTaskFilters(item.task))
                    .sort((a, b) => {
                      const d1 = a.task.startDate || '9999-12-31';
                      const d2 = b.task.startDate || '9999-12-31';
                      if (d1 !== d2) return d1.localeCompare(d2);
                      const e1 = a.task.endDate || '9999-12-31';
                      const e2 = b.task.endDate || '9999-12-31';
                      return e1.localeCompare(e2);
                    });

                  let phaseVP = 0;
                  let phaseDecaisse = 0;

                  const enrichedPhaseItems = phaseItems.map(entry => {
                    const t = entry.task;
                    const startD = new Date(t.startDate);
                    const endD = new Date(t.endDate);
                    const vp = fromMillionsToFCFA(t.coutPlanifie);
                    const cr = fromMillionsToFCFA(t.coutReel);
                    const decaisse =
                      t.montantDecaissementReel !== undefined && t.montantDecaissementReel !== ''
                        ? fromMillionsToFCFA(t.montantDecaissementReel)
                        : cr;
                    const va =
                      t.valeurAcquise !== undefined
                        ? fromMillionsToFCFA(t.valeurAcquise)
                        : decaisse > 0
                        ? Math.min(vp, decaisse)
                        : t.status === 'Terminé' || t.valideVA
                        ? vp
                        : 0;
                    const budgetExecVal = Math.max(decaisse, va);
                    const avancement =
                      vp > 0
                        ? Math.min(100, Math.round((budgetExecVal / vp) * 100))
                        : budgetExecVal > 0
                        ? 100
                        : 0;

                    phaseVP += vp;
                    phaseDecaisse += decaisse;
                    totalVP += vp;
                    totalVA += va;
                    totalCR += cr;

                    let statutDecaissement = '-';
                    let statutColorDecaissement =
                      'text-slate-500 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-300';

                    if (vp > 0 && decaisse >= vp) {
                      if (t.dateDecaissementReel && t.dateDecaissementPrevu) {
                        const diffDays = Math.ceil(
                          (new Date(t.dateDecaissementReel).getTime() -
                            new Date(t.dateDecaissementPrevu).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        if (diffDays > 0) {
                          statutDecaissement = isEn ? `100% (${diffDays}d Late)` : `100% (Retard ${diffDays} j)`;
                          statutColorDecaissement =
                            'text-amber-800 bg-amber-100 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
                        } else {
                          statutDecaissement = isEn ? '100% Disbursed' : '100% Décaissé';
                          statutColorDecaissement =
                            'text-emerald-800 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
                        }
                      } else {
                        statutDecaissement = isEn ? '100% Disbursed' : '100% Décaissé';
                        statutColorDecaissement =
                          'text-emerald-800 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
                      }
                    } else if (decaisse > 0 && decaisse < vp) {
                      const pctDec = Math.round((decaisse / vp) * 100);
                      statutDecaissement = isEn ? `Partial (${pctDec}%)` : `Partiel (${pctDec}%)`;
                      statutColorDecaissement =
                        'text-sky-800 bg-sky-100 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300';
                    } else if (t.dateDecaissementPrevu) {
                      const diffDays = Math.ceil(
                        (today.getTime() - new Date(t.dateDecaissementPrevu).getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      if (diffDays > 0) {
                        statutDecaissement = isEn ? `${diffDays}d Late` : `Retard ${diffDays} j`;
                        statutColorDecaissement =
                          'text-rose-800 bg-rose-100 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300';
                      } else {
                        statutDecaissement = isEn ? 'Pending (0%)' : 'En attente (0%)';
                        statutColorDecaissement =
                          'text-slate-600 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
                      }
                    }

                    const decaissementPrevuMontant = vp;

                    return {
                      ...t,
                      projectId: entry.projectId,
                      projectName: entry.projectName,
                      isReadOnly: entry.isReadOnly,
                      code: entry.code,
                      debutPrevuStr: startD.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      }),
                      finPrevueStr: endD.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      }),
                      vp,
                      va,
                      avancement,
                      cr,
                      decaissementPrevuMontant,
                      decaisse,
                      statutDecaissement,
                      statutColorDecaissement
                    };
                  });

                  return (
                    <React.Fragment key={collapseKey}>
                      {/* PHASE HEADER ROW */}
                      <tr className="bg-sky-100 dark:bg-slate-800 border-y border-[#90D5FF] dark:border-sky-800">
                        <td
                          colSpan={16}
                          className="px-2.5 py-1 border-b border-[#90D5FF] dark:border-sky-800"
                        >
                          <div className="sticky left-2 inline-flex flex-wrap items-center justify-between gap-3 w-full max-w-[calc(100vw-2.5rem)]">
                            <button
                              type="button"
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
                                {canonicalPhaseName}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                ({enrichedPhaseItems.length})
                              </span>
                            </button>

                            <div className="flex items-center gap-3">
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                {isEn ? 'Phase Budget: ' : 'Budget Phase : '} {fmtFullAmount(phaseVP)} {currency}
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-teal-700 dark:text-teal-300">
                                {isEn ? 'Disbursed: ' : 'Décaissé : '} {fmtFullAmount(phaseDecaisse)} {currency} (
                                {phaseVP > 0 ? Math.round((phaseDecaisse / phaseVP) * 100) : 0}%)
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {!isCollapsed &&
                        (enrichedPhaseItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={16}
                              className="py-2 text-center text-[10px] text-slate-400 italic bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
                            >
                              {isEn
                                ? `No items in phase "${canonicalPhaseName}".`
                                : `Aucun élément dans la phase « ${canonicalPhaseName} ».`}
                            </td>
                          </tr>
                        ) : (
                          enrichedPhaseItems.map(item => {
                            const isJalon = item.type === 'jalon';
                            const stickyCellBg = isJalon
                              ? 'bg-[#f0f9ff] dark:bg-[#1e293b]'
                              : 'bg-white dark:bg-[#0f172a]';

                            const statusBadgeClass =
                              item.status === 'Terminé'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                                : item.status === 'En cours'
                                ? 'bg-sky-100 text-[#0c4a6e] dark:bg-sky-950/60 dark:text-[#90D5FF] border-[#90D5FF]'
                                : item.status === 'Bloqué'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';

                            const statusDisplay = isEn
                              ? item.status === 'Terminé'
                                ? 'Completed'
                                : item.status === 'En cours'
                                ? 'In Progress'
                                : item.status === 'Bloqué'
                                ? 'Blocked'
                                : 'To Do'
                              : item.status;

                            return (
                              <tr
                                key={item.id}
                                className={`group ${
                                  isJalon
                                    ? 'bg-sky-50/40 dark:bg-slate-800/40'
                                    : 'bg-white dark:bg-slate-900'
                                } hover:bg-sky-50/70 dark:hover:bg-slate-800/70`}
                              >
                                {/* 1. Code (Locked Col 1 — exact same badge as Planification) */}
                                <td
                                  style={{ position: 'sticky', left: 0 }}
                                  className={`sticky left-0 z-20 ${stickyCellBg} w-[48px] min-w-[48px] max-w-[48px] align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal break-words`}
                                >
                                  <span
                                    className={`inline-block w-full text-center font-mono text-[9px] font-black px-1 py-1 rounded leading-tight ${
                                      isJalon
                                        ? 'bg-[#90D5FF] text-slate-950'
                                        : 'bg-[#0c4a6e] text-white'
                                    }`}
                                  >
                                    {item.code}
                                  </span>
                                </td>

                                {/* 2. Activité / Jalon (Locked Col 2 — exact same text and typography as Planification) */}
                                <td
                                  style={{ position: 'sticky', left: 48 }}
                                  className={`sticky left-[48px] z-20 ${stickyCellBg} w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] align-top border-r-2 border-[#0284c7] dark:border-[#90D5FF] border-b border-slate-200 dark:border-slate-800 shadow-[3px_0_6px_rgba(12,74,110,0.18)] whitespace-normal break-words`}
                                >
                                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-snug whitespace-normal break-words py-0.5">
                                    {item.name}
                                  </div>
                                </td>

                                {/* 3. Responsable (Read-only) */}
                                <td className="align-top border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-normal break-words">
                                  {item.assignee || '—'}
                                </td>

                                {/* 4. Statut (Read-only) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-black ${statusBadgeClass}`}
                                  >
                                    {statusDisplay}
                                  </span>
                                  {item.status === 'Bloqué' && item.motifBlocage && (
                                    <div className="mt-1 text-[8.5px] text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 p-1 rounded border border-rose-200 break-words leading-tight max-w-[110px] mx-auto">
                                      {item.motifBlocage}
                                    </div>
                                  )}
                                </td>

                                {/* 5-6. Période Prévue : Déb. Prév | Fin Prév (Read-only) */}
                                <td className="align-top text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  {item.debutPrevuStr}
                                </td>
                                <td className="align-top text-center font-mono text-[10px] text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  {item.finPrevueStr}
                                </td>

                                {/* 7. Bailleur / Financement (Read-only) */}
                                <td className="align-top text-center text-[10px] font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-normal">
                                  {item.responsableTresorerie || '—'}
                                </td>

                                {/* 8-9. Budget (Date éditable, Montant Budget complet en lecture seule depuis Planification) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    value={item.dateDecaissementPrevu || ''}
                                    disabled={item.isReadOnly}
                                    onChange={e =>
                                      handleInlineUpdateTask(item.projectId, item.id, {
                                        dateDecaissementPrevu: e.target.value
                                      })
                                    }
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-purple-700 dark:text-purple-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                  />
                                </td>
                                <td className="align-top text-right font-mono font-bold text-[10px] text-[#0c4a6e] dark:text-[#90D5FF] border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap px-1.5">
                                  {fmtFullAmount(item.vp)}
                                </td>

                                {/* 10-11. Décaissement Effectué (Montant complet éditable directement dans le tableau) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  <input
                                    type="date"
                                    value={item.dateDecaissementReel || ''}
                                    disabled={item.isReadOnly}
                                    onChange={e =>
                                      handleInlineUpdateTask(item.projectId, item.id, {
                                        dateDecaissementReel: e.target.value
                                      })
                                    }
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-teal-700 dark:text-teal-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                  />
                                </td>
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  <input
                                    type="number"
                                    step="1000"
                                    min={0}
                                    value={item.decaisse}
                                    disabled={item.isReadOnly}
                                    onChange={e =>
                                      handleInlineUpdateTask(item.projectId, item.id, {
                                        montantDecaissementReel:
                                          e.target.value === '' ? 0 : Number(e.target.value)
                                      })
                                    }
                                    className="w-24 sm:w-28 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right font-mono text-[10px] font-bold text-teal-700 dark:text-teal-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                  />
                                </td>

                                {/* 12. Statut Décaissement (Auto-calculated) */}
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black border ${item.statutColorDecaissement}`}
                                  >
                                    {item.statutDecaissement}
                                  </span>
                                </td>

                                {/* 13-16. VP (Montant complet lecture seule), VA (Montant complet), %, CR (Montant complet) */}
                                <td className="align-top text-right font-mono font-bold text-[10px] text-blue-700 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap px-1.5">
                                  {fmtFullAmount(item.vp)}
                                </td>
                                <td className="align-top text-center border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  <input
                                    type="number"
                                    step="1000"
                                    min={0}
                                    value={item.va}
                                    disabled={item.isReadOnly}
                                    onChange={e =>
                                      handleInlineUpdateTask(item.projectId, item.id, {
                                        valeurAcquise:
                                          e.target.value === '' ? 0 : Number(e.target.value)
                                      })
                                    }
                                    className="w-24 sm:w-28 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
                                  />
                                </td>
                                <td className="align-top text-center font-mono font-black text-[10px] text-[#0c4a6e] dark:text-[#90D5FF] border-r border-slate-200 dark:border-slate-800 border-b border-slate-200 dark:border-slate-800">
                                  {item.avancement}%
                                </td>
                                <td className="align-top text-center border-b border-slate-200 dark:border-slate-800">
                                  <input
                                    type="number"
                                    step="1000"
                                    min={0}
                                    value={item.cr}
                                    disabled={item.isReadOnly}
                                    onChange={e =>
                                      handleInlineUpdateTask(item.projectId, item.id, {
                                        coutReel:
                                          e.target.value === '' ? 0 : Number(e.target.value)
                                      })
                                    }
                                    className="w-24 sm:w-28 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right font-mono text-[10px] font-bold text-orange-700 dark:text-orange-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#90D5FF]"
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
              <tfoot className="bg-[#0c4a6e] text-white font-black sticky bottom-0 z-30">
                <tr>
                  <td
                    colSpan={12}
                    className="text-right uppercase text-[10px] border-r border-sky-800"
                  >
                    {isEn ? `Grand Total of selection (${currency})` : `Total Global de la sélection (${currency})`}
                  </td>
                  <td className="text-right font-mono text-[10px] text-blue-200 border-r border-sky-800 whitespace-nowrap px-1.5">
                    {fmtFullAmount(totalVP)}
                  </td>
                  <td className="text-right font-mono text-[10px] text-emerald-200 border-r border-sky-800 whitespace-nowrap px-1.5">
                    {fmtFullAmount(totalVA)}
                  </td>
                  <td className="text-center font-mono text-[10px] text-[#90D5FF] border-r border-sky-800">
                    {totalVP > 0 ? Math.round((totalVA / totalVP) * 100) : 0}%
                  </td>
                  <td className="text-right font-mono text-[10px] text-orange-200 whitespace-nowrap px-1.5">
                    {fmtFullAmount(totalCR)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Sub-navigation bar between the 3 EVM/PTBA tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <button
          type="button"
          onClick={() => onChangeSubTab('evm_dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'evm_dashboard'
              ? 'bg-[#0c4a6e] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
          <span>{isEn ? 'EVM Dashboard' : 'Tableau de Bord EVM'}</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab('evm_ptba')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'evm_ptba'
              ? 'bg-[#0c4a6e] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
          <span>{isEn ? 'AWPB (Annual Prog.)' : 'PTBA (Prog. Annuel)'}</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab('evm_suivi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'evm_suivi'
              ? 'bg-[#0c4a6e] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TestTube className="w-3.5 h-3.5 shrink-0" />
          <span>{isEn ? 'EVM Tracking' : 'Suivi EVM'}</span>
        </button>
      </div>

      {activeSubTab === 'evm_dashboard' && renderDashboard()}
      {activeSubTab === 'evm_ptba' && renderPTBA()}
      {activeSubTab === 'evm_suivi' && renderProcessus()}
    </div>
  );
};
