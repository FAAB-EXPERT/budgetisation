import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, FolderTree, Folder, Calendar, Plus, 
  CheckCircle, Clock, ChevronRight, Activity, Menu, Target, 
  Trash2, Diamond, DollarSign, 
  Edit3, Filter, FileSpreadsheet, FlaskConical, Building2, TestTube,
  Home, FolderOpen, Mail, Phone, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';

// --- TYPES ---
export interface Task {
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

export interface Project {
  id: string;
  name: string;
  budgetsAnnuels?: Record<string, string | number>;
  tasks: Task[];
  dossierName?: string;
  dossierId?: string;
  axeName?: string;
  axeId?: string;
  isReadOnly?: boolean;
}

export interface Axe {
  id: string;
  name: string;
  budget?: number;
  projects: Project[];
}

export interface Dossier {
  id: string;
  name: string;
  institution?: string;
  isReadOnly?: boolean;
  startYear?: string;
  endYear?: string;
  axes: Axe[];
}

// --- COULEURS & PHASES STANDARD ---
const COLORS: Record<string, string> = { 
  'Terminé': '#10B981', 
  'En cours': '#3B82F6', 
  'Bloqué': '#EF4444', 
  'À faire': '#9CA3AF' 
};

const DISTRIBUTION_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', 
  '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#6366F1', '#D946EF', '#64748B', '#0EA5E9'
];

const STANDARD_PHASES = [
  'PHASE DU CYCLE : AVANT PROJET',
  'PHASE DU CYCLE : CONCEPTION',
  'PHASE DU CYCLE : PLANIFICATION',
  'PHASE DU CYCLE : EXÉCUTION & SUIVI',
  'PHASE DU CYCLE : CLÔTURE'
];

// Données exemple pour démonstration en un clic
const SAMPLE_DEMO_DATA: Dossier[] = [
  {
    id: 'demo-dossier-1',
    name: 'Programme National d\'Appui au Développement Agricole (PNADA)',
    institution: 'Ministère de l\'Agriculture & Développement Rural',
    isReadOnly: false,
    startYear: '2025',
    endYear: '2027',
    axes: [
      {
        id: 'demo-axe-1',
        name: 'Composante 1 : Aménagement hydro-agricole et périmètres irrigués',
        budget: 450,
        projects: [
          {
            id: 'demo-proj-1',
            name: 'Réhabilitation des barrages collinaires et digues de rétention',
            budgetsAnnuels: { '2025': '150', '2026': '180', '2027': '120' },
            tasks: [
              {
                id: 't-101',
                type: 'tache',
                name: 'Études d\'impact environnemental et géotechnique',
                phase: 'PHASE DU CYCLE : AVANT PROJET',
                assignee: 'Bureau Veritas & Labo National',
                responsableTresorerie: 'Banque Mondiale (IDA)',
                startDate: '2025-01-10',
                endDate: '2025-03-25',
                dateDecaissementPrevu: '2025-01-15',
                dateDecaissementReel: '2025-01-20',
                montantDecaissementPrevu: 40,
                montantDecaissementReel: 40,
                coutPlanifie: 40,
                valeurAcquise: 40,
                coutReel: 38,
                status: 'Terminé',
                motifBlocage: '',
                valideVA: true,
                dateVA: '2025-03-20'
              },
              {
                id: 't-102',
                type: 'jalon',
                name: 'Validation du rapport d\'avant-projet sommaire (APS)',
                phase: 'PHASE DU CYCLE : AVANT PROJET',
                assignee: 'Comité Technique Interministériel',
                responsableTresorerie: 'Trésor Public',
                startDate: '2025-03-30',
                endDate: '2025-03-30',
                dateDecaissementPrevu: '2025-03-30',
                dateDecaissementReel: '2025-03-30',
                montantDecaissementPrevu: 5,
                montantDecaissementReel: 5,
                coutPlanifie: 5,
                valeurAcquise: 5,
                coutReel: 5,
                status: 'Terminé',
                motifBlocage: '',
                valideVA: true,
                dateVA: '2025-03-30'
              },
              {
                id: 't-103',
                type: 'tache',
                name: 'Élaboration du DAO et contractualisation des entreprises de BTP',
                phase: 'PHASE DU CYCLE : CONCEPTION',
                assignee: 'Cellule Passation des Marchés',
                responsableTresorerie: 'BAD (Fonds FAD)',
                startDate: '2025-04-01',
                endDate: '2025-06-30',
                dateDecaissementPrevu: '2025-04-15',
                dateDecaissementReel: '2025-04-20',
                montantDecaissementPrevu: 30,
                montantDecaissementReel: 30,
                coutPlanifie: 30,
                valeurAcquise: 30,
                coutReel: 32,
                status: 'Terminé',
                motifBlocage: '',
                valideVA: true,
                dateVA: '2025-06-25'
              },
              {
                id: 't-104',
                type: 'tache',
                name: 'Travaux de terrassement et confortement des digues prioritaires',
                phase: 'PHASE DU CYCLE : EXÉCUTION & SUIVI',
                assignee: 'Groupement BTP Sahel',
                responsableTresorerie: 'Banque Mondiale (IDA)',
                startDate: '2025-07-01',
                endDate: '2025-12-15',
                dateDecaissementPrevu: '2025-07-10',
                dateDecaissementReel: '2025-08-05',
                montantDecaissementPrevu: 75,
                montantDecaissementReel: 60,
                coutPlanifie: 75,
                valeurAcquise: 55,
                coutReel: 62,
                status: 'En cours',
                motifBlocage: ''
              },
              {
                id: 't-105',
                type: 'tache',
                name: 'Fourniture et pose des vannes motrices télécommandées',
                phase: 'PHASE DU CYCLE : EXÉCUTION & SUIVI',
                assignee: 'HydroMéca Tech',
                responsableTresorerie: 'BAD (Fonds FAD)',
                startDate: '2025-09-01',
                endDate: '2025-11-30',
                dateDecaissementPrevu: '2025-09-15',
                dateDecaissementReel: '',
                montantDecaissementPrevu: 45,
                montantDecaissementReel: 0,
                coutPlanifie: 45,
                valeurAcquise: 10,
                coutReel: 15,
                status: 'Bloqué',
                motifBlocage: 'Retard d\'acheminement douanier au port autonome'
              }
            ]
          }
        ]
      },
      {
        id: 'demo-axe-2',
        name: 'Composante 2 : Recherche agronomique et semences résilientes',
        budget: 280,
        projects: [
          {
            id: 'demo-proj-2',
            name: 'Multiplication et diffusion de variétés biofortifiées de manioc et maïs',
            budgetsAnnuels: { '2025': '100', '2026': '100', '2027': '80' },
            tasks: [
              {
                id: 't-201',
                type: 'tache',
                name: 'Sélection participative en stations de recherche expérimentales',
                phase: 'PHASE DU CYCLE : PLANIFICATION',
                assignee: 'Institut National de Recherche Agronomique',
                responsableTresorerie: 'Union Européenne (Fonds FED)',
                startDate: '2025-02-01',
                endDate: '2025-05-30',
                dateDecaissementPrevu: '2025-02-15',
                dateDecaissementReel: '2025-02-18',
                montantDecaissementPrevu: 35,
                montantDecaissementReel: 35,
                coutPlanifie: 35,
                valeurAcquise: 35,
                coutReel: 34,
                status: 'Terminé',
                valideVA: true,
                dateVA: '2025-05-25'
              },
              {
                id: 't-202',
                type: 'tache',
                name: 'Mise en place de 120 parcelles vitrines chez les coopératives',
                phase: 'PHASE DU CYCLE : EXÉCUTION & SUIVI',
                assignee: 'Agence Nationale d\'Appui Rural',
                responsableTresorerie: 'Union Européenne (Fonds FED)',
                startDate: '2025-06-01',
                endDate: '2025-10-30',
                dateDecaissementPrevu: '2025-06-15',
                dateDecaissementReel: '2025-06-25',
                montantDecaissementPrevu: 50,
                montantDecaissementReel: 50,
                coutPlanifie: 50,
                valeurAcquise: 40,
                coutReel: 42,
                status: 'En cours'
              },
              {
                id: 't-203',
                type: 'tache',
                name: 'Campagne d\'audit agronomique et certification des semences',
                phase: 'PHASE DU CYCLE : CLÔTURE',
                assignee: 'Direction de la Protection des Végétaux',
                responsableTresorerie: 'Budget National',
                startDate: '2025-11-01',
                endDate: '2025-12-20',
                dateDecaissementPrevu: '2025-11-10',
                dateDecaissementReel: '',
                montantDecaissementPrevu: 15,
                montantDecaissementReel: 0,
                coutPlanifie: 15,
                valeurAcquise: 0,
                coutReel: 0,
                status: 'À faire'
              }
            ]
          }
        ]
      }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'accueil' | 'dashboard' | 'projects' | 'ptba' | 'processus'>('accueil'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Initialisation avec sauvegarde locale persistante
  const [data, setData] = useState<Dossier[]>(() => {
    try {
      const savedData = localStorage.getItem('universal_budget_data_v1');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch (e) {
      console.error("Erreur de chargement des données locales :", e);
      return [];
    }
  });

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem('universal_budget_data_v1', JSON.stringify(data));
  }, [data]);

  const [filterProcessusDossier, setFilterProcessusDossier] = useState('FULL');
  const [filterProcessusYear, setFilterProcessusYear] = useState('ALL');
  const [filterProcessusAxe, setFilterProcessusAxe] = useState('FULL');
  const [filterProcessusProj, setFilterProcessusProj] = useState('FULL');
  const [filterProcessusQuarter, setFilterProcessusQuarter] = useState('FULL');
  
  const [filterDashDossier, setFilterDashDossier] = useState('FULL');
  const [filterDashYear, setFilterDashYear] = useState('ALL');
  const [filterDashAxe, setFilterDashAxe] = useState('FULL');
  const [filterDashProj, setFilterDashProj] = useState('FULL');
  const [filterDashQuarter, setFilterDashQuarter] = useState('FULL');

  const [filterPTBADossier, setFilterPTBADossier] = useState('FULL');
  const [filterPTBAYear, setFilterPTBAYear] = useState('ALL');
  const [filterPTBAAxe, setFilterPTBAAxe] = useState('FULL');
  const [filterPTBAProj, setFilterPTBAProj] = useState('FULL');
  const [filterPTBAQuarter, setFilterPTBAQuarter] = useState('FULL');

  // --- États pour l'édition en ligne des tâches ---
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); 
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Task>>({});

  // Charger un exemple de démonstration
  const handleLoadDemoData = () => {
    setData(SAMPLE_DEMO_DATA);
    setFilterProcessusDossier(SAMPLE_DEMO_DATA[0].id);
    setFilterPTBADossier(SAMPLE_DEMO_DATA[0].id);
    setFilterDashDossier(SAMPLE_DEMO_DATA[0].id);
  };

  // Vider les données (remise à blanc)
  const handleClearData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser la base de données ? Toutes les données seront effacées.")) {
      setData([]);
      setFilterProcessusDossier('FULL');
      setFilterPTBADossier('FULL');
      setFilterDashDossier('FULL');
      setActiveTab('accueil');
    }
  };

  // Déterminer l'institution active pour le titre
  const activeInstitution = useMemo(() => {
    if (filterProcessusDossier !== 'FULL') {
      const dossier = data.find(d => d.id === filterProcessusDossier);
      return dossier ? dossier.institution : '';
    } else if (filterPTBADossier !== 'FULL') {
      const dossier = data.find(d => d.id === filterPTBADossier);
      return dossier ? dossier.institution : '';
    } else if (filterDashDossier !== 'FULL') {
      const dossier = data.find(d => d.id === filterDashDossier);
      return dossier ? dossier.institution : '';
    }
    const firstWithInst = data.find(d => d.institution);
    return firstWithInst?.institution || '';
  }, [filterProcessusDossier, filterPTBADossier, filterDashDossier, data]);

  const handleAddTask = (projectId: string, phase: string) => {
    setEditingTaskId('new');
    setEditingProjectId(projectId);
    setEditingPhase(phase);
    setEditFormData({
      type: 'tache',
      name: '',
      antecedent: '—',
      moisStr: '',
      assignee: '',
      responsabilite: '',
      responsableTresorerie: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dateDecaissementPrevu: '',
      dateDecaissementReel: '',
      montantDecaissementPrevu: '',
      montantDecaissementReel: '',
      coutPlanifie: 0,
      valeurAcquise: 0,
      coutReel: 0,
      status: 'À faire',
      motifBlocage: ''
    });
  };

  const handleEditTask = (projectId: string, phase: string, task: Task) => {
    setEditingTaskId(task.id);
    setEditingProjectId(projectId);
    setEditingPhase(phase);
    setEditFormData({
      type: task.type || 'tache',
      name: task.name || '',
      antecedent: task.antecedent || '—',
      moisStr: task.moisStr || '',
      assignee: task.assignee || '',
      responsabilite: task.responsabilite || '',
      responsableTresorerie: task.responsableTresorerie || '',
      startDate: task.startDate || '',
      endDate: task.endDate || '',
      dateDecaissementPrevu: task.dateDecaissementPrevu || '',
      dateDecaissementReel: task.dateDecaissementReel || '',
      montantDecaissementPrevu: task.montantDecaissementPrevu !== undefined ? task.montantDecaissementPrevu : '',
      montantDecaissementReel: task.montantDecaissementReel !== undefined ? task.montantDecaissementReel : (task.coutReel || ''),
      coutPlanifie: task.coutPlanifie || 0,
      valeurAcquise: task.valeurAcquise !== undefined ? task.valeurAcquise : ((task.status === 'Terminé' || task.valideVA) ? (task.coutPlanifie || 0) : 0),
      coutReel: task.coutReel || 0,
      status: task.status || 'À faire',
      motifBlocage: task.motifBlocage || ''
    });
  };

  const handleSaveTask = () => {
    if (!editFormData.name || !editingProjectId) return;
    const newData = [...data];
    let found = false;
    
    for (const d of newData) {
      if (d.axes) {
        for (const a of d.axes) {
          if (a.projects) {
            const p = a.projects.find(proj => proj.id === editingProjectId);
            if (p) {
              if (!p.tasks) p.tasks = [];
              const valideVA = editFormData.status === 'Terminé';
              const dateVA = valideVA ? new Date().toISOString().split('T')[0] : '';
              const finalMotif = editFormData.status === 'Bloqué' ? editFormData.motifBlocage : '';

              if (editingTaskId === 'new') {
                p.tasks.push({
                  id: `t-${Date.now()}`,
                  phase: editingPhase || STANDARD_PHASES[0],
                  name: editFormData.name || '',
                  type: editFormData.type || 'tache',
                  antecedent: editFormData.antecedent || '—',
                  moisStr: editFormData.moisStr || '',
                  assignee: editFormData.assignee || '',
                  responsabilite: editFormData.responsabilite || '',
                  responsableTresorerie: editFormData.responsableTresorerie || '',
                  startDate: editFormData.startDate || new Date().toISOString().split('T')[0],
                  endDate: editFormData.endDate || new Date().toISOString().split('T')[0],
                  dateDecaissementPrevu: editFormData.dateDecaissementPrevu || '',
                  dateDecaissementReel: editFormData.dateDecaissementReel || '',
                  montantDecaissementPrevu: editFormData.montantDecaissementPrevu ?? '',
                  montantDecaissementReel: editFormData.montantDecaissementReel ?? '',
                  coutPlanifie: Number(editFormData.coutPlanifie) || 0,
                  valeurAcquise: Number(editFormData.valeurAcquise) || (valideVA ? (Number(editFormData.coutPlanifie) || 0) : 0),
                  coutReel: Number(editFormData.coutReel) || 0,
                  status: editFormData.status || 'À faire',
                  motifBlocage: finalMotif,
                  valideVA,
                  dateVA
                });
              } else {
                const tIndex = p.tasks.findIndex(t => t.id === editingTaskId);
                if (tIndex > -1) {
                  p.tasks[tIndex] = { 
                    ...p.tasks[tIndex], 
                    ...editFormData,
                    coutPlanifie: Number(editFormData.coutPlanifie) || 0,
                    valeurAcquise: Number(editFormData.valeurAcquise) || (valideVA ? (Number(editFormData.coutPlanifie) || 0) : 0),
                    coutReel: Number(editFormData.coutReel) || 0,
                    motifBlocage: finalMotif,
                    valideVA,
                    dateVA: valideVA && !p.tasks[tIndex].dateVA ? dateVA : p.tasks[tIndex].dateVA
                  } as Task;
                }
              }
              
              // Tri automatique par Phase puis par Date de début
              p.tasks.sort((a, b) => {
                const phaseA = a.phase ? STANDARD_PHASES.indexOf(a.phase) : 0;
                const phaseB = b.phase ? STANDARD_PHASES.indexOf(b.phase) : 0;
                if (phaseA !== phaseB) return phaseA - phaseB;
                return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
              });

              found = true;
              break;
            }
          }
        }
      }
      if (found) break;
    }
    
    setData(newData);
    setEditingTaskId(null);
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    const newData = [...data];
    for (const d of newData) {
      if (d.axes) {
        for (const a of d.axes) {
          if (a.projects) {
            const p = a.projects.find(proj => proj.id === projectId);
            if (p && p.tasks) {
              p.tasks = p.tasks.filter(t => t.id !== taskId);
            }
          }
        }
      }
    }
    setData(newData);
  };

  const ptbaAvailableProjects = useMemo(() => {
    const projs: Project[] = [];
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
    const projects: Project[] = [];
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

  const allTasks = useMemo(() => {
    const tasks: (Task & { projectName: string; projectId: string; axeId?: string })[] = [];
    allProjects.forEach(proj => {
      if (Array.isArray(proj.tasks)) {
        proj.tasks.forEach(task => tasks.push({ 
          ...task, 
          projectName: proj.name,
          projectId: proj.id,
          axeId: proj.axeId
        }));
      }
    });
    return tasks;
  }, [allProjects]);

  const addDossier = () => {
    const currentYear = new Date().getFullYear();
    const newDossier: Dossier = { 
      id: `dossier-${Date.now()}`, 
      name: 'Nouveau Programme Stratégique', 
      institution: '', 
      isReadOnly: false, 
      startYear: currentYear.toString(), 
      endYear: (currentYear + 2).toString(), 
      axes: [] 
    };
    setData([newDossier, ...data]);
    setFilterProcessusDossier(newDossier.id);
    setFilterPTBADossier(newDossier.id);
    setFilterDashDossier(newDossier.id);
  };

  const updateDossierYear = (dossierId: string, year: string) => {
    const newData = [...data];
    const dossier = newData.find(d => d.id === dossierId);
    if(dossier) dossier.startYear = year;
    setData(newData);
  };

  const updateDossierEndYear = (dossierId: string, year: string) => {
    const newData = [...data];
    const dossier = newData.find(d => d.id === dossierId);
    if(dossier) dossier.endYear = year;
    setData(newData);
  };

  const updateDossierInstitution = (dossierId: string, institution: string) => {
    const newData = [...data];
    const dossier = newData.find(d => d.id === dossierId);
    if(dossier) dossier.institution = institution;
    setData(newData);
  };

  const addAxe = (dossierId: string) => {
    const newData = [...data];
    const dossier = newData.find(d => d.id === dossierId);
    if(dossier) {
      dossier.axes.push({ id: `axe-${Date.now()}`, name: 'Nouvelle Composante', budget: 0, projects: [] });
      setData(newData);
    }
  };

  const addProject = (dossierId: string, axeId: string) => {
    const newData = [...data];
    const axe = newData.find(d => d.id === dossierId)?.axes.find(a => a.id === axeId);
    if(axe) {
      axe.projects.push({ id: `proj-${Date.now()}`, name: 'Nouveau Projet', budgetsAnnuels: { '2025': '', '2026': '', '2027': '' }, tasks: [] });
      setData(newData);
    }
  };

  const updateDossierItemName = (dossierId: string, axeId: string | null, projId: string | null, newName: string) => {
    const newData = [...data];
    if (projId && axeId) {
      const proj = newData.find(d => d.id === dossierId)?.axes.find(a => a.id === axeId)?.projects.find(p => p.id === projId);
      if(proj) proj.name = newName;
    } else if (axeId) {
      const axe = newData.find(d => d.id === dossierId)?.axes.find(a => a.id === axeId);
      if(axe) axe.name = newName;
    } else {
      const dossier = newData.find(d => d.id === dossierId);
      if(dossier) dossier.name = newName;
    }
    setData(newData);
  };

  const deleteDossier = (dossierId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce programme ?")) {
      setData(data.filter(d => d.id !== dossierId));
    }
  };

  const deleteAxe = (dossierId: string, axeId: string) => {
    const newData = [...data];
    const dossier = newData.find(d => d.id === dossierId);
    if(dossier) {
      dossier.axes = dossier.axes.filter(a => a.id !== axeId);
      setData(newData);
    }
  };

  const deleteProject = (dossierId: string, axeId: string, projId: string) => {
    const newData = [...data];
    const axe = newData.find(d => d.id === dossierId)?.axes.find(a => a.id === axeId);
    if(axe) {
      axe.projects = axe.projects.filter(p => p.id !== projId);
      setData(newData);
    }
  };

  const getQuarterOverlapDays = (startDateStr?: string, endDateStr?: string, targetYear?: string, qIndex?: number): number => {
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

  const getYearOverlapDays = (startDateStr?: string, endDateStr?: string, targetYear?: string): number => {
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

  const getProjectAnnualBudget = (proj: Project, year: string, isReadOnly?: boolean): number => {
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

  const getProjectTotalBudget = (proj: Project, isReadOnly?: boolean): number => {
    if (isReadOnly) {
       const annuels = proj.budgetsAnnuels || {};
       return (Number(annuels['2025']) || 0) + (Number(annuels['2026']) || 0) + (Number(annuels['2027']) || 0);
    }
    return (proj.tasks || []).reduce((sum, t) => sum + (Number(t.coutPlanifie) || 0), 0);
  };

  const fmtBudget = (val: number | string | undefined | null): string => {
    if (val === 0 || !val) return '0';
    return Number(val).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  };

  // --- ONGLET ACCUEIL ---
  const renderAccueil = () => (
    <div className="animate-in fade-in duration-500 h-full flex flex-col justify-center items-center py-6 w-full max-w-5xl mx-auto space-y-6 px-4">
      
      {/* HEADER HERO */}
      <div className="bg-[#8A0000] w-full rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 w-full">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs text-white/90 font-semibold mb-4 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
            <span>Gestion Axée sur les Résultats (GAR) & EVM</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Maîtrisez le Processus du <br />
            <span className="text-[#00E676] inline-block mt-1">Suivi Budgétaire & Stratégique</span>
          </h1>
          
          <p className="text-white/90 text-sm md:text-base max-w-2xl font-medium mb-8">
            <strong className="text-white font-black">FAAB GAR</strong> est la plateforme numérique de référence dédiée au pilotage de la performance institutionnelle, à la maîtrise de la valeur acquise (EVM) et à la conformité des programmes PTBA.
          </p>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 w-full">
            <div className="flex flex-wrap sm:flex-row gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab('projects')}
                className="bg-[#00A884] hover:bg-[#008f6f] text-white px-5 py-3 rounded-lg font-bold text-sm flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(0,168,132,0.3)] hover:shadow-[0_6px_20px_rgba(0,168,132,0.4)] hover:-translate-y-0.5 group"
              >
                <FolderOpen className="w-4 h-4 mr-2.5 group-hover:scale-110 transition-transform" />
                Ouvrir les Portefeuilles
              </button>

              <button 
                onClick={() => {
                  addDossier();
                  setActiveTab('projects');
                }}
                className="bg-transparent border-2 border-white/25 hover:border-[#00E676] text-white px-5 py-3 rounded-lg font-bold text-sm flex items-center justify-center transition-all hover:bg-white/10 hover:-translate-y-0.5 group"
              >
                <Plus className="w-4 h-4 mr-2 text-[#00E676] group-hover:scale-110 transition-transform" />
                Nouveau Programme
              </button>

              {data.length === 0 ? (
                <button 
                  onClick={handleLoadDemoData}
                  className="bg-white/15 hover:bg-white/25 border border-white/30 text-white px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center transition-all shadow-sm"
                  title="Charger un jeu de données complet pour tester immédiatement l'EVM et les graphiques"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                  Exemple Démo
                </button>
              ) : (
                <button 
                  onClick={handleClearData}
                  className="bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-100 px-3.5 py-3 rounded-lg font-bold text-xs flex items-center justify-center transition-all"
                  title="Vider la base de données actuelle pour repartir d'une page blanche"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Réinitialiser
                </button>
              )}
            </div>
            
            <div className="flex-1"></div>

            <div className="bg-[#2D2A32] rounded-xl p-5 border border-white/10 shadow-2xl min-w-[280px]">
              <h3 className="text-[#00E676] text-[9px] font-black uppercase tracking-[0.2em] mb-1.5">Application conçue par :</h3>
              <p className="text-white font-black text-lg mb-3 tracking-wide">KOFFIE FABIEN MICHAEL</p>
              <div className="space-y-2">
                <a href="mailto:fabien.frikupgeneration@gmail.com" className="text-white/80 hover:text-white text-xs flex items-center font-medium transition-colors">
                  <Mail className="w-3.5 h-3.5 mr-2.5 text-white/50" /> 
                  fabien.frikupgeneration@gmail.com
                </a>
                <a href="tel:+2250748082739" className="text-white/80 hover:text-white text-xs flex items-center font-medium transition-colors">
                  <Phone className="w-3.5 h-3.5 mr-2.5 text-white/50" /> 
                  00225 0748082739
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#88929B] w-full rounded-xl p-5 md:p-6 border-l-[6px] border-[#FF3B30] shadow-lg relative overflow-hidden">
        <h2 className="flex items-center text-[#FF3B30] font-black text-xs md:text-sm uppercase tracking-[0.1em] mb-3">
          <AlertCircle className="w-4 h-4 mr-2.5 shrink-0" strokeWidth={2.5} />
          Accord de confidentialité & Propriété Intellectuelle
        </h2>
        <p className="text-xs md:text-[13px] leading-relaxed text-white/95 font-medium text-justify">
          La présente plateforme, incluant son architecture structurelle, sa logique algorithmique et son design d'interface, constitue une œuvre de l'esprit protégée appartenant à son créateur. En utilisant cette application, l'administration ou l'institution utilisatrice s'engage formellement à respecter la stricte confidentialité de ce système. Toute copie, reproduction, ingénierie inverse, ou distribution non expressément autorisée de cet outil à des tiers est rigoureusement interdite sous peine de poursuites légales.
        </p>
      </div>

    </div>
  );

  const renderDashboard = () => {
    let filteredDashProjects = allProjects;
    if (filterDashDossier !== 'FULL') filteredDashProjects = filteredDashProjects.filter(p => p.dossierId === filterDashDossier);
    if (filterDashAxe !== 'FULL') filteredDashProjects = filteredDashProjects.filter(p => p.axeId === filterDashAxe);
    if (filterDashProj !== 'FULL') filteredDashProjects = filteredDashProjects.filter(p => p.id === filterDashProj);
    
    const filteredDashTasks: (Task & { projectId: string })[] = [];
    filteredDashProjects.forEach(proj => {
      if (Array.isArray(proj.tasks)) {
        proj.tasks.forEach(task => {
          let keep = true;
          if (filterDashYear !== 'ALL') {
            const startYear = task.startDate ? new Date(task.startDate).getFullYear().toString() : '9999';
            const endYear = task.endDate ? new Date(task.endDate).getFullYear().toString() : '0000';
            if (!(startYear <= filterDashYear && endYear >= filterDashYear)) keep = false;

            if (keep && filterDashQuarter !== 'FULL') {
              let qOverlap = 0;
              if (filterDashQuarter === 'T1') qOverlap = getQuarterOverlapDays(task.startDate, task.endDate, filterDashYear, 0);
              else if (filterDashQuarter === 'T2') qOverlap = getQuarterOverlapDays(task.startDate, task.endDate, filterDashYear, 1);
              else if (filterDashQuarter === 'T3') qOverlap = getQuarterOverlapDays(task.startDate, task.endDate, filterDashYear, 2);
              else if (filterDashQuarter === 'T4') qOverlap = getQuarterOverlapDays(task.startDate, task.endDate, filterDashYear, 3);
              if (qOverlap <= 0) keep = false;
            }
          }
          if (keep) {
            filteredDashTasks.push({...task, projectId: proj.id});
          }
        });
      }
    });

    const today = new Date();
    let totalVP = 0; let totalVA = 0; let totalCR = 0;
    let completedCount = 0; let blockedCount = 0; let inProgressCount = 0; let todoCount = 0;
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
      const va = t.valeurAcquise !== undefined ? Number(t.valeurAcquise) : ((t.status === 'Terminé' || t.valideVA) ? vp : 0);
      const decaisse = t.montantDecaissementReel !== undefined && t.montantDecaissementReel !== '' ? Number(t.montantDecaissementReel) : cr;

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
      if (!isNaN(sDateMs)) { if (minStartCPM === null || sDateMs < minStartCPM) minStartCPM = sDateMs; }
      if (!isNaN(eDateMs)) { if (maxEndCPM === null || eDateMs > maxEndCPM) maxEndCPM = eDateMs; }

      let isDelayedByDate = false;
      let isDelayedByAmount = false;

      const expectedAmount = (t.montantDecaissementPrevu !== undefined && t.montantDecaissementPrevu !== '') ? Number(t.montantDecaissementPrevu) : vp;
      const hasPassedPrevu = t.dateDecaissementPrevu ? (new Date(t.dateDecaissementPrevu) <= today) : (new Date(t.endDate) <= today);

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
    const cpmDays = (minStartCPM !== null && maxEndCPM !== null) ? Math.max(1, Math.ceil((maxEndCPM - minStartCPM) / (1000 * 60 * 60 * 24)) + 1) : 0;

    const dashStatsTotal = filteredDashTasks.length;
    const dashGlobalProgress = dashStatsTotal > 0 ? Math.round(taskCompletionSum / dashStatsTotal) : 0;
    
    const dashPieData = [
      { name: 'Terminé', value: completedCount }, 
      { name: 'En cours', value: inProgressCount },
      { name: 'Bloqué', value: blockedCount }, 
      { name: 'À faire', value: todoCount },
    ];

    const hasFinancialData = totalVP > 0 || totalCR > 0 || totalVA > 0;

    const EC = totalVA - totalCR;
    const ED = totalVA - totalVP;
    const IPC = hasFinancialData ? (totalCR > 0 ? (totalVA / totalCR).toFixed(2) : (totalVA > 0 ? 'Max' : '1.00')) : '-';
    const IPD = hasFinancialData ? (totalVP > 0 ? (totalVA / totalVP).toFixed(2) : (totalVA > 0 ? 'Max' : '1.00')) : '-';

    let ecStatus;
    if (!hasFinancialData) ecStatus = { label: "N/A", desc: "En attente de budgétisation.", color: "text-slate-400", bg: "bg-slate-100", tooltip: "Aucune donnée financière n'est disponible." };
    else if (EC > 0) ecStatus = { label: "Favorable", desc: "Sous le budget, le projet coûte moins que prévu.", color: "text-emerald-600", bg: "bg-emerald-50", tooltip: "EC (Écart Coût) = VA - CR" };
    else if (EC < 0) ecStatus = { label: "Défavorable", desc: "Dépassement budgétaire, le projet coûte plus que prévu.", color: "text-red-600", bg: "bg-red-50", tooltip: "EC (Écart Coût) = VA - CR" };
    else ecStatus = { label: "Conforme", desc: "Le projet respecte strictement le budget.", color: "text-blue-600", bg: "bg-blue-50", tooltip: "EC (Écart Coût) = VA - CR" };

    let edStatus;
    if (!hasFinancialData) edStatus = { label: "N/A", desc: "En attente de budgétisation.", color: "text-slate-400", bg: "bg-slate-100", tooltip: "Aucune donnée financière n'est disponible." };
    else if (ED > 0) edStatus = { label: "Favorable", desc: "Avance sur le planning.", color: "text-emerald-600", bg: "bg-emerald-50", tooltip: "ED (Écart Délai) = VA - VP" };
    else if (ED < 0) edStatus = { label: "Défavorable", desc: "Retard par rapport au planning.", color: "text-red-600", bg: "bg-red-50", tooltip: "ED (Écart Délai) = VA - VP" };
    else edStatus = { label: "Conforme", desc: "Le projet est en ligne avec le planning.", color: "text-blue-600", bg: "bg-blue-50", tooltip: "ED (Écart Délai) = VA - VP" };

    const ipcNum = parseFloat(IPC);
    let ipcStatus;
    if (!hasFinancialData) ipcStatus = { label: "N/A", desc: "En attente.", color: "text-slate-400", tooltip: "" };
    else if (isNaN(ipcNum) || ipcNum === 1) ipcStatus = { label: "Conforme", desc: "Le projet est exactement sur le budget.", color: "text-blue-600", tooltip: "IPC (Indice de Performance Coût) = VA / CR" };
    else if (ipcNum > 1) ipcStatus = { label: "Favorable", desc: "Efficacité élevée, sous le budget.", color: "text-emerald-600", tooltip: "IPC (Indice de Performance Coût) = VA / CR" };
    else ipcStatus = { label: "Défavorable", desc: "Inefficacité, dépassement de coûts.", color: "text-red-600", tooltip: "IPC (Indice de Performance Coût) = VA / CR" };

    const ipdNum = parseFloat(IPD);
    let ipdStatus;
    if (!hasFinancialData) ipdStatus = { label: "N/A", desc: "En attente.", color: "text-slate-400", tooltip: "" };
    else if (isNaN(ipdNum) || ipdNum === 1) ipdStatus = { label: "Conforme", desc: "Le projet respecte le planning.", color: "text-blue-600", tooltip: "IPD (Indice de Performance Délai) = VA / VP" };
    else if (ipdNum > 1) ipdStatus = { label: "Favorable", desc: "Le projet progresse plus vite que prévu.", color: "text-emerald-600", tooltip: "IPD (Indice de Performance Délai) = VA / VP" };
    else ipdStatus = { label: "Défavorable", desc: "Le projet progresse moins vite que prévu, retard.", color: "text-red-600", tooltip: "IPD (Indice de Performance Délai) = VA / VP" };

    const ecartDecaissement = totalDecaisse - totalDecaissementPrevuADate;
    const tauxRespectDecaissement = totalDecaissementPrevuADate > 0 ? Math.round((totalDecaisse / totalDecaissementPrevuADate) * 100) : (totalDecaisse > 0 ? 100 : 0);

    const timeSeries: Record<string, { month: string; vp: number; va: number; cr: number; decPrevu: number; decReel: number }> = {};
    
    filteredDashTasks.forEach(t => {
      const s = t.startDate ? new Date(t.startDate) : today;
      const e = t.endDate ? new Date(t.endDate) : today;
      const safeE = new Date(Math.max(s.getTime(), e.getTime()));
      
      const vp = Number(t.coutPlanifie) || 0;
      const cr = Number(t.coutReel) || 0;
      const va = t.valeurAcquise !== undefined ? Number(t.valeurAcquise) : ((t.status === 'Terminé' || t.valideVA) ? vp : 0);

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

      const durationActual = Math.max(1, Math.floor((safeActualEnd.getTime() - s.getTime()) / 86400000) + 1);
      const crPerDay = cr / durationActual;
      
      const totalEstimatedVA = t.valeurAcquise !== undefined ? Number(t.valeurAcquise) : (isDone ? vp : (vp * Math.min(1, durationActual / durationVP))); 
      const vaPerDay = totalEstimatedVA / durationActual;

      for(const d = new Date(s); d <= safeE; d.setDate(d.getDate() + 1)) {
         const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
         if(!timeSeries[m]) timeSeries[m] = { month: m, vp: 0, va: 0, cr: 0, decPrevu: 0, decReel: 0 };
         timeSeries[m].vp += vpPerDay;
      }

      if (logicalStatus !== 'À faire') {
          for(const d = new Date(s); d <= safeActualEnd; d.setDate(d.getDate() + 1)) {
             const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
             if(!timeSeries[m]) timeSeries[m] = { month: m, vp: 0, va: 0, cr: 0, decPrevu: 0, decReel: 0 };
             timeSeries[m].cr += crPerDay;
             timeSeries[m].va += vaPerDay;
          }
      }

      if (t.dateDecaissementPrevu) {
          const dp = new Date(t.dateDecaissementPrevu);
          if (!isNaN(dp.getTime())) {
              const m = `${dp.getFullYear()}-${String(dp.getMonth()+1).padStart(2,'0')}`;
              if(!timeSeries[m]) timeSeries[m] = { month: m, vp: 0, va: 0, cr: 0, decPrevu: 0, decReel: 0 };
              const prevuAmount = (t.montantDecaissementPrevu !== undefined && t.montantDecaissementPrevu !== '') ? Number(t.montantDecaissementPrevu) : vp;
              timeSeries[m].decPrevu += prevuAmount;
          }
      }

      if (t.dateDecaissementReel) {
          const dr = new Date(t.dateDecaissementReel);
          if (!isNaN(dr.getTime())) {
              const m = `${dr.getFullYear()}-${String(dr.getMonth()+1).padStart(2,'0')}`;
              if(!timeSeries[m]) timeSeries[m] = { month: m, vp: 0, va: 0, cr: 0, decPrevu: 0, decReel: 0 };
              const decaisse = t.montantDecaissementReel !== undefined && t.montantDecaissementReel !== '' ? Number(t.montantDecaissementReel) : cr;
              timeSeries[m].decReel += decaisse; 
          }
      }
    });

    const sortedMonths = Object.keys(timeSeries).sort();
    let cVP = 0, cVA = 0, cCR = 0;
    const sCurveData = sortedMonths.map(m => {
        cVP += timeSeries[m].vp;
        cVA += timeSeries[m].va;
        cCR += timeSeries[m].cr;
        const dateObj = new Date(m + '-01');
        return {
           label: dateObj.toLocaleDateString('fr-FR', {month: 'short', year: '2-digit'}),
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
    const targetPieYear = filterDashYear !== 'ALL' ? filterDashYear : (defaultYear || 'ALL');
    
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
                                const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24) + 1);
                                const taskBYear = vp * (dYear / totalDays);
                                
                                if (taskBYear > 0) {
                                   ptba2025Data.push({ name: t.name, value: Math.round(taskBYear), fullName: t.name });
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

    return (
      <div className="space-y-4 animate-in fade-in pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 border-slate-200 gap-2">
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center">
            <LayoutDashboard className="w-5 h-5 mr-2 text-blue-600" /> Cockpit EVM (Earned Value Management)
          </h2>
          {data.length === 0 && (
            <button 
              onClick={handleLoadDemoData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-300" />
              Charger données démo
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> 1. Année Budgétaire
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterDashYear}
                onChange={(e) => {
                  setFilterDashYear(e.target.value);
                  if (e.target.value === 'ALL') setFilterDashQuarter('FULL');
                }}
              >
                <option value="ALL">Période Globale</option>
                <option value="2024">Exercice 2024</option>
                <option value="2025">Exercice 2025</option>
                <option value="2026">Exercice 2026</option>
                <option value="2027">Exercice 2027</option>
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 2. Filtrer par Programme
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterDashDossier}
                onChange={(e) => { 
                  setFilterDashDossier(e.target.value); 
                  setFilterDashAxe('FULL');
                  setFilterDashProj('FULL');
                }}
              >
                <option value="FULL">Tous les programmes</option>
                {data.map(dossier => (
                  <option key={dossier.id} value={dossier.id}>{dossier.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 3. Composante
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterDashAxe}
                onChange={(e) => { 
                  setFilterDashAxe(e.target.value); 
                  setFilterDashProj('FULL');
                }}
              >
                <option value="FULL">Toutes les composantes</option>
                {data.filter(d => filterDashDossier === 'FULL' || d.id === filterDashDossier).map(dossier => dossier.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                )))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <FolderTree className="w-3 h-3 mr-1" /> 4. Projet
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterDashProj}
                onChange={(e) => setFilterDashProj(e.target.value)}
              >
                <option value="FULL">Tous les projets</option>
                {allProjects
                  .filter(p => filterDashDossier === 'FULL' || p.dossierId === filterDashDossier)
                  .filter(p => filterDashAxe === 'FULL' || p.axeId === filterDashAxe)
                  .map((proj, index) => (
                    <option key={proj.id} value={proj.id} className="truncate">{index + 1}. {proj.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* CARTES DE KPIS EVM */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Avancement</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{dashGlobalProgress}%</p>
                <p className="text-[10px] text-slate-400">{dashStatsTotal} Tâches au total</p>
              </div>
              <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0">
                  <circle cx="22" cy="22" r="19" stroke="#f8fafc" strokeWidth="3" fill="none" />
                  <circle 
                    cx="22" cy="22" r="19" stroke="#22c55e" strokeWidth="3" fill="none" 
                    strokeDasharray="119.4" strokeDashoffset={119.4 * (1 - dashGlobalProgress / 100)} 
                    strokeLinecap="round" className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="text-[10px] font-bold text-green-600 relative z-10">{dashGlobalProgress}%</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-end">
              <div>
                <p className="text-[9px] text-slate-400 uppercase">Budget Total</p>
                <p className="text-sm font-black text-slate-700">{fmtBudget(totalVP)} M</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 uppercase" title="Critical Path Method (Durée du chemin critique)">CPM</p>
                <p className="text-sm font-black text-slate-700">{cpmDays} Jours</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between" title={ecStatus.tooltip}>
            <p className="text-xs font-bold text-slate-500 uppercase flex justify-between">
              Valeur Acquise (VA) <span className="text-green-600">{fmtBudget(totalVA)} M</span>
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Écart de Coût (EC)</p>
                <p className={`text-lg font-black ${ecStatus.color}`}>{!hasFinancialData ? '-' : `${EC > 0 ? '+' : ''}${fmtBudget(EC)} M`}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ecStatus.bg} ${ecStatus.color}`}>{ecStatus.label}</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1.5 leading-tight italic">{ecStatus.desc}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between" title={edStatus.tooltip}>
            <p className="text-xs font-bold text-slate-500 uppercase flex justify-between">
              Valeur Prévue (VP) <span className={hasFinancialData ? "text-blue-600" : "text-slate-400"}>{fmtBudget(totalVP)} M</span>
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Écart de Délai (ED)</p>
                <p className={`text-lg font-black ${edStatus.color}`}>{!hasFinancialData ? '-' : `${ED > 0 ? '+' : ''}${fmtBudget(ED)} M`}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${edStatus.bg} ${edStatus.color}`}>{edStatus.label}</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1.5 leading-tight italic">{edStatus.desc}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Coût Réel (CR)</p>
            <p className={`text-2xl font-black ${hasFinancialData ? "text-orange-600" : "text-slate-400"}`}>{fmtBudget(totalCR)} M</p>
            <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${totalVP > 0 ? Math.min(100, (totalCR/totalVP)*100) : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Indices de Performance</p>
            <div className="mb-2" title={ipcStatus.tooltip}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs font-medium text-slate-600">IPC (Coûts)</span>
                <span className={`text-sm font-bold ${ipcStatus.color}`}>{IPC}</span>
              </div>
              <p className={`text-[8px] leading-tight italic ${ipcStatus.color} opacity-80`}>{ipcStatus.label}: {ipcStatus.desc}</p>
            </div>
            <div className="pt-2 border-t border-slate-100" title={ipdStatus.tooltip}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs font-medium text-slate-600">IPD (Délais)</span>
                <span className={`text-sm font-bold ${ipdStatus.color}`}>{IPD}</span>
              </div>
              <p className={`text-[8px] leading-tight italic ${ipdStatus.color} opacity-80`}>{ipdStatus.label}: {ipdStatus.desc}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Suivi Décaissements</p>
            <div className="mb-2" title="Écart financier et retard total cumulé en jours">
              <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-slate-600">Écart Planning</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${!hasFinancialData ? 'bg-slate-100 text-slate-400 border border-slate-200' : (sumDecaissementDelay > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100')}`} title="Retard total cumulé de décaissement">
                    <Clock className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
                    {!hasFinancialData ? 'N/A' : (sumDecaissementDelay > 0 ? `${sumDecaissementDelay} j de retard` : 'À jour')}
                  </span>
                </div>
                <span className={`text-sm font-bold ${!hasFinancialData ? 'text-slate-400' : (ecartDecaissement >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                  {!hasFinancialData ? '-' : `${ecartDecaissement > 0 ? '+' : ''}${fmtBudget(ecartDecaissement)} M`}
                </span>
              </div>
              <p className={`text-[8px] leading-tight italic ${!hasFinancialData ? 'text-slate-400' : (ecartDecaissement >= 0 ? 'text-green-600' : 'text-red-600')} opacity-80`}>
                {!hasFinancialData ? 'En attente' : (ecartDecaissement >= 0 ? 'Décaissements à jour' : 'Retard de décaissement')}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100" title="Ratio des montants décaissés par rapport aux prévisions à date">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs font-medium text-slate-600">Taux Respect</span>
                <span className={`text-sm font-bold ${tauxRespectDecaissement >= 100 ? 'text-green-600' : 'text-red-600'}`}>{tauxRespectDecaissement}%</span>
              </div>
              <p className={`text-[8px] leading-tight italic ${tauxRespectDecaissement >= 100 ? 'text-green-600' : 'text-red-600'} opacity-80`}>{tauxRespectDecaissement >= 100 ? 'Planning respecté' : 'Planning non respecté'}</p>
            </div>
          </div>
        </div>

        {/* BANDEAU STATUTS TÂCHES */}
        <div className="flex flex-wrap lg:flex-nowrap gap-3 md:gap-4">
          <div className="flex-1 min-w-[100px] bg-white rounded-2xl shadow-sm border border-slate-100 p-4 border-l-[6px] border-l-blue-500 flex flex-col justify-center min-h-[90px]">
            <span className="text-xs font-bold text-slate-500 mb-1 tracking-wide">Tâches</span>
            <span className="text-3xl font-black text-slate-800">{dashStatsTotal}</span>
          </div>
          <div className="flex-1 min-w-[100px] bg-white rounded-2xl shadow-sm border border-slate-100 p-4 border-l-[6px] border-l-green-500 flex flex-col justify-center min-h-[90px]">
            <span className="text-xs font-bold text-slate-500 mb-1 tracking-wide">Terminées</span>
            <span className="text-3xl font-black text-slate-800">{completedCount}</span>
          </div>
          <div className="flex-1 min-w-[100px] bg-white rounded-2xl shadow-sm border border-slate-100 p-4 border-l-[6px] border-l-yellow-500 flex flex-col justify-center min-h-[90px]">
            <span className="text-xs font-bold text-slate-500 mb-1 tracking-wide">En Cours</span>
            <span className="text-3xl font-black text-slate-800">{inProgressCount}</span>
          </div>
          <div className="flex-1 min-w-[100px] bg-white rounded-2xl shadow-sm border border-slate-100 p-4 border-l-[6px] border-l-red-500 flex flex-col justify-center min-h-[90px]">
            <span className="text-xs font-bold text-slate-500 mb-1 tracking-wide">Bloqués</span>
            <span className="text-3xl font-black text-slate-800">{blockedCount}</span>
          </div>
          <div className="flex-[1.8] min-w-[220px] bg-white rounded-2xl shadow-sm border border-slate-100 p-4 border-l-[6px] border-l-purple-500 flex flex-col justify-between min-h-[90px]">
            <div className="flex justify-between items-start mb-2" title="Nombre de tâches impactées négativement par le délai ou le montant de décaissement">
              <span className="text-xs font-bold text-slate-500 flex items-center tracking-wide"><Clock className="w-4 h-4 mr-1.5 text-purple-400"/> Retard Décaissement</span>
              <span className="text-3xl font-black text-purple-600 leading-none">{delayedDisbursementCount}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-2 text-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Impactées par délai</span>
                <span className="text-[11px] font-black text-[#f43f5e]">{delayedByDateCount > 0 ? delayedByDateCount : '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Impactées par montant</span>
                <span className="text-[11px] font-black text-[#f43f5e]">{delayedByAmountCount > 0 ? delayedByAmountCount : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRAPHIQUE 1 : ÉVOLUTION PÉRIODIQUE */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-4">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Évolution Périodique (EVM & Décaissements)</h3>
          <div className="h-64">
            {sCurveData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
                  <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="vpMensuel" name="Valeur Planifiée (VP)" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="vaMensuel" name="Valeur Acquise (VA)" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="crMensuel" name="Coût Réel (CR)" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="decPrevuMensuel" name="Décaissement Prévu" fill="#a855f7" radius={[2, 2, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="decReelMensuel" name="Décaissement Réel" fill="#14b8a6" radius={[2, 2, 0, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-lg">Données temporelles insuffisantes ou dossier vide</div>
            )}
          </div>
        </div>

        {/* GRAPHIQUE 2 : COURBE EN S (CUMUL EVM) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Analyse de la Valeur Acquise (Courbe en S)</h3>
          <div className="h-80">
            {sCurveData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="cumulVP" name="Valeur Planifiée (VP)" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="cumulVA" name="Valeur Acquise (VA)" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="cumulCR" name="Coût Réel (CR)" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-lg">Données temporelles insuffisantes ou dossier vide</div>
            )}
          </div>
        </div>

        {/* GRAPHIQUES 3 & 4 : RÉPARTITION PTBA ET STATUTS TÂCHES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Répartition PTBA (Budget Programmé {targetPieYear === 'ALL' ? 'Global' : targetPieYear})</h3>
            <div className="h-64">
              {ptba2025Data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ptba2025Data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {ptba2025Data.map((_, index) => <Cell key={`cell-${index}`} fill={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(v: any) => `${fmtBudget(v)} M`} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (<div className="h-full flex items-center justify-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-lg">Aucun budget programmé pour cette sélection</div>)}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Statut d'exécution des Tâches</h3>
            <div className="h-64">
              {dashStatsTotal > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashPieData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {dashPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9CA3AF'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-lg">Aucune tâche enregistrée dans ce dossier</div>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderProjectManager = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 border-emerald-200 shrink-0 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Folder className="w-6 h-6 mr-2 text-emerald-600" /> 
            Programmes Stratégiques
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Structurez vos portefeuilles, composantes et projets institutionnels</p>
        </div>
        <div className="flex items-center space-x-2">
          {data.length === 0 && (
            <button 
              onClick={handleLoadDemoData} 
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600" /> Charger exemple
            </button>
          )}
          <button 
            onClick={addDossier} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau Programme
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {data.length === 0 && (
          <div className="text-center bg-white border-2 border-dashed border-gray-300 rounded-2xl py-14 px-6 shadow-sm">
            <FolderTree className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">Aucun programme enregistré</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              Créez votre premier programme institutionnel ou chargez un exemple modèle complet pour démarrer.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={addDossier} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Créer un Programme
              </button>
              <button 
                onClick={handleLoadDemoData} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2 text-yellow-600" /> Charger l'exemple Démo
              </button>
            </div>
          </div>
        )}

        {data.map(dossier => (
          <div key={dossier.id} className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
            
            <div className="px-5 py-4 flex flex-col lg:flex-row lg:justify-between lg:items-end text-white gap-4 transition-colors bg-emerald-600">
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row gap-4 w-full items-end">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1.5 block">Nom du Programme</label>
                    <div className="flex items-center w-full">
                      <FolderTree className="w-6 h-6 mr-3 text-emerald-100 shrink-0" />
                      <input 
                        className="bg-transparent border-b border-emerald-400 focus:border-white outline-none w-full placeholder-emerald-200 text-white font-bold text-lg pb-1" 
                        value={dossier.name} 
                        onChange={(e) => updateDossierItemName(dossier.id, null, null, e.target.value)} 
                        placeholder="Saisissez le nom du programme..."
                        autoFocus={!dossier.isReadOnly}
                      />
                    </div>
                  </div>
                  <div className="flex-1 w-full sm:w-1/3">
                    <label className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1.5 block">Institution Rattachée</label>
                    <div className="flex items-center w-full">
                      <Building2 className="w-5 h-5 mr-2 text-emerald-100 shrink-0" />
                      <input 
                        className="bg-transparent border-b border-emerald-400 focus:border-white outline-none w-full placeholder-emerald-200 text-white font-bold text-sm pb-1" 
                        value={dossier.institution || ''} 
                        onChange={(e) => updateDossierInstitution(dossier.id, e.target.value)} 
                        placeholder="Ex: Ministère, ONG, Entreprise..."
                      />
                    </div>
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1.5 block">Année (Début)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white text-emerald-900 border-none outline-none rounded p-1.5 font-bold text-sm text-center shadow-inner focus:ring-2 focus:ring-emerald-300" 
                      value={dossier.startYear || ''} 
                      onChange={(e) => updateDossierYear(dossier.id, e.target.value)} 
                      placeholder="Ex: 2025"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1.5 block">Année (Fin)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white text-emerald-900 border-none outline-none rounded p-1.5 font-bold text-sm text-center shadow-inner focus:ring-2 focus:ring-emerald-300" 
                      value={dossier.endYear || (dossier.startYear ? Number(dossier.startYear) + 2 : '')} 
                      onChange={(e) => updateDossierEndYear(dossier.id, e.target.value)} 
                      placeholder="Ex: 2027"
                    />
                  </div>
                  <div className="w-28 shrink-0">
                    <label className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1.5 text-center block">Durée Globale</label>
                    <div className="w-full bg-emerald-700/50 border border-emerald-500 rounded p-1.5 text-emerald-100 font-bold text-sm text-center shadow-inner">
                      {dossier.startYear ? `${dossier.startYear}-${dossier.endYear || Number(dossier.startYear) + 2}` : '-'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 shrink-0 mt-2 lg:mt-0">
                <button 
                  onClick={() => {
                    setFilterPTBADossier(dossier.id);
                    setFilterPTBAAxe('FULL');
                    setFilterPTBAProj('FULL');
                    setFilterPTBAYear('ALL');
                    setFilterPTBAQuarter('FULL');

                    setFilterProcessusDossier(dossier.id);
                    setFilterProcessusAxe('FULL');
                    setFilterProcessusProj('FULL');
                    setFilterProcessusYear('ALL');
                    setFilterProcessusQuarter('FULL');

                    setFilterDashDossier(dossier.id);
                    setFilterDashAxe('FULL');
                    setFilterDashProj('FULL');
                    setFilterDashYear('ALL');
                    setFilterDashQuarter('FULL');

                    setActiveTab('processus');
                  }} 
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition-colors" 
                  title="Ouvrir les tableaux de suivi pour ce programme"
                >
                  <Activity className="w-4 h-4 mr-1.5" /> Suivi EVM
                </button>

                <button onClick={() => addAxe(dossier.id)} className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition-colors ml-2">
                  <Plus className="w-4 h-4 mr-1" /> Composante
                </button>
                <button onClick={() => deleteDossier(dossier.id)} className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors shadow-sm" title="Supprimer ce programme">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {(!dossier.axes || dossier.axes.length === 0) && (
                <div className="text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-8">
                  <p className="text-slate-500 text-sm mb-4 font-medium">Ce programme est vide. Créez une composante stratégique pour commencer.</p>
                  <button onClick={() => addAxe(dossier.id)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm inline-flex items-center">
                    <Plus className="w-4 h-4 mr-2" /> Créer une Composante
                  </button>
                </div>
              )}
              {dossier.axes && dossier.axes.map(axe => {
                const computedAxeBudget = (axe.projects || []).reduce((acc, proj) => acc + getProjectTotalBudget(proj, dossier.isReadOnly), 0);

                return (
                <div key={axe.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 group/axe relative">
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-3 mb-4 gap-3">
                    <div className="flex items-center flex-1 max-w-xl">
                      <Target className="w-5 h-5 mr-2 text-emerald-600 shrink-0" />
                      <div className="flex items-center w-full">
                        <input 
                          className="font-bold text-slate-800 text-base bg-white border border-dashed border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none w-full px-2 py-1 rounded" 
                          value={axe.name} 
                          onChange={(e) => updateDossierItemName(dossier.id, axe.id, null, e.target.value)} 
                          placeholder="Nom de la composante..."
                          readOnly={dossier.isReadOnly}
                        />
                        {!dossier.isReadOnly && (
                          <button onClick={() => deleteAxe(dossier.id, axe.id)} className="ml-2 text-slate-400 hover:text-red-500 p-1.5 bg-white rounded shadow-sm opacity-0 group-hover/axe:opacity-100 transition-opacity" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm bg-white border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                        <input 
                          type="number" 
                          className="w-24 outline-none bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-right mr-2 text-slate-500 cursor-not-allowed font-semibold" 
                          value={computedAxeBudget} 
                          readOnly
                          title="Calculé automatiquement depuis les tâches"
                        />
                        <span>M / Monnaie</span>
                      </div>
                      <button onClick={() => addProject(dossier.id, axe.id)} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center shrink-0 shadow-sm">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Projet
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(!axe.projects || axe.projects.length === 0) && (
                      <div className="col-span-full flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-xl py-6">
                        <p className="text-slate-400 text-sm italic mb-3">Aucun projet n'a encore été ajouté.</p>
                        <button 
                          onClick={() => addProject(dossier.id, axe.id)} 
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center shadow-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Créer le premier projet
                        </button>
                      </div>
                    )}
                    {axe.projects && axe.projects.map(proj => {
                      const projBudget = getProjectTotalBudget(proj, dossier.isReadOnly);
                      
                      return (
                        <div key={proj.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative group">
                          <button 
                            onClick={() => deleteProject(dossier.id, axe.id, proj.id)} 
                            className="absolute top-2 right-2 text-slate-300 hover:text-white hover:bg-red-500 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                            title="Supprimer ce projet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="mb-4 pr-6">
                            <div className="flex items-start mb-2">
                              <Edit3 className="w-3 h-3 text-emerald-500 mr-1.5 mt-1 shrink-0" />
                              <textarea 
                                className={`font-bold text-slate-700 text-sm bg-slate-50 border border-slate-200 outline-none w-full resize-none focus:ring-1 focus:ring-emerald-400 focus:bg-white rounded p-1.5 ${dossier.isReadOnly ? 'cursor-default' : ''}`} 
                                rows={2}
                                value={proj.name} 
                                onChange={(e) => updateDossierItemName(dossier.id, axe.id, proj.id, e.target.value)} 
                                placeholder="Nom du projet..."
                                readOnly={dossier.isReadOnly}
                              />
                            </div>
                            <div className="text-xs text-slate-500 flex items-center mt-2 bg-slate-50 px-2 py-1.5 rounded border border-slate-100 w-max mb-3">
                              <DollarSign className="w-3.5 h-3.5 mr-1 text-green-500" />
                              Budget projet : <strong className="ml-1 text-slate-700">{projBudget} M</strong>
                            </div>

                            <div className="bg-slate-100/60 rounded-lg p-2.5 border border-slate-200">
                              <div className="font-bold text-slate-500 mb-2 flex items-center text-[9px] uppercase tracking-wider">
                                <Calendar className="w-3 h-3 mr-1 text-blue-500" /> Répartition par Tâches
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {['2025', '2026', '2027'].map(year => (
                                  <div key={year} className="bg-white rounded border border-slate-200 p-1.5 flex flex-col items-center shadow-sm">
                                    <span className="text-[9px] font-bold text-slate-400 mb-0.5">{year}</span>
                                    {dossier.isReadOnly ? (
                                      <span className={`font-bold text-xs ${proj.budgetsAnnuels && proj.budgetsAnnuels[year] ? 'text-slate-800' : 'text-slate-300'}`}>
                                        {(proj.budgetsAnnuels && proj.budgetsAnnuels[year] !== null && proj.budgetsAnnuels[year] !== '') ? `${proj.budgetsAnnuels[year]} M` : '-'}
                                      </span>
                                    ) : (
                                      <span className="font-bold text-[10px] text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded w-full text-center">
                                        {fmtBudget(getProjectAnnualBudget(proj, year, false))} M
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => { 
                              setFilterProcessusDossier(dossier.id);
                              setFilterProcessusAxe(axe.id); 
                              setFilterProcessusProj(proj.id); 
                              setFilterProcessusYear('ALL');
                              setFilterProcessusQuarter('FULL');

                              setFilterPTBADossier(dossier.id);
                              setFilterPTBAAxe(axe.id);
                              setFilterPTBAProj(proj.id);
                              setFilterPTBAYear('ALL');
                              setFilterPTBAQuarter('FULL');

                              setFilterDashDossier(dossier.id);
                              setFilterDashAxe(axe.id);
                              setFilterDashProj(proj.id);
                              setFilterDashYear('ALL');
                              setFilterDashQuarter('FULL');

                              setActiveTab('processus'); 
                            }}
                            className="w-full text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-2 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm"
                          >
                            <Activity className="w-3.5 h-3.5 mr-1.5" /> Suivi & Tableau PTBA
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );})}
            </div>

          </div>
        ))}
      </div>
    </div>
  );

  const renderPTBA = () => {
    let allAxes: (Axe & { isReadOnly?: boolean })[] = [];
    data.forEach(d => { 
      if (filterPTBADossier === 'FULL' || d.id === filterPTBADossier) {
        if (d.axes) d.axes.forEach(a => allAxes.push({...a, isReadOnly: d.isReadOnly}));
      }
    });

    if (filterPTBAAxe !== 'FULL') {
      allAxes = allAxes.filter(a => a.id === filterPTBAAxe);
    }

    const isAllYears = filterPTBAYear === 'ALL';
    let globalTotalVP = 0; let globalTotalYear = 0;
    let globalTotalQ1 = 0, globalTotalQ2 = 0, globalTotalQ3 = 0, globalTotalQ4 = 0;
    let globalTotalY25 = 0, globalTotalY26 = 0, globalTotalY27 = 0;

    return (
      <div className="animate-in fade-in duration-500 pb-10 flex flex-col h-full">
        <div className="flex justify-between items-center border-b pb-2 border-emerald-200 shrink-0 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FileSpreadsheet className="w-6 h-6 mr-2 text-emerald-600" /> 
              PTBA - {isAllYears ? 'Période Globale' : `Exercice ${filterPTBAYear}`}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Plan de Travail et Budget Annuel - Ventilation trimestrielle et pluriannuelle</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 shrink-0">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> 1. Année d'Exercice
            </label>
            <div className="relative">
              <select className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg p-2.5 pr-8 outline-none cursor-pointer"
                value={filterPTBAYear} onChange={(e) => { setFilterPTBAYear(e.target.value); if (e.target.value === 'ALL') setFilterPTBAQuarter('FULL'); }}>
                <option value="ALL">Période Globale</option>
                <option value="2024">Année 2024</option><option value="2025">Année 2025</option><option value="2026">Année 2026</option><option value="2027">Année 2027</option>
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 2. Composante
            </label>
            <div className="relative">
              <select className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg p-2.5 pr-8 outline-none cursor-pointer"
                value={filterPTBAAxe} onChange={(e) => { setFilterPTBAAxe(e.target.value); setFilterPTBAProj('FULL'); }}>
                <option value="FULL">Toutes les composantes</option>
                {data.filter(d => filterPTBADossier === 'FULL' || d.id === filterPTBADossier).map(dossier => dossier.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                )))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <FolderTree className="w-3 h-3 mr-1" /> 3. Projet
            </label>
            <div className="relative">
              <select className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg p-2.5 pr-8 outline-none cursor-pointer"
                value={filterPTBAProj} onChange={(e) => setFilterPTBAProj(e.target.value)}>
                <option value="FULL">Tous les projets</option>
                {ptbaAvailableProjects.map((proj, index) => (
                  <option key={proj.id} value={proj.id} className="truncate">{index + 1}. {proj.name.substring(0, 50)}...</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Activity className="w-3 h-3 mr-1" /> 4. Trimestre
            </label>
            <div className="relative">
              <select className={`w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg p-2.5 pr-8 outline-none cursor-pointer ${isAllYears ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={filterPTBAQuarter} onChange={(e) => setFilterPTBAQuarter(e.target.value)} disabled={isAllYears}>
                <option value="FULL">Année entière</option>
                <option value="T1">Trimestre 1 (Jan-Mar)</option><option value="T2">Trimestre 2 (Avr-Juin)</option>
                <option value="T3">Trimestre 3 (Juil-Sep)</option><option value="T4">Trimestre 4 (Oct-Déc)</option>
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden mb-6 flex-1">
          <div className="overflow-x-auto relative max-h-[600px] hide-scrollbar flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800 text-white text-xs shadow-md sticky top-0 z-40">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-700 border-r sticky left-0 bg-slate-800 z-50 w-[280px] min-w-[280px] max-w-[280px] whitespace-normal">Composante / Projet / Tâche</th>
                  <th className="px-4 py-3 border-b border-slate-700 border-r text-center">Période</th>
                  <th className="px-4 py-3 border-b border-slate-700 border-r text-center">Responsable / Labo / Station</th>
                  <th className="px-4 py-3 border-b border-slate-700 border-r text-center bg-emerald-900/50 text-emerald-100">Budget (VP)</th>
                  {isAllYears ? (
                    <>
                      <th className="px-4 py-3 border-b border-slate-700 text-center border-r">Année 2025</th>
                      <th className="px-4 py-3 border-b border-slate-700 text-center border-r">Année 2026</th>
                      <th className="px-4 py-3 border-b border-slate-700 text-center">Année 2027</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 border-b border-slate-700 border-r text-center bg-blue-900/50 text-blue-100">Prog. {filterPTBAYear}</th>
                      <th className="px-4 py-3 border-b border-slate-700 text-center border-r">T1</th>
                      <th className="px-4 py-3 border-b border-slate-700 text-center border-r">T2</th>
                      <th className="px-4 py-3 border-b border-slate-700 text-center border-r">T3</th>
                      <th className="px-4 py-3 border-b border-slate-700 text-center">T4</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {allAxes.length === 0 && (
                  <tr>
                    <td colSpan={isAllYears ? 7 : 9} className="text-center py-10 text-gray-400 italic">
                      Aucun programme ou composante à afficher. Rendez-vous dans "Programmes Stratégiques" pour configurer votre projet.
                    </td>
                  </tr>
                )}
                {allAxes.map(axe => {
                  let axeProjects = axe.projects || [];
                  if (filterPTBAProj !== 'FULL') axeProjects = axeProjects.filter(p => p.id === filterPTBAProj);
                  if (axeProjects.length === 0) return null;

                  return (
                    <React.Fragment key={axe.id}>
                      <tr className="bg-slate-700">
                        <td colSpan={isAllYears ? 7 : 9} className="px-4 py-2 font-bold text-emerald-400 text-xs uppercase tracking-widest sticky left-0 z-30">
                          {axe.name}
                        </td>
                      </tr>
                      {axeProjects.map(proj => {
                        const sortedProjTasks = [...(proj.tasks || [])].sort((a, b) => {
                          const phaseA = a.phase ? STANDARD_PHASES.indexOf(a.phase) : 0;
                          const phaseB = b.phase ? STANDARD_PHASES.indexOf(b.phase) : 0;
                          if (phaseA !== phaseB) return phaseA - phaseB;
                          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                        });

                        let tasksInYear = sortedProjTasks.filter(t => {
                          const startYear = t.startDate ? new Date(t.startDate).getFullYear().toString() : '9999';
                          const endYear = t.endDate ? new Date(t.endDate).getFullYear().toString() : '0000';
                          if (isAllYears) return endYear >= '2025' && startYear <= '2027';
                          return startYear <= filterPTBAYear && endYear >= filterPTBAYear;
                        });

                        if (!isAllYears && filterPTBAQuarter !== 'FULL') {
                          tasksInYear = tasksInYear.filter(t => {
                            if (filterPTBAQuarter === 'T1') return getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 0) > 0;
                            if (filterPTBAQuarter === 'T2') return getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 1) > 0;
                            if (filterPTBAQuarter === 'T3') return getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 2) > 0;
                            if (filterPTBAQuarter === 'T4') return getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 3) > 0;
                            return true;
                          });
                        }

                        if (tasksInYear.length === 0) return null;
                        
                        let projTotalVP = 0; let projYear = 0;
                        let projQ1 = 0, projQ2 = 0, projQ3 = 0, projQ4 = 0;
                        let projY25 = 0, projY26 = 0, projY27 = 0;

                        const processedTasks = tasksInYear.map(t => {
                          const vp = Number(t.coutPlanifie) || 0;
                          const taskIndexInProject = sortedProjTasks.findIndex(pt => pt.id === t.id) + 1;
                          const [sYear, sMonth, sDay] = t.startDate.split('-').map(Number);
                          const [eYear, eMonth, eDay] = t.endDate.split('-').map(Number);
                          const start = new Date(sYear, sMonth - 1, sDay).getTime();
                          const end = new Date(eYear, eMonth - 1, eDay).getTime();
                          const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24) + 1);

                          let q1B = 0, q2B = 0, q3B = 0, q4B = 0, yearB = 0;
                          let y25B = 0, y26B = 0, y27B = 0;

                          if (isAllYears) {
                            y25B = vp * (getYearOverlapDays(t.startDate, t.endDate, '2025') / totalDays);
                            y26B = vp * (getYearOverlapDays(t.startDate, t.endDate, '2026') / totalDays);
                            y27B = vp * (getYearOverlapDays(t.startDate, t.endDate, '2027') / totalDays);
                          } else {
                            q1B = (vp * (getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 0) / totalDays));
                            q2B = (vp * (getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 1) / totalDays));
                            q3B = (vp * (getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 2) / totalDays));
                            q4B = (vp * (getQuarterOverlapDays(t.startDate, t.endDate, filterPTBAYear, 3) / totalDays));
                            yearB = q1B + q2B + q3B + q4B;
                          }

                          projTotalVP += vp; projYear += yearB;
                          projQ1 += q1B; projQ2 += q2B; projQ3 += q3B; projQ4 += q4B;
                          projY25 += y25B; projY26 += y26B; projY27 += y27B;

                          return { ...t, number: taskIndexInProject, vp, yearB, q1B, q2B, q3B, q4B, y25B, y26B, y27B };
                        });

                        globalTotalVP += projTotalVP; globalTotalYear += projYear;
                        globalTotalQ1 += projQ1; globalTotalQ2 += projQ2; globalTotalQ3 += projQ3; globalTotalQ4 += projQ4;
                        globalTotalY25 += projY25; globalTotalY26 += projY26; globalTotalY27 += projY27;

                        return (
                          <React.Fragment key={proj.id}>
                            <tr className="bg-slate-200 border-b border-slate-300">
                              <td className="px-4 py-2 font-bold text-slate-800 text-sm sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[280px] min-w-[280px] max-w-[280px] whitespace-normal">
                                <div className="flex items-start">
                                  <FolderTree className="w-4 h-4 mr-2 text-slate-500 mt-0.5 shrink-0" />
                                  <span>{proj.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-center text-slate-500 font-medium">-</td>
                              <td className="px-4 py-2 text-center text-slate-500 font-medium">-</td>
                              <td className="px-4 py-2 text-center font-bold text-emerald-800 bg-emerald-100/50 border-x border-slate-300">{fmtBudget(projTotalVP)} M</td>
                              {isAllYears ? (
                                <>
                                  <td className="px-4 py-1 text-center font-bold text-slate-700 border-r border-slate-300">{fmtBudget(projY25)} M</td>
                                  <td className="px-4 py-1 text-center font-bold text-slate-700 border-r border-slate-300">{fmtBudget(projY26)} M</td>
                                  <td className="px-4 py-1 text-center font-bold text-slate-700">{fmtBudget(projY27)} M</td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-1 text-center font-bold text-blue-800 bg-blue-100/50 border-r border-slate-300">{fmtBudget(projYear)} M</td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-700 border-r border-slate-300">{fmtBudget(projQ1)} M</td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-700 border-r border-slate-300">{fmtBudget(projQ2)} M</td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-700 border-r border-slate-300">{fmtBudget(projQ3)} M</td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-700">{fmtBudget(projQ4)} M</td>
                                </>
                              )}
                            </tr>
                            
                            {processedTasks.map((t) => (
                              <tr key={t.id} className="group hover:bg-slate-50 transition-colors border-b border-gray-100 text-xs">
                                <td className="px-5 py-3 font-medium text-slate-700 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-normal w-[280px] min-w-[280px] max-w-[280px]">
                                  <div className="flex items-start">
                                    <div className={`w-10 shrink-0 flex items-center font-bold text-[10px] mt-0.5 ${t.type === 'jalon' ? 'text-orange-500' : 'text-blue-500'}`}>
                                      {t.type === 'tache' ? `T${t.number}` : `J${t.number}`}
                                      {t.type === 'jalon' && <Diamond className="w-3 h-3 fill-current ml-0.5" />}
                                    </div>
                                    <span className="leading-tight text-[11px] text-slate-800">{t.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center border-r border-gray-200 text-slate-500 font-medium whitespace-nowrap text-[10px]">
                                  {new Date(t.startDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'})} - {new Date(t.endDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit', year:'2-digit'})}
                                </td>
                                <td className="px-4 py-3 text-center border-r border-gray-200 text-slate-600 font-medium">{t.assignee}</td>
                                <td className="px-4 py-3 text-center text-emerald-700 border-r border-gray-200 bg-emerald-50/20">{t.vp > 0 ? `${t.vp} M` : '-'}</td>
                                {isAllYears ? (
                                  <>
                                    <td className={`px-2 py-3 border-r border-gray-200 text-center font-medium ${t.y25B > 0 ? 'bg-slate-50 text-slate-700' : 'text-gray-300'}`}>{t.y25B > 0 ? `${fmtBudget(t.y25B)} M` : '-'}</td>
                                    <td className={`px-2 py-3 border-r border-gray-200 text-center font-medium ${t.y26B > 0 ? 'bg-slate-50 text-slate-700' : 'text-gray-300'}`}>{t.y26B > 0 ? `${fmtBudget(t.y26B)} M` : '-'}</td>
                                    <td className={`px-2 py-3 text-center font-medium ${t.y27B > 0 ? 'bg-slate-50 text-slate-700' : 'text-gray-300'}`}>{t.y27B > 0 ? `${fmtBudget(t.y27B)} M` : '-'}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-4 py-3 text-center font-bold text-blue-700 border-r border-gray-200 bg-blue-50/20">{fmtBudget(t.yearB)} {t.yearB > 0 ? 'M' : ''}</td>
                                    <td className={`px-2 py-3 border-r border-gray-200 text-center font-medium ${t.q1B > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-gray-300'}`}>{t.q1B > 0 ? `${fmtBudget(t.q1B)} M` : '-'}</td>
                                    <td className={`px-2 py-3 border-r border-gray-200 text-center font-medium ${t.q2B > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-gray-300'}`}>{t.q2B > 0 ? `${fmtBudget(t.q2B)} M` : '-'}</td>
                                    <td className={`px-2 py-3 border-r border-gray-200 text-center font-medium ${t.q3B > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-gray-300'}`}>{t.q3B > 0 ? `${fmtBudget(t.q3B)} M` : '-'}</td>
                                    <td className={`px-2 py-3 text-center font-medium ${t.q4B > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-gray-300'}`}>{t.q4B > 0 ? `${fmtBudget(t.q4B)} M` : '-'}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-800 text-white font-bold sticky bottom-0 z-40">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right uppercase text-xs">Total Global Programmé ({isAllYears ? '2025-2027' : filterPTBAYear})</td>
                  <td className="px-4 py-3 text-center text-emerald-300 border-r border-slate-700">{fmtBudget(globalTotalVP)} M</td>
                  {isAllYears ? (
                    <>
                      <td className="px-4 py-3 text-center text-emerald-300 border-r border-slate-700">{fmtBudget(globalTotalY25)} M</td>
                      <td className="px-4 py-3 text-center text-emerald-300 border-r border-slate-700">{fmtBudget(globalTotalY26)} M</td>
                      <td className="px-4 py-3 text-center text-emerald-300">{fmtBudget(globalTotalY27)} M</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-center text-blue-300 border-r border-slate-700">{fmtBudget(globalTotalYear)} M</td>
                      <td className="px-4 py-3 text-center text-emerald-300 border-r border-slate-700">{fmtBudget(globalTotalQ1)} M</td>
                      <td className="px-4 py-3 text-center text-emerald-300 border-r border-slate-700">{fmtBudget(globalTotalQ2)} M</td>
                      <td className="px-4 py-3 text-center text-emerald-300 border-r border-slate-700">{fmtBudget(globalTotalQ3)} M</td>
                      <td className="px-4 py-3 text-center text-emerald-300">{fmtBudget(globalTotalQ4)} M</td>
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
    let filteredProjects = allProjects;
    if (filterProcessusDossier !== 'FULL') filteredProjects = filteredProjects.filter(p => p.dossierId === filterProcessusDossier);
    if (filterProcessusAxe !== 'FULL') filteredProjects = filteredProjects.filter(p => p.axeId === filterProcessusAxe);
    if (filterProcessusProj !== 'FULL') filteredProjects = filteredProjects.filter(p => p.id === filterProcessusProj);
    
    const today = new Date();

    const evmData = filteredProjects.map(proj => {
      let vp = 0; let va = 0; let cr = 0;
      if(proj.tasks) {
        proj.tasks.forEach(t => {
          let keep = true;
          if (filterProcessusYear !== 'ALL') {
            const startYear = t.startDate ? new Date(t.startDate).getFullYear().toString() : '9999';
            const endYear = t.endDate ? new Date(t.endDate).getFullYear().toString() : '0000';
            if (!(startYear <= filterProcessusYear && endYear >= filterProcessusYear)) keep = false;
            if (keep && filterProcessusQuarter !== 'FULL') {
              let qOverlap = 0;
              if (filterProcessusQuarter === 'T1') qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 0);
              else if (filterProcessusQuarter === 'T2') qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 1);
              else if (filterProcessusQuarter === 'T3') qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 2);
              else if (filterProcessusQuarter === 'T4') qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 3);
              if (qOverlap <= 0) keep = false;
            }
          }
          if (!keep) return;

          const coutPlanifie = Number(t.coutPlanifie) || 0;
          const coutReel = Number(t.coutReel) || 0;
          const valeurAcquise = t.valeurAcquise !== undefined ? Number(t.valeurAcquise) : ((t.status === 'Terminé' || t.valideVA) ? coutPlanifie : 0);

          vp += coutPlanifie; cr += coutReel; va += valeurAcquise;
        });
      }
      return { id: proj.id, name: proj.name, vp, va, cr, ec: va - cr, ed: va - vp, ipc: cr > 0 ? (va / cr).toFixed(2) : (va > 0 ? '' : '1.00'), ipd: vp > 0 ? (va / vp).toFixed(2) : (va > 0 ? '' : '1.00') };
    });
    
    const totalVP = evmData.reduce((s, p) => s + p.vp, 0);
    const totalVA = evmData.reduce((s, p) => s + p.va, 0);
    const totalCR = evmData.reduce((s, p) => s + p.cr, 0);

    const enrichedProjects = filteredProjects.map(project => {
      const groups = STANDARD_PHASES.map(phaseName => {
        const items = Array.isArray(project.tasks) ? project.tasks.filter(t => {
          if (t.phase !== phaseName) return false;
          if (filterProcessusYear !== 'ALL') {
            const startYear = t.startDate ? new Date(t.startDate).getFullYear().toString() : '9999';
            const endYear = t.endDate ? new Date(t.endDate).getFullYear().toString() : '0000';
            if (!(startYear <= filterProcessusYear && endYear >= filterProcessusYear)) return false;
            if (filterProcessusQuarter !== 'FULL') {
              let qOverlap = 0;
              if (filterProcessusQuarter === 'T1') qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 0);
              else if (filterProcessusQuarter === 'T2') qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 1);
              else if (filterProcessusQuarter === 'T3') qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 2);
              else if (filterProcessusQuarter === 'T4') qOverlap = getQuarterOverlapDays(t.startDate, t.endDate, filterProcessusYear, 3);
              if (qOverlap <= 0) return false;
            }
          }
          return true;
        }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((t, idx) => {
          const startD = new Date(t.startDate); const endD = new Date(t.endDate);
          const duration = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24))) || 1;

          const vp = Number(t.coutPlanifie) || 0;
          const cr = Number(t.coutReel) || 0;
          const va = t.valeurAcquise !== undefined ? Number(t.valeurAcquise) : ((t.status === 'Terminé' || t.valideVA) ? vp : 0);
          const avancement = vp > 0 ? Math.round((va / vp) * 100) : (va > 0 ? 100 : 0);

          let statutDecaissement = "-"; let statutColorDecaissement = "text-gray-400 bg-gray-50 border-gray-200";
          let ecartPlanningDecaissementVal = null;

          if (t.dateDecaissementReel && t.dateDecaissementPrevu) {
             const diffDays = Math.ceil((new Date(t.dateDecaissementReel).getTime() - new Date(t.dateDecaissementPrevu).getTime()) / (1000 * 60 * 60 * 24));
             ecartPlanningDecaissementVal = diffDays;
             if (diffDays > 0) { statutDecaissement = `Retard ${diffDays} j`; statutColorDecaissement = "text-red-700 bg-red-100"; } 
             else if (diffDays < 0) { statutDecaissement = `Avance ${Math.abs(diffDays)} j`; statutColorDecaissement = "text-emerald-700 bg-emerald-100"; } 
             else { statutDecaissement = `Respecté`; statutColorDecaissement = "text-blue-700 bg-blue-100"; }
          } else if (t.dateDecaissementPrevu) {
             const diffDays = Math.ceil((today.getTime() - new Date(t.dateDecaissementPrevu).getTime()) / (1000 * 60 * 60 * 24));
             ecartPlanningDecaissementVal = diffDays;
             if (diffDays > 0) { statutDecaissement = `Retard ${diffDays} j`; statutColorDecaissement = "text-red-700 bg-red-100"; } 
             else { statutDecaissement = `En attente`; statutColorDecaissement = "text-gray-500 bg-gray-100"; }
          }
          
          const hasPassedPrevu = t.dateDecaissementPrevu ? (new Date(t.dateDecaissementPrevu) <= today) : (new Date(t.endDate) <= today);
          let decaissementPrevuADate = 0;
          if (hasPassedPrevu) decaissementPrevuADate = (t.montantDecaissementPrevu !== undefined && t.montantDecaissementPrevu !== '') ? Number(t.montantDecaissementPrevu) : vp;
          const decaisse = t.montantDecaissementReel !== undefined && t.montantDecaissementReel !== '' ? Number(t.montantDecaissementReel) : cr;
          const tauxRespectDecaissementVal = decaissementPrevuADate > 0 ? Math.round((decaisse / decaissementPrevuADate) * 100) : (decaisse > 0 ? 100 : 0);

          return { 
            ...t, number: idx + 1, duration: duration + 'j', 
            debutPrevuStr: startD.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: '2-digit'}), 
            finPrevueStr: endD.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: '2-digit'}),
            dateDecaissementPrevuStr: t.dateDecaissementPrevu ? new Date(t.dateDecaissementPrevu).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '-',
            dateDecaissementReelStr: t.dateDecaissementReel ? new Date(t.dateDecaissementReel).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '-',
            vp, va, avancement, cr, ec: va - cr, ed: va - vp, ipc: cr > 0 ? (va / cr).toFixed(2) : (va > 0 ? '' : '1.00'), ipd: vp > 0 ? (va / vp).toFixed(2) : (va > 0 ? '' : '1.00'),
            ecartPlanningDecaissementVal, tauxRespectDecaissementVal, decaissementPrevuADate, decaisse, statutDecaissement, statutColorDecaissement
          };
        }) : [];
        return { phase: phaseName, items };
      });
      return { ...project, groups };
    });

    return (
      <div className="animate-in fade-in duration-500 pb-10 flex flex-col h-full">
        <div className="flex justify-between items-center border-b pb-1 border-emerald-200 shrink-0 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-emerald-600" /> Suivi Scientifique & Budgétaire (EVM)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Suivi de la valeur acquise, planning et décaissements opérationnels</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 shrink-0">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> 1. Année
            </label>
            <div className="relative">
              <select className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg p-2.5 pr-8 outline-none cursor-pointer"
                value={filterProcessusYear} onChange={(e) => { setFilterProcessusYear(e.target.value); if (e.target.value === 'ALL') setFilterProcessusQuarter('FULL'); }}>
                <option value="ALL">Période Globale</option><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 2. Composante
            </label>
            <div className="relative">
              <select className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg p-2.5 pr-8 outline-none cursor-pointer"
                value={filterProcessusAxe} onChange={(e) => { setFilterProcessusAxe(e.target.value); setFilterProcessusProj('FULL'); }}>
                <option value="FULL">Toutes les composantes</option>
                {data.filter(d => filterProcessusDossier === 'FULL' || d.id === filterProcessusDossier).map(dossier => dossier.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                )))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <FolderTree className="w-3 h-3 mr-1" /> 3. Projet
            </label>
            <div className="relative">
              <select className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg p-2.5 pr-8 outline-none cursor-pointer"
                value={filterProcessusProj} onChange={(e) => setFilterProcessusProj(e.target.value)}>
                <option value="FULL">Tous les projets</option>
                {allProjects.filter(p => filterProcessusDossier === 'FULL' || p.dossierId === filterProcessusDossier).filter(p => filterProcessusAxe === 'FULL' || p.axeId === filterProcessusAxe).map((proj, index) => (
                    <option key={proj.id} value={proj.id}>{index + 1}. {proj.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Activity className="w-3 h-3 mr-1" /> 4. Trimestre
            </label>
            <div className="relative">
              <select className={`w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg p-2.5 pr-8 outline-none cursor-pointer ${filterProcessusYear === 'ALL' ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={filterProcessusQuarter} onChange={(e) => setFilterProcessusQuarter(e.target.value)} disabled={filterProcessusYear === 'ALL'}>
                <option value="FULL">Année entière</option>
                <option value="T1">Trimestre 1</option><option value="T2">Trimestre 2</option><option value="T3">Trimestre 3</option><option value="T4">Trimestre 4</option>
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2 pb-10">
            <div className="animate-in fade-in duration-500 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] flex-1 hide-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-800 text-white text-xs shadow-md sticky top-0 z-40">
                      <tr>
                        <th className="px-2 py-3 border-b border-slate-700 border-r sticky left-0 bg-slate-800 z-50 w-[90px] min-w-[90px] text-center" rowSpan={2}>Tâche/Jalon</th>
                        <th className="px-3 py-3 border-b border-slate-700 border-r sticky left-[90px] bg-slate-800 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] w-[180px] min-w-[180px] whitespace-normal" rowSpan={2}>Activité / Tâche</th>
                        <th className="px-4 py-3 border-b border-slate-700 border-r text-center whitespace-normal w-[140px] max-w-[140px]" rowSpan={2}>Responsable</th>
                        <th className="px-4 py-3 border-b border-slate-700 border-r text-center text-emerald-200" rowSpan={2}>État</th>
                        
                        <th className="px-3 py-1.5 font-bold text-center border-r border-slate-700 border-b text-indigo-200" colSpan={2}>Période d'Exécution</th>
                        <th className="px-4 py-3 border-b border-slate-700 border-r text-center whitespace-normal w-[130px] max-w-[130px] text-pink-200" rowSpan={2}>Bailleur / Financement</th>
                        <th className="px-3 py-1.5 font-bold text-center border-r border-slate-700 border-b text-purple-200" colSpan={2}>Décaissement Prévu</th>
                        <th className="px-3 py-1.5 font-bold text-center border-r border-slate-700 border-b text-teal-200" colSpan={2}>Décaissement Effectué</th>
                        <th className="px-3 py-1.5 font-bold text-center border-r border-slate-700 border-b text-yellow-200" rowSpan={2}>Statut Décaissement</th>
                        
                        <th className="px-3 py-1.5 font-bold text-center border-r border-slate-700 border-b text-blue-200">Valeur Prévue</th>
                        <th className="px-3 py-1.5 font-bold text-center border-r border-slate-700 border-b text-green-200">Valeur Acquise</th>
                        <th className="px-3 py-1.5 font-bold text-center border-r border-slate-700 border-b text-emerald-200">Progrès</th>
                        <th className="px-3 py-1.5 font-bold text-center border-r border-slate-700 border-b text-orange-200">Coût Réel</th>
                        <th className="px-3 py-1.5 font-bold text-center border-l border-slate-700 border-b bg-slate-800 sticky right-0 z-50 w-[70px]" rowSpan={2}>Actions</th>
                      </tr>
                      <tr className="bg-slate-700">
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-indigo-100">Début</th>
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-indigo-100">Fin</th>
                        
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-purple-100">Période (Date)</th>
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-purple-100">Montant (M)</th>
                        
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-teal-100">Période (Date)</th>
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-teal-100">Montant (M)</th>
                        
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-blue-100">VP</th>
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-green-100">VA</th>
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-emerald-100">%</th>
                        <th className="px-3 py-1.5 text-center border-r border-slate-600 text-orange-100">CR</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                      {enrichedProjects.length === 0 && (
                        <tr><td colSpan={25} className="text-center py-12 text-gray-400 italic">Aucun projet ne correspond à cette sélection.</td></tr>
                      )}
                      {enrichedProjects.map(project => {
                        return (
                          <React.Fragment key={project.id}>
                            {project.groups.map((group, idx) => (
                              <React.Fragment key={`${project.id}-phase-${idx}`}>
                                <tr className="bg-emerald-800 border-b border-emerald-700">
                                  <td colSpan={25} className="p-0 border-r border-emerald-700 sticky left-0 bg-emerald-800 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="px-4 py-2 w-full flex items-center justify-between">
                                      <span className="text-emerald-100 font-bold text-xs uppercase tracking-widest">
                                        {group.phase}
                                      </span>
                                      {!project.isReadOnly && (
                                        <button 
                                          onClick={() => handleAddTask(project.id, group.phase)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-bold flex items-center transition-colors shadow-sm cursor-pointer"
                                        >
                                          <Plus className="w-3 h-3 mr-1" /> Ajouter
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                
                                {editingTaskId === 'new' && editingProjectId === project.id && editingPhase === group.phase && (
                                  <tr className="bg-emerald-50/80 border-b border-emerald-200 shadow-inner">
                                    <td className="px-2 py-2 sticky left-0 bg-emerald-50/80 z-30 border-r border-emerald-200">
                                      <select className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-700 bg-white" value={editFormData.type} onChange={(e) => {
                                        const val = e.target.value; setEditFormData({...editFormData, type: val, endDate: val === 'jalon' ? editFormData.startDate : editFormData.endDate});
                                      }}>
                                        <option value="tache">Tâche</option><option value="jalon">Jalon</option>
                                      </select>
                                    </td>
                                    <td className="px-2 py-2 sticky left-[90px] bg-emerald-50/80 z-30 border-r border-emerald-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                      <input type="text" placeholder="Activité / Tâche..." className="w-full p-1.5 text-xs font-bold border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} autoFocus />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200">
                                      <input type="text" placeholder="Responsable..." className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={editFormData.assignee} onChange={(e) => setEditFormData({...editFormData, assignee: e.target.value})} />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200">
                                      <select className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
                                        <option value="À faire">À faire</option><option value="En cours">En cours</option><option value="Terminé">Terminé</option><option value="Bloqué">Bloqué</option>
                                      </select>
                                      {editFormData.status === 'Bloqué' && (
                                        <input type="text" placeholder="Précisez le motif..." className="w-full mt-1.5 p-1.5 text-[9px] font-medium border border-red-300 rounded outline-none placeholder-red-300 text-red-700 bg-red-50 focus:ring-1 focus:ring-red-400" value={editFormData.motifBlocage || ''} onChange={(e) => setEditFormData({...editFormData, motifBlocage: e.target.value})} />
                                      )}
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200">
                                      <input type="date" className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-indigo-700" value={editFormData.startDate} onChange={(e) => {
                                        const d = e.target.value; setEditFormData({...editFormData, startDate: d, endDate: editFormData.type === 'jalon' ? d : editFormData.endDate});
                                      }} />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200">
                                      <input type="date" className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-indigo-700" value={editFormData.endDate} onChange={(e) => setEditFormData({...editFormData, endDate: e.target.value})} disabled={editFormData.type === 'jalon'} />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200 bg-pink-50/50">
                                      <input type="text" placeholder="Bailleur..." className="w-full p-1.5 text-[10px] font-bold border border-pink-300 rounded focus:ring-2 focus:ring-pink-500 outline-none text-slate-800 bg-white" value={editFormData.responsableTresorerie} onChange={(e) => setEditFormData({...editFormData, responsableTresorerie: e.target.value})} />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200 bg-purple-50/30">
                                      <input type="date" className="w-full p-1.5 text-[10px] font-bold border border-purple-300 rounded outline-none text-purple-700 bg-white" value={editFormData.dateDecaissementPrevu || ''} onChange={(e) => setEditFormData({...editFormData, dateDecaissementPrevu: e.target.value})} title="Date de décaissement prévue" />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200 bg-purple-50/30">
                                      <input type="number" placeholder="Montant..." className="w-full p-1.5 text-[10px] font-bold border border-purple-300 rounded outline-none text-center text-purple-700 bg-white" value={editFormData.montantDecaissementPrevu !== undefined ? editFormData.montantDecaissementPrevu : ''} onChange={(e) => setEditFormData({...editFormData, montantDecaissementPrevu: e.target.value !== '' ? Number(e.target.value) : ''})} />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200 bg-teal-50/30">
                                      <input type="date" className="w-full p-1.5 text-[10px] font-bold border border-teal-300 rounded outline-none text-teal-700 bg-white" value={editFormData.dateDecaissementReel || ''} onChange={(e) => setEditFormData({...editFormData, dateDecaissementReel: e.target.value})} title="Date de décaissement effectuée" />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200 bg-teal-50/30">
                                      <input type="number" placeholder="Montant..." className="w-full p-1.5 text-[10px] font-bold border border-teal-300 rounded outline-none text-center text-teal-700 bg-white" value={editFormData.montantDecaissementReel !== undefined ? editFormData.montantDecaissementReel : ''} onChange={(e) => setEditFormData({...editFormData, montantDecaissementReel: e.target.value !== '' ? Number(e.target.value) : ''})} />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200 text-center bg-slate-50">
                                      <span className="text-[10px] text-emerald-400 italic">Auto.</span>
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200">
                                      <input type="number" placeholder="VP" className="w-full p-1.5 text-[10px] font-bold border border-blue-300 rounded outline-none text-center text-blue-700" value={editFormData.coutPlanifie} onChange={(e) => setEditFormData({...editFormData, coutPlanifie: Number(e.target.value)})} />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200">
                                      <input type="number" placeholder="VA" className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded outline-none text-center text-emerald-700" value={editFormData.valeurAcquise} onChange={(e) => setEditFormData({...editFormData, valeurAcquise: Number(e.target.value)})} />
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200 text-center font-bold text-[10px] text-emerald-600 bg-white">
                                      {(Number(editFormData.coutPlanifie) || 0) > 0 ? Math.round(((Number(editFormData.valeurAcquise) || 0) / (Number(editFormData.coutPlanifie) || 1)) * 100) : 0}%
                                    </td>
                                    <td className="px-2 py-2 border-r border-emerald-200">
                                      <input type="number" placeholder="CR" className="w-full p-1.5 text-[10px] font-bold border border-orange-300 rounded outline-none text-center text-orange-700" value={editFormData.coutReel} onChange={(e) => setEditFormData({...editFormData, coutReel: Number(e.target.value)})} />
                                    </td>
                                    <td className="px-2 py-2 text-center bg-emerald-50/80 sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] border-l border-emerald-200">
                                      <div className="flex justify-center gap-1.5">
                                        <button onClick={handleSaveTask} className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded shadow-sm transition-colors cursor-pointer" title="Enregistrer"><CheckCircle className="w-4 h-4"/></button>
                                        <button onClick={() => setEditingTaskId(null)} className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow-sm transition-colors cursor-pointer" title="Annuler"><span className="font-black text-[10px] w-4 h-4 flex items-center justify-center">X</span></button>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {group.items.length === 0 ? (
                                  <tr><td colSpan={25} className="px-8 py-3 text-left text-slate-400 italic text-[11px] bg-slate-50 sticky left-0">Aucune activité n'est encore enregistrée pour cette phase.</td></tr>
                                ) : (
                                  group.items.map((item) => {
                                    if (editingTaskId === item.id) {
                                      return (
                                        <tr key={item.id} className="bg-emerald-50/80 border-b border-emerald-200 shadow-inner">
                                          <td className="px-2 py-2 sticky left-0 bg-emerald-50/80 z-30 border-r border-emerald-200">
                                            <select className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-700 bg-white" value={editFormData.type} onChange={(e) => {
                                              const val = e.target.value; setEditFormData({...editFormData, type: val, endDate: val === 'jalon' ? editFormData.startDate : editFormData.endDate});
                                            }}>
                                              <option value="tache">Tâche</option><option value="jalon">Jalon</option>
                                            </select>
                                          </td>
                                          <td className="px-2 py-2 sticky left-[90px] bg-emerald-50/80 z-30 border-r border-emerald-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                            <input type="text" placeholder="Activité..." className="w-full p-1.5 text-xs font-bold border border-emerald-300 rounded outline-none text-slate-800" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} autoFocus />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200">
                                            <input type="text" placeholder="Responsable..." className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded outline-none" value={editFormData.assignee} onChange={(e) => setEditFormData({...editFormData, assignee: e.target.value})} />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200">
                                            <select className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded outline-none" value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
                                              <option value="À faire">À faire</option><option value="En cours">En cours</option><option value="Terminé">Terminé</option><option value="Bloqué">Bloqué</option>
                                            </select>
                                            {editFormData.status === 'Bloqué' && (
                                              <input type="text" placeholder="Précisez le motif..." className="w-full mt-1.5 p-1.5 text-[9px] font-medium border border-red-300 rounded outline-none placeholder-red-300 text-red-700 bg-red-50 focus:ring-1 focus:ring-red-400" value={editFormData.motifBlocage || ''} onChange={(e) => setEditFormData({...editFormData, motifBlocage: e.target.value})} />
                                            )}
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200">
                                            <input type="date" className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded outline-none text-indigo-700" value={editFormData.startDate} onChange={(e) => {
                                              const d = e.target.value; setEditFormData({...editFormData, startDate: d, endDate: editFormData.type === 'jalon' ? d : editFormData.endDate});
                                            }} />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200">
                                            <input type="date" className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded outline-none text-indigo-700" value={editFormData.endDate} onChange={(e) => setEditFormData({...editFormData, endDate: e.target.value})} disabled={editFormData.type === 'jalon'} />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200 bg-pink-50/50">
                                            <input type="text" placeholder="Bailleur..." className="w-full p-1.5 text-[10px] font-bold border border-pink-300 rounded outline-none text-slate-800 bg-white" value={editFormData.responsableTresorerie} onChange={(e) => setEditFormData({...editFormData, responsableTresorerie: e.target.value})} />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200 bg-purple-50/30">
                                            <input type="date" className="w-full p-1.5 text-[10px] font-bold border border-purple-300 rounded outline-none text-purple-700 bg-white" value={editFormData.dateDecaissementPrevu || ''} onChange={(e) => setEditFormData({...editFormData, dateDecaissementPrevu: e.target.value})} title="Date de décaissement prévue" />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200 bg-purple-50/30">
                                            <input type="number" placeholder="Montant..." className="w-full p-1.5 text-[10px] font-bold border border-purple-300 rounded outline-none text-center text-purple-700 bg-white" value={editFormData.montantDecaissementPrevu !== undefined ? editFormData.montantDecaissementPrevu : ''} onChange={(e) => setEditFormData({...editFormData, montantDecaissementPrevu: e.target.value !== '' ? Number(e.target.value) : ''})} />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200 bg-teal-50/30">
                                            <input type="date" className="w-full p-1.5 text-[10px] font-bold border border-teal-300 rounded outline-none text-teal-700 bg-white" value={editFormData.dateDecaissementReel || ''} onChange={(e) => setEditFormData({...editFormData, dateDecaissementReel: e.target.value})} title="Date de décaissement effectuée" />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200 bg-teal-50/30">
                                            <input type="number" placeholder="Montant..." className="w-full p-1.5 text-[10px] font-bold border border-teal-300 rounded outline-none text-center text-teal-700 bg-white" value={editFormData.montantDecaissementReel !== undefined ? editFormData.montantDecaissementReel : ''} onChange={(e) => setEditFormData({...editFormData, montantDecaissementReel: e.target.value !== '' ? Number(e.target.value) : ''})} />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200 text-center bg-slate-50">
                                            <span className="text-[10px] text-emerald-400 italic">Auto.</span>
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200">
                                            <input type="number" placeholder="VP" className="w-full p-1.5 text-[10px] font-bold border border-blue-300 rounded outline-none text-center text-blue-700" value={editFormData.coutPlanifie} onChange={(e) => setEditFormData({...editFormData, coutPlanifie: Number(e.target.value)})} />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200">
                                            <input type="number" placeholder="VA" className="w-full p-1.5 text-[10px] font-bold border border-emerald-300 rounded outline-none text-center text-emerald-700" value={editFormData.valeurAcquise} onChange={(e) => setEditFormData({...editFormData, valeurAcquise: Number(e.target.value)})} />
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200 text-center font-bold text-[10px] text-emerald-600 bg-white">
                                            {(Number(editFormData.coutPlanifie) || 0) > 0 ? Math.round(((Number(editFormData.valeurAcquise) || 0) / (Number(editFormData.coutPlanifie) || 1)) * 100) : 0}%
                                          </td>
                                          <td className="px-2 py-2 border-r border-emerald-200">
                                            <input type="number" placeholder="CR" className="w-full p-1.5 text-[10px] font-bold border border-orange-300 rounded outline-none text-center text-orange-700" value={editFormData.coutReel} onChange={(e) => setEditFormData({...editFormData, coutReel: Number(e.target.value)})} />
                                          </td>
                                          <td className="px-2 py-2 text-center bg-emerald-50/80 sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] border-l border-emerald-200">
                                            <div className="flex justify-center gap-1.5">
                                              <button onClick={handleSaveTask} className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded shadow-sm transition-colors cursor-pointer" title="Enregistrer"><CheckCircle className="w-4 h-4"/></button>
                                              <button onClick={() => setEditingTaskId(null)} className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow-sm transition-colors cursor-pointer" title="Annuler"><span className="font-black text-[10px] w-4 h-4 flex items-center justify-center">X</span></button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    }

                                    return (
                                      <tr key={item.id} className="group hover:bg-emerald-50/40 transition-colors text-xs bg-slate-50 border-b border-gray-100">
                                        <td className="px-2 py-3 flex items-start font-bold relative text-emerald-600 sticky left-0 bg-slate-50 group-hover:bg-emerald-50 z-30 border-r border-gray-200 align-top w-[90px] min-w-[90px] max-w-[90px]">
                                          <span className="w-12 shrink-0 truncate">{item.type === 'tache' ? `Tâche ${item.number}` : `Jalon ${item.number}`}</span>
                                          {item.type === 'jalon' && <Diamond className="w-3.5 h-3.5 text-emerald-400 fill-current ml-1 mt-0.5 shrink-0" />}
                                        </td>
                                        <td className="px-3 py-3 font-bold text-white whitespace-normal leading-tight sticky left-[90px] bg-slate-800 group-hover:bg-slate-700 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-700 w-[180px] min-w-[180px] max-w-[180px] align-top text-[11px]">
                                          <div className="flex items-start">
                                            {item.type === 'jalon' ? <Diamond className="w-3 h-3 mr-2 fill-current mt-0.5 shrink-0 text-yellow-400" /> : <Activity className="w-3 h-3 mr-2 mt-0.5 shrink-0 text-emerald-400" />}
                                            <span title={item.name}>{item.name}</span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center border-r border-gray-200 bg-slate-50 align-top">
                                          <div className="font-bold text-slate-700">{item.assignee || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center border-r border-gray-200 bg-white align-top">
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold shadow-sm inline-block min-w-[70px] ${
                                            item.status === 'Terminé' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                            item.status === 'En cours' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                            item.status === 'Bloqué' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                                          }`}>
                                            {item.status}
                                          </span>
                                          {item.status === 'Bloqué' && item.motifBlocage && (
                                            <div className="mt-1.5 text-[9px] text-red-600 font-bold bg-red-50 p-1 rounded border border-red-100 break-words leading-tight w-full max-w-[120px] mx-auto">
                                              {item.motifBlocage}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-center border-r border-gray-100 text-indigo-700 bg-indigo-50/30 align-top">{item.debutPrevuStr}</td>
                                        <td className="px-3 py-3 text-center border-r border-gray-200 text-indigo-700 bg-indigo-50/30 align-top">{item.finPrevueStr}</td>
                                        <td className="px-3 py-3 text-center border-r border-gray-200 bg-pink-50/30 align-top whitespace-normal">
                                          <div className="font-bold text-slate-700">{item.responsableTresorerie || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-center border-r border-gray-100 text-purple-700 font-medium bg-purple-50/30 align-top">{item.dateDecaissementPrevuStr}</td>
                                        <td className="px-3 py-3 text-center border-r border-gray-200 text-purple-700 font-bold bg-purple-50/30 align-top">{item.decaissementPrevuADate > 0 ? `${item.decaissementPrevuADate} M` : '-'}</td>
                                        <td className="px-3 py-3 text-center border-r border-gray-100 text-teal-700 font-medium bg-teal-50/30 align-top">{item.dateDecaissementReelStr}</td>
                                        <td className="px-3 py-3 text-center border-r border-gray-200 text-teal-700 font-bold bg-teal-50/30 align-top">{item.decaisse > 0 ? `${item.decaisse} M` : '-'}</td>
                                        <td className="px-3 py-3 text-center border-r border-slate-200 align-top">
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold shadow-sm inline-block border ${item.statutColorDecaissement}`}>
                                            {item.statutDecaissement}
                                          </span>
                                        </td>
                                        <td className="px-3 py-3 text-center text-blue-700 bg-blue-50/30 border-r border-gray-100 font-medium align-top">{item.vp} M</td>
                                        <td className="px-3 py-3 text-center text-green-700 bg-green-50/30 border-r border-gray-100 font-bold align-top">{item.va} M</td>
                                        <td className="px-3 py-3 text-center text-emerald-600 bg-emerald-50/30 border-r border-gray-100 font-bold align-top">{item.avancement}%</td>
                                        <td className="px-3 py-3 text-center text-orange-700 bg-orange-50/30 border-r border-gray-200 font-medium align-top">{item.cr} M</td>
                                        <td className="px-2 py-3 text-center align-top border-l border-gray-100 bg-white sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[70px]">
                                          {!project.isReadOnly && (
                                            <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => handleEditTask(project.id, group.phase, item)} className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 cursor-pointer" title="Modifier"><Edit3 className="w-3.5 h-3.5"/></button>
                                              <button onClick={() => handleDeleteTask(project.id, item.id)} className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 cursor-pointer" title="Supprimer"><Trash2 className="w-3.5 h-3.5"/></button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 sticky bottom-0 z-20">
                      <tr>
                        <td colSpan={12} className="px-3 py-3 text-slate-800 uppercase text-[10px] border-r border-slate-300 sticky left-0 bg-slate-100 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-right">Total Global de la sélection</td>
                        <td className="px-3 py-3 text-center text-blue-800 border-r border-slate-300">{totalVP} M</td>
                        <td className="px-3 py-3 text-center text-green-800 border-r border-slate-300">{totalVA} M</td>
                        <td className="px-3 py-3 text-center font-bold text-emerald-600 border-r border-slate-300">{totalVP > 0 ? Math.round((totalVA/totalVP)*100) : 0}%</td>
                        <td className="px-3 py-3 text-center text-orange-800 border-r border-slate-300">{totalCR} M</td>
                        <td className="px-3 py-3 bg-slate-100 sticky right-0 z-30 border-l border-slate-300 text-center">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
        </div>
      </div>
    );
  };

  const hasExplored = data.length > 0 || filterProcessusDossier !== 'FULL' || filterPTBADossier !== 'FULL';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="bg-emerald-800 text-white border-b border-emerald-900 shadow-sm px-6 py-3 flex justify-between items-center shrink-0 z-50 relative">
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-emerald-700 rounded-lg transition-colors text-emerald-100 cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <Building2 className="w-5 h-5 text-emerald-300 mr-2 shrink-0" />
            <h1 className="text-base sm:text-lg font-black tracking-wider uppercase drop-shadow-md truncate max-w-xs sm:max-w-md md:max-w-xl">
              {activeInstitution || 'VOTRE INSTITUTION'} <span className="font-medium opacity-80 ml-1 text-sm hidden sm:inline">| Suivi Budgétaire & EVM</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {data.length > 0 ? (
            <span className="text-xs bg-emerald-700/60 text-emerald-100 px-2.5 py-1 rounded-full border border-emerald-600/50 font-semibold">
              {data.length} {data.length > 1 ? 'Programmes' : 'Programme'}
            </span>
          ) : (
            <button 
              onClick={handleLoadDemoData}
              className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg border border-emerald-500 font-semibold flex items-center transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-300" />
              Mode Démo
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 z-40 relative shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)]`}>
          <div className="w-full px-3 py-4 flex flex-col h-full overflow-y-auto hide-scrollbar overflow-x-hidden">
            <nav className="space-y-1.5 flex-1 text-sm font-medium">
              <button title="Accueil" onClick={() => setActiveTab('accueil')} className={`w-full flex items-center ${isSidebarOpen ? 'px-3 space-x-3 justify-start' : 'px-0 justify-center'} py-2.5 rounded-lg transition-all cursor-pointer ${activeTab === 'accueil' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Home className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="truncate">Accueil</span>}
              </button>
              <button 
                title="Tableau de Bord Cockpit EVM" 
                onClick={() => setActiveTab('dashboard')} 
                className={`w-full flex items-center ${isSidebarOpen ? 'px-3 space-x-3 justify-start' : 'px-0 justify-center'} py-2.5 rounded-lg transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="truncate">Tableau de Bord</span>}
              </button>
              <button title="Programmes Stratégiques" onClick={() => setActiveTab('projects')} className={`w-full flex items-center ${isSidebarOpen ? 'px-3 space-x-3 justify-start' : 'px-0 justify-center'} py-2.5 rounded-lg transition-all cursor-pointer ${activeTab === 'projects' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <FlaskConical className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="truncate">Programmes Stratégiques</span>}
              </button>
              <button 
                title="PTBA (Prog. Annuel)" 
                onClick={() => setActiveTab('ptba')} 
                className={`w-full flex items-center ${isSidebarOpen ? 'px-3 space-x-3 justify-start' : 'px-0 justify-center'} py-2.5 rounded-lg transition-all cursor-pointer ${activeTab === 'ptba' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FileSpreadsheet className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="truncate">PTBA (Prog. Annuel)</span>}
              </button>
              <button 
                title="Suivi Scientifique & Budgétaire" 
                onClick={() => setActiveTab('processus')} 
                className={`w-full flex items-center ${isSidebarOpen ? 'px-3 space-x-3 justify-start' : 'px-0 justify-center'} py-2.5 rounded-lg transition-all cursor-pointer ${activeTab === 'processus' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <TestTube className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="truncate">Suivi EVM</span>}
              </button>
            </nav>

            <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-400">
              {isSidebarOpen ? (
                <div className="space-y-1">
                  <p className="font-bold text-gray-500 uppercase tracking-wider">FAAB GAR</p>
                  <p>Gestion Budgétaire & EVM</p>
                </div>
              ) : (
                <div className="text-center font-bold text-gray-400">FG</div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 z-10 relative">
          {activeTab === 'accueil' && renderAccueil()}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'projects' && renderProjectManager()}
          {activeTab === 'ptba' && renderPTBA()}
          {activeTab === 'processus' && renderProcessus()}
        </main>
      </div>
    </div>
  );
}
