import { Dossier, PertNode, Project, Task } from './types';

export const STANDARD_PHASES = [
  'AVANT PROJET',
  'CONCEPTION',
  'PLANIFICATION',
  'EXÉCUTION & SUIVI',
  'CLÔTURE'
];

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(dateStr: string, days: number): string {
  const base = new Date(dateStr);
  if (isNaN(base.getTime())) return getTodayISO();
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeAmountToFCFA(
  val?: number | string,
  refBudget?: number
): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  if (isNaN(num)) return 0;
  if (
    Math.abs(num) > 0 &&
    Math.abs(num) < 10000 &&
    (refBudget === undefined || refBudget >= 10000 || refBudget === 0)
  ) {
    return Math.round(num * 1000000);
  }
  return Math.round(num);
}

export function computeTaskBudgetAndDisbursement(
  task: Task,
  todayISO: string = getTodayISO()
): {
  budgetPrevu: number;
  montantDecaisse: number;
  valeurAcquise: number;
  coutReel: number;
  resteADecaisser: number;
  tauxDecaissementPct: number;
  ecartBudget: number;
  dateDecaissementPrevu: string;
  dateDecaissementReel: string;
} {
  const budgetPrevu = normalizeAmountToFCFA(task.budget, Number(task.budget) || 0);
  const defaultRatio =
    task.status === 'Terminé' ? 1 : task.status === 'En cours' ? 0.5 : 0;
  const defaultAmount = Math.round(budgetPrevu * defaultRatio);

  const rawVA =
    task.valeurAcquise !== undefined
      ? normalizeAmountToFCFA(task.valeurAcquise, budgetPrevu)
      : defaultAmount;
  const rawCR =
    task.coutReel !== undefined
      ? normalizeAmountToFCFA(task.coutReel, budgetPrevu)
      : rawVA;
  const montantDecaisse =
    task.montantDecaissementReel !== undefined
      ? normalizeAmountToFCFA(task.montantDecaissementReel, budgetPrevu)
      : rawCR;

  const valeurAcquise =
    task.valeurAcquise !== undefined ? rawVA : montantDecaisse;
  const coutReel = task.coutReel !== undefined ? rawCR : montantDecaisse;
  const resteADecaisser = Math.max(0, budgetPrevu - montantDecaisse);
  const tauxDecaissementPct =
    budgetPrevu > 0
      ? Math.min(100, Math.round((montantDecaisse / budgetPrevu) * 100))
      : task.status === 'Terminé' || montantDecaisse > 0
      ? 100
      : 0;
  const ecartBudget = budgetPrevu - coutReel;

  const dateDecaissementPrevu =
    task.dateDecaissementPrevu && task.dateDecaissementPrevu.trim() !== ''
      ? task.dateDecaissementPrevu.trim()
      : task.startDate || todayISO;

  const dateDecaissementReel =
    task.dateDecaissementReel && task.dateDecaissementReel.trim() !== ''
      ? task.dateDecaissementReel.trim()
      : montantDecaisse > 0
      ? task.actualStartDate || task.startDate || todayISO
      : '';

  return {
    budgetPrevu,
    montantDecaisse,
    valeurAcquise,
    coutReel,
    resteADecaisser,
    tauxDecaissementPct,
    ecartBudget,
    dateDecaissementPrevu,
    dateDecaissementReel
  };
}

/**
 * Normalise les dates de décaissement / exécution budgétaire en fonction de la date d'aujourd'hui
 */
export function getNormalizedExecutionDates(
  task: Task,
  todayISO: string = getTodayISO()
): { actualStart: string; actualEnd: string } {
  const fin = computeTaskBudgetAndDisbursement(task, todayISO);

  if (fin.budgetPrevu > 0) {
    if (fin.montantDecaisse >= fin.budgetPrevu) {
      const start = fin.dateDecaissementReel || task.startDate || todayISO;
      const end = task.actualEndDate || fin.dateDecaissementReel || task.endDate || todayISO;
      return {
        actualStart: start,
        actualEnd: end >= start ? end : start
      };
    }
    if (fin.montantDecaisse > 0) {
      return {
        actualStart: fin.dateDecaissementReel || task.startDate || todayISO,
        actualEnd: ''
      };
    }
    return {
      actualStart: '',
      actualEnd: ''
    };
  }

  const rawStart =
    task.actualStartDate &&
    task.actualStartDate.trim() !== '' &&
    task.actualStartDate.trim() <= todayISO
      ? task.actualStartDate.trim()
      : '';
  const rawEnd =
    task.actualEndDate &&
    task.actualEndDate.trim() !== '' &&
    task.actualEndDate.trim() <= todayISO
      ? task.actualEndDate.trim()
      : '';

  if (rawStart && rawEnd) {
    return {
      actualStart: rawStart,
      actualEnd: rawEnd >= rawStart ? rawEnd : rawStart
    };
  }
  if (task.manualBlocked || task.status === 'Bloqué') {
    return { actualStart: rawStart, actualEnd: '' };
  }
  if (rawStart) {
    return { actualStart: rawStart, actualEnd: '' };
  }
  return { actualStart: '', actualEnd: '' };
}

/**
 * Statut automatique fonction du budget et du décaissement (et non plus uniquement des tâches).
 */
export function computeEffectiveStatus(
  task: Task,
  todayISO: string = getTodayISO()
): Task['status'] {
  const fin = computeTaskBudgetAndDisbursement(task, todayISO);

  if (task.manualBlocked || task.status === 'Bloqué') {
    return 'Bloqué';
  }

  if (fin.budgetPrevu > 0) {
    if (fin.coutReel > fin.budgetPrevu) {
      return 'Bloqué';
    }
    if (fin.montantDecaisse >= fin.budgetPrevu || fin.valeurAcquise >= fin.budgetPrevu) {
      return 'Terminé';
    }
    if (fin.montantDecaisse > 0 || fin.valeurAcquise > 0) {
      return 'En cours';
    }
    return 'À faire';
  }

  if (fin.montantDecaisse > 0 || fin.valeurAcquise > 0 || task.status === 'Terminé') {
    return 'Terminé';
  }
  if (task.status === 'En cours') {
    return 'En cours';
  }
  return 'À faire';
}

export interface TaskComputedMetrics {
  plannedDurationDays: number;
  plannedDurationLabel: string;
  realDurationDays: number | null;
  realDurationLabel: string;
  ecartDebutDays: number;
  ecartDebutLabel: string;
  ecartFinDays: number;
  ecartFinLabel: string;
  effectiveStatus: Task['status'];
  effectiveActualStartDate: string;
  effectiveActualEndDate: string;
  budgetPrevu: number;
  montantDecaisse: number;
  valeurAcquise: number;
  coutReel: number;
  resteADecaisser: number;
  tauxDecaissementPct: number;
  ecartBudget: number;
  dateDecaissementPrevu: string;
  dateDecaissementReel: string;
}

export function computeTaskMetrics(
  task: Task,
  todayISO: string = getTodayISO()
): TaskComputedMetrics {
  const fin = computeTaskBudgetAndDisbursement(task, todayISO);
  const effectiveStatus = computeEffectiveStatus(task, todayISO);
  const { actualStart, actualEnd } = getNormalizedExecutionDates(task, todayISO);

  const effectiveActualStartDate =
    effectiveStatus === 'À faire' ? '' : fin.dateDecaissementReel || actualStart;
  const effectiveActualEndDate =
    effectiveStatus === 'Terminé'
      ? fin.dateDecaissementReel || actualEnd || task.endDate
      : '';

  const todayMs = new Date(todayISO).getTime();
  const startPrevMs = new Date(task.startDate).getTime();
  const endPrevMs = new Date(task.endDate).getTime();
  const decPrevMs = new Date(fin.dateDecaissementPrevu).getTime();
  const decReelMs = fin.dateDecaissementReel
    ? new Date(fin.dateDecaissementReel).getTime()
    : NaN;

  const plannedDurationDays =
    task.type === 'jalon'
      ? 0
      : !isNaN(startPrevMs) && !isNaN(endPrevMs)
      ? Math.max(1, Math.round((endPrevMs - startPrevMs) / 86400000))
      : 1;

  const plannedDurationLabel = `${plannedDurationDays}j`;

  const realDurationDays: number | null = fin.tauxDecaissementPct;
  const realDurationLabel = `${fin.tauxDecaissementPct}%`;

  // Écart de décaissement (en jours par rapport à la date de décaissement prévue)
  let ecartDebutDays = 0;
  if (!isNaN(decPrevMs)) {
    if (!isNaN(decReelMs)) {
      ecartDebutDays = Math.round((decReelMs - decPrevMs) / 86400000);
    } else if (todayMs > decPrevMs && effectiveStatus !== 'Terminé') {
      ecartDebutDays = Math.round((todayMs - decPrevMs) / 86400000);
    }
  }

  let ecartFinDays = 0;
  if (!isNaN(endPrevMs)) {
    if (!isNaN(decReelMs) && effectiveStatus === 'Terminé') {
      ecartFinDays = Math.round((decReelMs - endPrevMs) / 86400000);
    } else if (todayMs > endPrevMs && effectiveStatus !== 'Terminé') {
      ecartFinDays = Math.round((todayMs - endPrevMs) / 86400000);
    }
  }

  const formatEcart = (days: number): string => {
    if (days > 0) return `+${days}j (Retard Déc.)`;
    if (days < 0) return `${days}j (Avance Déc.)`;
    return '0j (Conforme)';
  };

  return {
    plannedDurationDays,
    plannedDurationLabel,
    realDurationDays,
    realDurationLabel,
    ecartDebutDays,
    ecartDebutLabel: formatEcart(ecartDebutDays),
    ecartFinDays,
    ecartFinLabel: formatEcart(ecartFinDays),
    effectiveStatus,
    effectiveActualStartDate,
    effectiveActualEndDate,
    budgetPrevu: fin.budgetPrevu,
    montantDecaisse: fin.montantDecaisse,
    valeurAcquise: fin.valeurAcquise,
    coutReel: fin.coutReel,
    resteADecaisser: fin.resteADecaisser,
    tauxDecaissementPct: fin.tauxDecaissementPct,
    ecartBudget: fin.ecartBudget,
    dateDecaissementPrevu: fin.dateDecaissementPrevu,
    dateDecaissementReel: fin.dateDecaissementReel
  };
}

/**
 * Recalcule automatiquement le décaissement, le budget acquis et les dates lors d'un déplacement dans le Kanban Budgétaire
 */
export function recalculateProjectTasksOnKanbanMove(
  tasks: Task[],
  movedTaskId: string,
  newStatus: Task['status'],
  todayISO: string = getTodayISO()
): Task[] {
  const cloned: Task[] = tasks.map(t => ({ ...t }));
  const target = cloned.find(t => t.id === movedTaskId);
  if (!target) return cloned;

  const metrics = computeTaskMetrics(target, todayISO);
  const duration =
    target.type === 'jalon' ? 0 : Math.max(1, metrics.plannedDurationDays);
  const budgetFull = metrics.budgetPrevu;

  target.status = newStatus;
  target.manualBlocked = newStatus === 'Bloqué';

  if (newStatus === 'En cours') {
    const partialAmount =
      metrics.montantDecaisse > 0 && metrics.montantDecaisse < budgetFull
        ? metrics.montantDecaisse
        : Math.round(budgetFull * 0.5);
    target.montantDecaissementReel = partialAmount;
    target.valeurAcquise = partialAmount;
    target.coutReel = partialAmount;
    target.dateDecaissementReel = target.dateDecaissementReel || todayISO;
    const execStart = target.dateDecaissementReel || todayISO;
    target.actualStartDate = execStart;
    target.actualEndDate = '';
  } else if (newStatus === 'Terminé') {
    target.montantDecaissementReel = budgetFull;
    target.valeurAcquise = budgetFull;
    target.coutReel = budgetFull;
    target.dateDecaissementReel = target.dateDecaissementReel || todayISO;
    const execEnd = target.dateDecaissementReel || todayISO;
    const execStart =
      target.actualStartDate ||
      (target.type === 'jalon' ? execEnd : addDaysISO(execEnd, -duration));
    target.actualStartDate = execStart;
    target.actualEndDate = execEnd;
  } else if (newStatus === 'À faire') {
    target.montantDecaissementReel = 0;
    target.valeurAcquise = 0;
    target.coutReel = 0;
    target.dateDecaissementReel = '';
    target.actualStartDate = '';
    target.actualEndDate = '';
  } else if (newStatus === 'Bloqué') {
    target.actualEndDate = '';
    target.manualBlocked = true;
  }

  // Cascade logical dependencies to all successor tasks while preserving each successor's duration
  const visited = new Set<string>([target.id]);
  const queue: string[] = [target.id];

  while (queue.length > 0) {
    const predId = queue.shift()!;
    const predTask = cloned.find(t => t.id === predId);
    if (!predTask) continue;

    const successors = cloned.filter(
      t => t.antecedent === predId && !visited.has(t.id)
    );
    for (const succ of successors) {
      visited.add(succ.id);
      const succMetrics = computeTaskMetrics(succ, todayISO);
      const succDur =
        succ.type === 'jalon' ? 0 : Math.max(1, succMetrics.plannedDurationDays);
      const nextStart = addDaysISO(
        predTask.endDate,
        succ.type === 'jalon' ? 0 : 1
      );
      succ.startDate = nextStart;
      succ.dateDecaissementPrevu = nextStart;
      succ.endDate =
        succ.type === 'jalon' ? nextStart : addDaysISO(nextStart, succDur);
      queue.push(succ.id);
    }
  }

  return cloned;
}

export interface ProjectPertResult {
  projectId: string;
  projectName: string;
  nodes: PertNode[];
  projectDuration: number;
  totalBudget: number;
  totalDecaisse: number;
  totalResteADecaisser: number;
  tauxDecaissementGlobal: number;
  criticalBudget: number;
  criticalPathNodes: PertNode[];
  criticalPathCodes: string[];
  blockedCriticalNodes: PertNode[];
  delayedCriticalNodes: PertNode[];
  slackNodes: PertNode[];
  interpretation: {
    criticalPathSummary: string;
    slackSummary: string;
    riskAndSteeringSummary: string;
  };
}

export function computePertForProject(
  project: Project,
  todayISO: string = getTodayISO()
): ProjectPertResult {
  const rawTasks = Array.isArray(project.tasks) ? project.tasks : [];

  const orderedTasks: { task: Task; code: string }[] = [];
  STANDARD_PHASES.forEach((phaseName, pIdx) => {
    const phaseTasks = rawTasks.filter(t => t.phase === phaseName);
    phaseTasks.forEach((tk, tIdx) => {
      const prefix = tk.type === 'jalon' ? 'J' : 'T';
      orderedTasks.push({
        task: tk,
        code: `${prefix}.${pIdx + 1}.${tIdx + 1}`
      });
    });
  });

  rawTasks
    .filter(t => !STANDARD_PHASES.includes(t.phase))
    .forEach((tk, idx) => {
      const prefix = tk.type === 'jalon' ? 'J' : 'T';
      orderedTasks.push({
        task: tk,
        code: `${prefix}.X.${idx + 1}`
      });
    });

  const codeById = new Map<string, string>();
  const taskById = new Map<string, Task>();
  orderedTasks.forEach(({ task, code }) => {
    codeById.set(task.id, code);
    taskById.set(task.id, task);
  });

  const getPrecedingChain = (taskId: string): string[] => {
    const chain: string[] = [];
    const seen = new Set<string>([taskId]);
    let curr = taskById.get(taskId);
    while (
      curr &&
      curr.antecedent &&
      curr.antecedent !== '—' &&
      codeById.has(curr.antecedent)
    ) {
      if (seen.has(curr.antecedent)) break;
      seen.add(curr.antecedent);
      chain.unshift(codeById.get(curr.antecedent)!);
      curr = taskById.get(curr.antecedent);
    }
    return chain;
  };

  const nodes: PertNode[] = orderedTasks.map(({ task, code }) => {
    const metrics = computeTaskMetrics(task, todayISO);
    const hasValidAnt = Boolean(
      task.antecedent && task.antecedent !== '—' && codeById.has(task.antecedent)
    );
    const antId = hasValidAnt ? task.antecedent! : '—';
    const antCode = hasValidAnt ? codeById.get(task.antecedent!)! : '—';
    const chain = getPrecedingChain(task.id);

    return {
      id: task.id,
      code,
      name: task.name,
      type: task.type,
      phase: task.phase,
      projectId: project.id,
      projectName: project.name,
      assignee: task.assignee || '—',
      bailleur: task.bailleur || task.autorite || '—',
      budget: metrics.budgetPrevu,
      montantDecaisse: metrics.montantDecaisse,
      resteADecaisser: metrics.resteADecaisser,
      tauxDecaissement: metrics.tauxDecaissementPct,
      cumulBudgetES: 0,
      cumulBudgetEF: metrics.budgetPrevu,
      dateDecaissementPrevu: metrics.dateDecaissementPrevu,
      dateDecaissementReel: metrics.dateDecaissementReel,
      startDate: task.startDate,
      endDate: task.endDate,
      actualStartDate: task.actualStartDate,
      actualEndDate: task.actualEndDate,
      status: metrics.effectiveStatus,
      duration: metrics.plannedDurationDays,
      antecedentId: antId,
      antecedentCode: antCode,
      precedingChainCodes: chain.length > 0 ? chain.join(' → ') : '—',
      successorCodes: [],
      es: 0,
      ef: metrics.plannedDurationDays,
      ls: 0,
      lf: metrics.plannedDurationDays,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false,
      startDelayDays: metrics.ecartDebutDays,
      endDelayDays: metrics.ecartFinDays,
      level: chain.length
    };
  });

  const nodeMap = new Map<string, PertNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  nodes.forEach(n => {
    if (n.antecedentId !== '—' && nodeMap.has(n.antecedentId)) {
      const pred = nodeMap.get(n.antecedentId)!;
      pred.successorCodes.push(n.code);
    }
  });

  // Forward Pass (Cumulative Budget & Timing along chain)
  const sortedByLevel = [...nodes].sort((a, b) => a.level - b.level);
  sortedByLevel.forEach(n => {
    if (n.antecedentId !== '—' && nodeMap.has(n.antecedentId)) {
      const pred = nodeMap.get(n.antecedentId)!;
      n.es = pred.ef;
      n.cumulBudgetES = pred.cumulBudgetEF;
    } else {
      n.es = 0;
      n.cumulBudgetES = 0;
    }
    n.ef = n.es + n.duration;
    n.cumulBudgetEF = n.cumulBudgetES + n.budget;
  });

  const projectDuration =
    nodes.length > 0 ? Math.max(...nodes.map(n => n.ef), 1) : 0;
  const maxChainBudget =
    nodes.length > 0 ? Math.max(...nodes.map(n => n.cumulBudgetEF), 0) : 0;

  // Backward Pass
  const reverseByLevel = [...sortedByLevel].reverse();
  reverseByLevel.forEach(n => {
    const succs = nodes.filter(s => s.antecedentId === n.id);
    if (succs.length === 0) {
      n.lf = projectDuration;
    } else {
      n.lf = Math.min(...succs.map(s => s.ls));
    }
    n.ls = Math.max(0, n.lf - n.duration);
    n.totalFloat = Math.max(0, n.ls - n.es);
    n.freeFloat =
      succs.length > 0
        ? Math.max(0, Math.min(...succs.map(s => s.es)) - n.ef)
        : n.totalFloat;
    // Critical if on the critical financial/schedule chain or has unpaid budget bottleneck
    n.isCritical =
      n.totalFloat === 0 ||
      (maxChainBudget > 0 && n.cumulBudgetEF === maxChainBudget) ||
      n.status === 'Bloqué';
  });

  const totalBudget = nodes.reduce((s, n) => s + n.budget, 0);
  const totalDecaisse = nodes.reduce((s, n) => s + n.montantDecaisse, 0);
  const totalResteADecaisser = Math.max(0, totalBudget - totalDecaisse);
  const tauxDecaissementGlobal =
    totalBudget > 0 ? Math.round((totalDecaisse / totalBudget) * 100) : 0;

  const criticalPathNodes = sortedByLevel.filter(n => n.isCritical);
  const criticalPathCodes = criticalPathNodes.map(n => n.code);
  const criticalBudget = criticalPathNodes.reduce((s, n) => s + n.budget, 0);
  const blockedCriticalNodes = criticalPathNodes.filter(
    n => n.status === 'Bloqué'
  );
  const delayedCriticalNodes = criticalPathNodes.filter(
    n => n.tauxDecaissement < 100 && (n.endDelayDays > 0 || n.startDelayDays > 0)
  );
  const slackNodes = nodes.filter(n => !n.isCritical);

  const fmtFCFA = (v: number) => `${v.toLocaleString('fr-FR')} FCFA`;

  const criticalPathSummary =
    criticalPathNodes.length > 0
      ? `Chaîne Critique Budgétaire & Décaissement (« ${project.name} ») : ${criticalPathNodes.length} ligne(s) budgétaire(s) critique(s) (${criticalPathCodes.join(' → ')}) concentrant ${fmtFCFA(criticalBudget)} sur un budget total de ${fmtFCFA(totalBudget)}.`
      : `Aucune ligne budgétaire enregistrée pour calculer le réseau PERT financier.`;

  const slackSummary = `Exécution Budgétaire & Décaissements : ${fmtFCFA(totalDecaisse)} décaissés (${tauxDecaissementGlobal}%) • Reste à décaisser : ${fmtFCFA(totalResteADecaisser)}.`;

  const riskAndSteeringSummary =
    blockedCriticalNodes.length > 0 || delayedCriticalNodes.length > 0
      ? `ALERTE TRÉSORERIE & DÉCAISSEMENT : ${blockedCriticalNodes.length} ligne(s) en blocage/dépassement (${blockedCriticalNodes.map(b => b.code).join(', ') || 'aucune'}) et ${delayedCriticalNodes.length} ligne(s) en retard de décaissement. Prioriser la mobilisation des fonds auprès des bailleurs concernés.`
      : `TRAJECTOIRE BUDGÉTAIRE MAÎTRISÉE : Aucun dépassement ni blocage critique de décaissement constaté (${tauxDecaissementGlobal}% du budget exécuté).`;

  return {
    projectId: project.id,
    projectName: project.name,
    nodes,
    projectDuration,
    totalBudget,
    totalDecaisse,
    totalResteADecaisser,
    tauxDecaissementGlobal,
    criticalBudget,
    criticalPathNodes,
    criticalPathCodes,
    blockedCriticalNodes,
    delayedCriticalNodes,
    slackNodes,
    interpretation: {
      criticalPathSummary,
      slackSummary,
      riskAndSteeringSummary
    }
  };
}

export function computeDossierPertSummary(
  dossier?: Dossier,
  todayISO: string = getTodayISO()
): ProjectPertResult[] {
  if (!dossier) return [];
  const results: ProjectPertResult[] = [];
  (dossier.axes || []).forEach(axe => {
    (axe.projects || []).forEach(proj => {
      results.push(computePertForProject(proj, todayISO));
    });
  });
  return results;
}
