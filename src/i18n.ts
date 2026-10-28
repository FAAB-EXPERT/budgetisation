import { CurrencyCode, LanguageCode } from './types';

// Base amounts are stored in FCFA
// 1 EUR = 655.957 FCFA, 1 USD = 605 FCFA
export function convertFromFCFA(amountFCFA: number = 0, currency: CurrencyCode): number {
  const safe = Number(amountFCFA) || 0;
  if (currency === 'EUR') return safe / 655.957;
  if (currency === 'USD') return safe / 605;
  return safe;
}

export function convertToFCFA(amountInCurrency: number = 0, currency: CurrencyCode): number {
  const safe = Number(amountInCurrency) || 0;
  if (currency === 'EUR') return Math.round(safe * 655.957);
  if (currency === 'USD') return Math.round(safe * 605);
  return Math.round(safe);
}

export function formatCurrency(amountFCFA: number = 0, currency: CurrencyCode, lang: LanguageCode = 'FR'): string {
  const converted = convertFromFCFA(amountFCFA, currency);
  const locale = lang === 'FR' ? 'fr-FR' : 'en-US';
  if (currency === 'FCFA') {
    const numStr = Math.round(converted).toLocaleString(locale).replace(/[\u202F\u00A0]/g, ' ');
    return `${numStr} FCFA`;
  }
  if (currency === 'EUR') {
    const numStr = converted
      .toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replace(/[\u202F\u00A0]/g, ' ');
    return `${numStr} EUR`;
  }
  const numStr = converted
    .toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/[\u202F\u00A0]/g, ' ');
  return `${numStr} USD`;
}

export const formatCurrencyValue = formatCurrency;

export const translations = {
  FR: {
    appName: 'FAAB BUD',
    appSubtitle: 'Plateforme Universelle de Planification Stratégique, Suivi Budgétaire & EVM, Réseau PERT & Décaissements',
    nav: {
      accueil: 'Accueil & Présentation',
      profil: 'Profil Utilisateur',
      projects: 'Dossiers & Projets',
      fiche: 'Fiche Technique & Résumé Exécutif',
      docgen: 'Générateur de Documents',
      dashboard: 'Tableau de Bord Décisionnel',
      planification: 'Planification',
      processus: 'Suivi Budgétaire',
      raci: 'RACI',
      categorie: 'Catégorie',
      gantt: 'Diagramme de Gantt & Arbre',
      pert: 'Réseau PERT',
      kanban: 'Tableau Kanban Interactif',
      prepPhase: 'PHASE PRÉPARATOIRE & CADRAGE',
      execPhase: 'PILOTAGE & EXÉCUTION OPÉRATIONNELLE'
    },
    actions: {
      importJson: 'Importer JSON',
      saveJson: 'Enregistrer / Mettre à jour JSON',
      exportJson: 'Exporter une copie JSON',
      exportPdf: 'Télécharger le rapport PDF',
      activeDossier: 'Dossier / Projet Actif',
      currency: 'Devise Monétaire',
      language: 'Langue / Language',
      theme: 'Thème Visuel',
      lightMode: 'Mode Clair (#FFFFFF)',
      darkMode: 'Mode Sombre (#0f172a)',
      zoomIn: 'Zoom +',
      zoomOut: 'Zoom -',
      zoomReset: '100%',
      graphView: 'Vue Graphique / Arbre',
      listView: 'Vue Liste / Tableau'
    },
    home: {
      anchorPresentation: 'Présentation Générale',
      anchorUsage: 'Mode d’Emploi (Modules)',
      anchorDocs: 'Générateur de 15 Documents',
      anchorMethodology: 'Méthodologie GAR & PERT',
      anchorBackup: 'Sauvegarde JSON',
      anchorCredits: 'Crédits & Propriété',
      anchorLegal: 'Propriété Intellectuelle',
      heroBadge: 'Suivi Budgétaire & Planification Universelle · Méthode PERT/CPM, EVM & Pilotage des Décaissements',
      heroTitle: 'FAAB BUD — Pilotez Vos Budgets, Vos Décaissements et Vos Projets avec Précision',
      heroDesc: 'Conçue pour toutes les entreprises, institutions publiques, ONG, bureaux d’études et directeurs financiers : FAAB BUD est la plateforme de référence pour le suivi budgétaire rigoureux, intégrant la macro-planification financière, le suivi des décaissements et de la valeur acquise (EVM), le cadrage PTBA, le Réseau PERT budgétaire, le Kanban financier et un générateur de 22 documents institutionnels aux normes internationales.',
      menuInstruction: 'Utilisez exclusivement l’icône du Menu Burger (☰) située en haut à gauche pour naviguer vers les modules de l’application.',
      pillarsTitle: 'Architecture Fonctionnelle & Méthodologie de Suivi Budgétaire FAAB BUD',
      pillar1Title: '01. Macro-Planification & Suivi Budgétaire (EVM & PTBA)',
      pillar1Desc: 'Séparation claire et complémentarité entre la Planification (lignes budgétaires, bailleurs, dates prévues) et le Suivi Budgétaire (décaissements réels, valeur acquise EVM, reste à décaisser et PTBA annuel).',
      pillar2Title: '02. Réseau PERT & Chemin Critique Budgétaire',
      pillar2Desc: 'Modélisation interactive du graphe PERT axée sur la sécurisation des flux financiers et des jalons critiques pour éviter tout goulot d’étranglement de décaissement.',
      pillar3Title: '03. Kanban Budgétaire Intelligent & Multi-Devises',
      pillar3Desc: 'Le déplacement d’une ligne budgétaire dans le Kanban répercute automatiquement les montants décaissés et la valeur acquise, avec conversion FCFA / EUR / USD.',
      pillar4Title: '04. Générateur de 22 Documents & 10 Matrices aux Normes Internationales',
      pillar4Desc: 'Production instantanée en PDF fond blanc pur de 22 livrables financiers et officiels (PTBA, PTT, TDR, Budget EVM, Note S&E, Rapports d’Audit) synchronisés avec les 10 Matrices Maîtresses.',
      backupTitle: 'Guide Pédagogique : Sauvegarde & Mise à Jour du Fichier JSON',
      backupSubtitle: 'Comment utiliser l’icône Disquette du menu déroulant et pourquoi adopter cette discipline ?',
      backupHowTitle: 'Comment enregistrer / écraser votre fichier JSON ?',
      backupHowDesc: 'Ouvrez le menu déroulant (☰) et cliquez sur la 2ème icône en haut (Disquette "Enregistrer / Mettre à jour JSON"). Grâce à l’API File System Access intégrée, l’application écrase et met à jour directement votre fichier .json existant sur votre appareil sans créer de fichiers multiples numérotés.',
      backupWhy1Title: '1. Unicité de la version sans doublons',
      backupWhy1Desc: 'Évite la prolifération de fichiers "projet(1).json", "projet(2).json" dans vos téléchargements et garantit une source unique de vérité.',
      backupWhy2Title: '2. Double sécurité IndexedDB + Fichier local',
      backupWhy2Desc: 'Vos saisies sont sauvegardées en temps réel dans la base IndexedDB de l’appareil ET consolidées sur votre disque dur en un clic.',
      backupWhy3Title: '3. Portabilité, audit et partage universel',
      backupWhy3Desc: 'Transférez votre portefeuille complet entre ordinateur, tablette et smartphone ou transmettez-le à vos partenaires et comités de pilotage.',
      creditsTitle: 'Crédits de Conception & Ingénierie Logicielle',
      creatorLabel: 'Créateur & Architecte Principal',
      legalTitle: 'Accord de Confidentialité & Propriété Intellectuelle',
      legalText: 'La présente plateforme (« FAAB BUD »), incluant son architecture structurelle, ses algorithmes de calcul de réseau PERT et chemin critique (CPM), son générateur documentaire normé, son moteur de persistance hybride IndexedDB/JSON et son design d’interface, constitue une œuvre de l’esprit originale protégée par le droit d’auteur national et international, propriété exclusive de KOFFIE FABIEN MICHAEL. Toute reproduction, copie, décompilation, ingénierie inverse, modification ou diffusion non expressément autorisée par écrit par son auteur est formellement interdite et passible de poursuites civiles et pénales.'
    },
    profile: {
      title: 'Profil Utilisateur & Identité du Responsable',
      subtitle: 'Ces informations sont enregistrées automatiquement dans l’IndexedDB et reportées dans tous les dossiers, la Fiche Technique, le Générateur de Documents et les rapports PDF.',
      fullName: 'Nom & Prénoms',
      email: 'Adresse Email Professionnelle',
      phone: 'Contact / Téléphone',
      institution: 'Organisation / Entreprise / Institution',
      role: 'Fonction / Titre Officiel',
      savedNotice: 'Synchronisé automatiquement dans l’IndexedDB de l’appareil'
    }
  },
  EN: {
    appName: 'FAAB BUD',
    appSubtitle: 'Universal Strategic Planning, Budget Tracking & EVM, PERT Network & Disbursements',
    nav: {
      accueil: 'Home & Overview',
      profil: 'User Profile',
      projects: 'Portfolios & Projects',
      fiche: 'Technical Sheet & Executive Summary',
      docgen: 'Document Generator',
      dashboard: 'Executive Dashboard',
      planification: 'Planning',
      processus: 'Budget Tracking',
      raci: 'RACI',
      categorie: 'Category',
      gantt: 'Gantt Chart & WBS Tree',
      pert: 'PERT Network',
      kanban: 'Interactive Kanban Board',
      prepPhase: 'PREPARATORY PHASE & SCOPING',
      execPhase: 'STEERING & OPERATIONAL EXECUTION'
    },
    actions: {
      importJson: 'Import JSON',
      saveJson: 'Save / Overwrite JSON',
      exportJson: 'Export JSON Copy',
      exportPdf: 'Download PDF Report',
      activeDossier: 'Active Portfolio / Project',
      currency: 'Monetary Currency',
      language: 'Language / Langue',
      theme: 'Visual Theme',
      lightMode: 'Light Mode (#FFFFFF)',
      darkMode: 'Dark Mode (#0f172a)',
      zoomIn: 'Zoom +',
      zoomOut: 'Zoom -',
      zoomReset: '100%',
      graphView: 'Graphic / Network View',
      listView: 'Table / List View'
    },
    home: {
      anchorPresentation: 'Overview',
      anchorUsage: 'User Guide (Modules)',
      anchorDocs: '15-Document Generator',
      anchorMethodology: 'RBM & PERT Methodology',
      anchorBackup: 'JSON Backup',
      anchorCredits: 'Credits & IP',
      anchorLegal: 'Intellectual Property',
      heroBadge: 'Universal Budget Tracking & Strategic Planning · PERT/CPM Method, EVM & Disbursement Steering',
      heroTitle: 'FAAB BUD — Steer Your Budgets, Disbursements and Projects with Precision',
      heroDesc: 'Built for companies, public institutions, NGOs, consulting firms, and finance directors: FAAB BUD is the authoritative platform for rigorous budget tracking, integrating macro-financial planning, EVM disbursement & earned value tracking, annual AWPB, budget-driven PERT Network, financial Kanban, and automatic generation of 22 international-standard documents.',
      menuInstruction: 'Exclusively use the Burger Menu icon (☰) at the top left to access the application modules.',
      pillarsTitle: 'FAAB BUD Functional Architecture & Budget Tracking Methodology',
      pillar1Title: '01. Macro-Planning & Budget Tracking (EVM & AWPB)',
      pillar1Desc: 'Clear separation and synergy between Macro-Planning (budget lines, donors, scheduled dates) and Budget Tracking (actual disbursements, EVM earned value, remaining balance, and annual AWPB).',
      pillar2Title: '02. Dynamic PERT Network & Financial Critical Path',
      pillar2Desc: 'Interactive PERT network modeling focused on securing financial flows and critical milestones to prevent disbursement bottlenecks.',
      pillar3Title: '03. Smart Budget Kanban & Multi-Currency Control',
      pillar3Desc: 'Moving a budget line across Kanban columns automatically updates disbursements and earned value, with instant FCFA / EUR / USD conversion.',
      pillar4Title: '04. International-Standard 22-Document & 10-Matrix Generator',
      pillar4Desc: 'Instant pure-white PDF generation for 22 official and financial deliverables (AWPB, QWP, ToR, EVM Budget, M&E Notes, Audit Reports) synchronized with 10 Master Matrices.',
      backupTitle: 'Educational Guide: Saving & Updating Your JSON File',
      backupSubtitle: 'How to use the Floppy Disk icon in the slide-out menu and why this workflow matters',
      backupHowTitle: 'How to save / overwrite your JSON file?',
      backupHowDesc: 'Open the slide-out menu (☰) and click the 2nd icon at the top (Floppy Disk "Save / Overwrite JSON"). Using the File System Access API, the app directly overwrites your existing .json file without cluttering your folder with duplicates.',
      backupWhy1Title: '1. Single authoritative version without duplicates',
      backupWhy1Desc: 'Prevents file clutter like "project(1).json", "project(2).json" and guarantees a single source of truth.',
      backupWhy2Title: '2. Dual safety: IndexedDB + Local File',
      backupWhy2Desc: 'Your changes are saved in real time inside the device IndexedDB AND consolidated on your local drive in one click.',
      backupWhy3Title: '3. Universal portability, audit & sharing',
      backupWhy3Desc: 'Seamlessly transfer your complete portfolio across desktop, tablet, and smartphone or share it with your steering committee.',
      creditsTitle: 'Design & Software Engineering Credits',
      creatorLabel: 'Creator & Lead Software Architect',
      legalTitle: 'Confidentiality Agreement & Intellectual Property',
      legalText: 'This platform ("FAAB BUD"), including its structural architecture, PERT/CPM critical path algorithms, standardized document generator, hybrid IndexedDB/JSON persistence engine, and interface design, is an original intellectual work protected by national and international copyright laws, owned exclusively by KOFFIE FABIEN MICHAEL. Any unauthorized reproduction, copying, reverse engineering, modification, or distribution is strictly prohibited and subject to legal prosecution.'
    },
    profile: {
      title: 'User Profile & Lead Officer Identity',
      subtitle: 'This information is automatically persisted in IndexedDB and reflected across all portfolios, the Technical Sheet, the Document Generator, and PDF reports.',
      fullName: 'Full Name',
      email: 'Professional Email Address',
      phone: 'Phone / Contact Number',
      institution: 'Organization / Company / Institution',
      role: 'Official Role / Title',
      savedNotice: 'Automatically synchronized in device IndexedDB'
    }
  }
};
