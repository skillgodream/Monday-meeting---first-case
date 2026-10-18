import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Camera,
  Upload,
  BookOpen,
  Users,
  FileText,
  Trash2,
  Download,
  Settings,
  Plus,
  CheckCircle2,
  ChevronRight,
  Database,
  Award,
  Search,
  Check,
  UserPlus,
  X,
  Bell,
  ClipboardList,
  BarChart2,
  Radio,
  Activity,
  Filter,
  Clock,
  Building2,
  MapPin,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { Lesson } from '../types';
import { INITIAL_LESSONS } from '../data/lessonsData';
import { sounds } from '../utils/audio';
import { saveQuizToFirestore, logAuditEvent, deleteSopFromFirestore, getAuditLogs, AuditLogEntry } from '../services/firestorePersistence';

interface AdminDashboardViewProps {
  lessons: Lesson[];
  onScanClick: () => void;
  onUploadClick: () => void;
  onSelectSop: (id: string, title: string) => void;
  onDeleteSop?: (id: string) => void;
  onOpenRoleSwitcher: () => void;
  onBackToHome?: () => void;
}

export type AdminViewMode =
  | 'landing'
  | 'users'
  | 'assignments'
  | 'settings'
  | 'repository'
  | 'reports'
  | 'control_tower'
  | 'quiz';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Learner' | 'Manager';
  department: string;
  location: string;
  status: 'Active' | 'Inactive';
  journeyStage?: 'Phase 1 (Day 1–10)' | 'Phase 2 (Continuous)';
  phase3Selected?: boolean;
}

export type JourneyPhaseType =
  | 'Phase 1: New Hire (Day 1–10)'
  | 'Phase 2: Continuous / Mandate'
  | 'Phase 3: Selective Upskilling';

export interface CampaignItem {
  id: string;
  title: string;
  sop: string;
  sopId?: string;
  target: string;
  department: string;
  location: string;
  completion: number;
  journeyPhase?: JourneyPhaseType;
}

export type AssignmentSubView = 'hub' | 'new_hire' | 'continuous' | 'upskilling';

export interface RoleModuleItem {
  id: string;
  title: string;
  subtitle: string;
  sopId?: string;
}

export const INITIAL_ASSIGNMENT_ROLES: string[] = [
  'Cleanroom Operator',
  'Housekeeping Specialist',
  'Warehouse Picker',
  'Floor Assembly Tech',
  'Quality Assurance Lead',
];

export const INITIAL_ROLE_MODULES: Record<string, RoleModuleItem[]> = {
  // NEW HIRE (Day 1 - Day 10)
  'new_hire__Cleanroom Operator': [
    { id: 'nh_co_1', title: 'Aseptic Hand Hygiene & Gowning', subtitle: 'Day 1–3 · Core SOP', sopId: 'aseptic-hygiene' },
    { id: 'nh_co_2', title: 'Airlock Entry & Contamination Control', subtitle: 'Day 4–7 · Safety Protocol', sopId: 'safety-first' },
    { id: 'nh_co_3', title: 'Sterile Bay Floor Readiness Sign-Off', subtitle: 'Day 8–10 · Final Check', sopId: 'aseptic-hygiene' },
  ],
  'new_hire__Housekeeping Specialist': [
    { id: 'nh_hs_1', title: 'Room Sanitization & Disinfection', subtitle: 'Day 1–3 · Core SOP', sopId: 'housekeeping_sanitization' },
    { id: 'nh_hs_2', title: 'Chemical Dilution & Contact Dwell Time', subtitle: 'Day 4–7 · Safety Protocol', sopId: 'housekeeping_sanitization' },
    { id: 'nh_hs_3', title: 'Terminal Cleaning Supervisor Sign-Off', subtitle: 'Day 8–10 · Final Check', sopId: 'housekeeping_sanitization' },
  ],
  'new_hire__Warehouse Picker': [
    { id: 'nh_wp_1', title: 'Warehouse Order Picking 101', subtitle: 'Day 1–3 · Core SOP', sopId: 'picking-101' },
    { id: 'nh_wp_2', title: 'Barcode Scanner & SKU Verification', subtitle: 'Day 4–7 · Operations', sopId: 'picking-101' },
    { id: 'nh_wp_3', title: 'Pallet Stacking & Bay Safety Check', subtitle: 'Day 8–10 · Final Check', sopId: 'safety-first' },
  ],
  'new_hire__Floor Assembly Tech': [
    { id: 'nh_fa_1', title: 'Precision Mechanical Assembly', subtitle: 'Day 1–5 · Core SOP', sopId: 'picking-101' },
    { id: 'nh_fa_2', title: 'ESD Wrist Strap & Workstation Grounding', subtitle: 'Day 6–10 · Safety Protocol', sopId: 'safety-first' },
  ],
  'new_hire__Quality Assurance Lead': [
    { id: 'nh_qa_1', title: 'First-Article Inspection Baseline', subtitle: 'Day 1–5 · Core SOP', sopId: 'safety-first' },
    { id: 'nh_qa_2', title: 'Non-Conformance & Quarantine Logging', subtitle: 'Day 6–10 · Compliance', sopId: 'picking-101' },
  ],

  // CONTINUOUS LEARNING
  'continuous__Cleanroom Operator': [
    { id: 'ct_co_1', title: 'Quarterly Gowning Re-Qualification', subtitle: 'Ongoing · Mandatory Refresher', sopId: 'aseptic-hygiene' },
    { id: 'ct_co_2', title: 'ISO-5 Particle Excursion Protocol', subtitle: 'Compliance Mandate', sopId: 'safety-first' },
  ],
  'continuous__Housekeeping Specialist': [
    { id: 'ct_hs_1', title: 'High-Touch Disinfection Cycle Audit', subtitle: 'Ongoing · Shift Mandate', sopId: 'housekeeping_sanitization' },
    { id: 'ct_hs_2', title: 'Biohazard Spill & PPE Update', subtitle: 'Safety Mandate', sopId: 'safety-first' },
  ],
  'continuous__Warehouse Picker': [
    { id: 'ct_wp_1', title: 'High-Bay Forklift & Aisle Safety', subtitle: 'Ongoing · Mandatory Refresher', sopId: 'safety-first' },
    { id: 'ct_wp_2', title: 'Cold-Chain Packaging Integrity', subtitle: 'SOP Update', sopId: 'picking-101' },
  ],
  'continuous__Floor Assembly Tech': [
    { id: 'ct_fa_1', title: 'Torque Calibration & Tool Audit', subtitle: 'Ongoing · Monthly Check', sopId: 'picking-101' },
  ],
  'continuous__Quality Assurance Lead': [
    { id: 'ct_qa_1', title: 'CAPA Root-Cause Audit Standard', subtitle: 'Ongoing · Compliance Mandate', sopId: 'safety-first' },
  ],

  // UPSKILLING
  'upskilling__Cleanroom Operator': [
    { id: 'up_co_1', title: 'Sterile Line Shift Lead Certification', subtitle: 'Selective Upskilling · Lead Track', sopId: 'aseptic-hygiene' },
    { id: 'up_co_2', title: 'Environmental Viable Sampling Mastery', subtitle: 'Advanced Technical Track', sopId: 'safety-first' },
  ],
  'upskilling__Housekeeping Specialist': [
    { id: 'up_hs_1', title: 'Infection Control Floor Supervisor', subtitle: 'Selective Upskilling · Lead Track', sopId: 'housekeeping_sanitization' },
    { id: 'up_hs_2', title: 'UV-C Autonomous Sterilization Ops', subtitle: 'Advanced Equipment Track', sopId: 'housekeeping_sanitization' },
  ],
  'upskilling__Warehouse Picker': [
    { id: 'up_wp_1', title: 'Inventory Control & QA Hold Lead', subtitle: 'Selective Upskilling · Lead Track', sopId: 'picking-101' },
    { id: 'up_wp_2', title: 'Automated Fleet & Dock Dispatch', subtitle: 'Advanced Logistics Track', sopId: 'picking-101' },
  ],
  'upskilling__Floor Assembly Tech': [
    { id: 'up_fa_1', title: 'Master Line Diagnostics & Rework', subtitle: 'Selective Upskilling · Lead Track', sopId: 'picking-101' },
  ],
  'upskilling__Quality Assurance Lead': [
    { id: 'up_qa_1', title: 'ISO 13485 Internal Lead Auditor', subtitle: 'Selective Upskilling · Executive Track', sopId: 'safety-first' },
  ],
};

const INITIAL_USERS: UserItem[] = [
  { id: 'u1', name: 'Vikram Sharma', email: 'vikram.s@org.internal', role: 'Admin', department: 'Executive Operations', location: 'Munich Facility', status: 'Active' },
  { id: 'u2', name: 'Priya Patel', email: 'priya.p@org.internal', role: 'Learner', department: 'Cleanroom', location: 'Munich Facility', status: 'Active', journeyStage: 'Phase 2 (Continuous)', phase3Selected: false },
  { id: 'u3', name: 'Carlos Mendez', email: 'carlos.m@org.internal', role: 'Learner', department: 'Housekeeping Services', location: 'Bay A/B', status: 'Active', journeyStage: 'Phase 1 (Day 1–10)', phase3Selected: false },
  { id: 'u4', name: 'Amina Al-Mansoor', email: 'amina.a@org.internal', role: 'Learner', department: 'Manufacturing', location: 'Bay A/B', status: 'Active', journeyStage: 'Phase 2 (Continuous)', phase3Selected: true },
  { id: 'u5', name: 'David Kim', email: 'david.k@org.internal', role: 'Manager', department: 'Floor Operations', location: 'Airport Terminal', status: 'Active' },
  { id: 'u6', name: 'Sarah Jenkins', email: 'sarah.j@org.internal', role: 'Manager', department: 'Quality Assurance', location: 'Warehouse North', status: 'Active' },
];

const INITIAL_CAMPAIGNS: CampaignItem[] = [
  { id: 'c1', title: 'Day 1–10 Cleanroom & Safety Baseline', sop: 'Aseptic Hand Hygiene & Gowning', sopId: 'aseptic-hygiene', target: 'New Hires (Day 1–10)', department: 'Cleanroom', location: 'Munich Facility', completion: 94, journeyPhase: 'Phase 1: New Hire (Day 1–10)' },
  { id: 'c2', title: 'High-Touch Disinfection Mandate', sop: 'Room Sanitization & Disinfection', sopId: 'housekeeping_sanitization', target: 'Housekeeping Services (68 Staff)', department: 'Housekeeping', location: 'Bay A/B', completion: 88, journeyPhase: 'Phase 2: Continuous / Mandate' },
  { id: 'c3', title: 'Senior Lead QA & ESD Certification', sop: 'Precision Mechanical Assembly', sopId: 'picking-101', target: 'Admin-Selected Upskilling Cohort', department: 'Assembly', location: 'Bay A/B', completion: 100, journeyPhase: 'Phase 3: Selective Upskilling' },
];

export const getModuleCreationDate = (lesson: Lesson, index: number): string => {
  if (lesson.createdAt) return lesson.createdAt;
  const seedDates = [
    'Oct 14, 2026',
    'Oct 12, 2026',
    'Oct 09, 2026',
    'Oct 05, 2026',
    'Sep 28, 2026',
    'Sep 20, 2026',
    'Sep 15, 2026',
  ];
  return seedDates[index % seedDates.length];
};

export const getModuleAssignedStatus = (lesson: Lesson, campaigns: any[] = []): 'Assigned' | 'Not Assigned' => {
  if (lesson.assignedStatus) return lesson.assignedStatus;
  if (lesson.isAssigned !== undefined) return lesson.isAssigned ? 'Assigned' : 'Not Assigned';
  const assignedInCampaign = Array.isArray(campaigns) && campaigns.some((c) =>
    (c.sop && lesson.title && c.sop.toLowerCase().includes(lesson.title.toLowerCase())) ||
    (c.sop && lesson.title && lesson.title.toLowerCase().includes(c.sop.toLowerCase()))
  );
  const isAssignedCommon = ['housekeeping_sanitization', 'picking-101', 'safety-first'].includes(lesson.id);
  return assignedInCampaign || isAssignedCommon ? 'Assigned' : 'Not Assigned';
};

export default function AdminDashboardView({
  lessons,
  onScanClick,
  onUploadClick,
  onSelectSop,
  onDeleteSop,
  onOpenRoleSwitcher,
  onBackToHome,
}: AdminDashboardViewProps) {
  const [activeViewMode, setActiveViewMode] = useState<AdminViewMode>('landing');
  const [liveAuditLogs, setLiveAuditLogs] = useState<AuditLogEntry[]>([]);

  // Load live audit logs from Firestore database
  React.useEffect(() => {
    getAuditLogs().then((logs) => {
      if (Array.isArray(logs) && logs.length > 0) {
        setLiveAuditLogs(logs);
      }
    }).catch(console.error);
  }, [activeViewMode]);

  // Ensure scroll top on mode switch
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeViewMode]);

  // Search & Filters
  const [contentSearch, setContentSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [userSearch, setUserSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');

  // State arrays
  const [userList, setUserList] = useState<UserItem[]>(() => {
    const phase3Global = localStorage.getItem('guruji_phase3_upskilling_enabled') === 'true';
    return INITIAL_USERS.map((u, idx) =>
      idx === 1 ? { ...u, phase3Selected: phase3Global } : u
    );
  });
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('guruji_admin_campaigns') || 'null');
      return Array.isArray(saved) && saved.length > 0 ? saved : INITIAL_CAMPAIGNS;
    } catch {
      return INITIAL_CAMPAIGNS;
    }
  });

  // Clean Apple-Style Assignment Sub-View & Role/Module State
  const [assignmentSubView, setAssignmentSubView] = useState<AssignmentSubView>('hub');
  const [assignmentRoles, setAssignmentRoles] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('guruji_assignment_roles') || 'null');
      return Array.isArray(saved) && saved.length > 0 ? saved : INITIAL_ASSIGNMENT_ROLES;
    } catch {
      return INITIAL_ASSIGNMENT_ROLES;
    }
  });
  const [selectedAssignmentRole, setSelectedAssignmentRole] = useState<string>(() => {
    return INITIAL_ASSIGNMENT_ROLES[0];
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleNameInput, setNewRoleNameInput] = useState('');

  const [roleModulesMap, setRoleModulesMap] = useState<Record<string, RoleModuleItem[]>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('guruji_role_phase_modules') || 'null');
      return saved && typeof saved === 'object' ? { ...INITIAL_ROLE_MODULES, ...saved } : INITIAL_ROLE_MODULES;
    } catch {
      return INITIAL_ROLE_MODULES;
    }
  });
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [newModuleTitleInput, setNewModuleTitleInput] = useState('');
  const [newModuleSubtitleInput, setNewModuleSubtitleInput] = useState('');
  const [newModuleSopId, setNewModuleSopId] = useState('custom');

  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Learner' | 'Manager' | 'Admin'>('Learner');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserLoc, setNewUserLoc] = useState('Munich Facility');

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // Settings State
  const [minPassScore, setMinPassScore] = useState(85);
  const [maxRetries, setMaxRetries] = useState(3);
  const [strictMode, setStrictMode] = useState(true);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Control Tower Time Filter
  const [timePeriod, setTimePeriod] = useState<string>('Last 30 Days');

  // Quiz Creator State
  const [quizTitleInput, setQuizTitleInput] = useState('');
  const [quizInputType, setQuizInputType] = useState<'upload' | 'paste'>('paste');
  const [quizPastedText, setQuizPastedText] = useState('');
  const [quizSelectedFile, setQuizSelectedFile] = useState<File | null>(null);
  const [quizQuestionType, setQuizQuestionType] = useState<'MCQ' | 'Fill in the Blanks' | 'True/False' | 'Mixed'>('MCQ');
  const [quizNumQuestions, setQuizNumQuestions] = useState<number>(5);
  const [quizPassingScore, setQuizPassingScore] = useState<number>(80);

  const [createdQuizResult, setCreatedQuizResult] = useState<{
    id: string;
    title: string;
    questionType: string;
    numQuestions: number;
    passingScore: number;
    createdDate: string;
    questions: Array<{
      id: number;
      question: string;
      type: string;
      options?: string[];
      correctAnswer: string;
    }>;
  } | null>(null);

  const handleGenerateQuiz = () => {
    sounds.playCorrect();
    const titleToUse = quizTitleInput.trim() || 'Operations & Safety Quiz';
    
    const sampleQuestions: Array<{
      id: number;
      question: string;
      type: string;
      options?: string[];
      correctAnswer: string;
    }> = [];

    const mcqPool = [
      {
        question: "What is the mandatory surface dwell time for hospital-grade disinfectant?",
        options: ["30 Seconds", "2 Minutes", "5 Minutes", "10 Minutes"],
        correctAnswer: "5 Minutes"
      },
      {
        question: "Which PPE item must be donned first before entering cleanroom bays?",
        options: ["Sterile Gloves", "Bouffant Hair Net", "Shoe Covers", "Safety Goggles"],
        correctAnswer: "Shoe Covers"
      },
      {
        question: "How often must high-touch floor surfaces undergo cycle sanitization audits?",
        options: ["Every Shift (8 Hours)", "Daily", "Weekly", "Monthly"],
        correctAnswer: "Every Shift (8 Hours)"
      },
      {
        question: "What action is required if barcode scanner fails 3 consecutive item reads?",
        options: ["Override manually", "Log error & switch scanner unit", "Ignore and skip item", "Restart warehouse terminal"],
        correctAnswer: "Log error & switch scanner unit"
      },
      {
        question: "What is the maximum allowed stack height for Pallet Rack Zone B?",
        options: ["2 Levels", "4 Levels", "6 Levels", "8 Levels"],
        correctAnswer: "4 Levels"
      }
    ];

    const fillPool = [
      {
        question: "High-bay forklift operators must perform a _____ check before every shift.",
        correctAnswer: "pre-operational hydraulic & safety"
      },
      {
        question: "Aseptic hand hygiene scrubbing requires at least _____ seconds with antimicrobial soap.",
        correctAnswer: "60"
      },
      {
        question: "Damaged inventory packages must be routed directly to the _____ quarantine area.",
        correctAnswer: "QA hold"
      },
      {
        question: "Chemical disinfectant containers must be clearly labeled with the _____ date.",
        correctAnswer: "dilution / expiration"
      },
      {
        question: "ESD grounding wrist straps must be tested at the _____ station before line access.",
        correctAnswer: "ESD test"
      }
    ];

    for (let i = 0; i < quizNumQuestions; i++) {
      if (quizQuestionType === 'Fill in the Blanks') {
        const item = fillPool[i % fillPool.length];
        sampleQuestions.push({
          id: i + 1,
          question: item.question,
          type: 'Fill in the Blanks',
          correctAnswer: item.correctAnswer
        });
      } else {
        const item = mcqPool[i % mcqPool.length];
        sampleQuestions.push({
          id: i + 1,
          question: item.question,
          type: 'MCQ',
          options: item.options,
          correctAnswer: item.correctAnswer
        });
      }
    }

    const newQuiz = {
      id: `quiz_${Date.now()}`,
      title: titleToUse,
      sopId: 'general_ops',
      questionType: quizQuestionType,
      numQuestions: sampleQuestions.length,
      passingScore: quizPassingScore,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      questions: sampleQuestions
    };

    saveQuizToFirestore(newQuiz).catch(console.error);
    logAuditEvent('QUIZ_CREATED', `Admin generated quiz '${newQuiz.title}' with ${sampleQuestions.length} questions`, 'admin_user', 'System Admin');

    setCreatedQuizResult(newQuiz);
    showToast(`Quiz '${newQuiz.title}' created & saved to database!`);
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const effectiveLessons = useMemo(() => {
    return Array.isArray(lessons) && lessons.length > 0 ? lessons : INITIAL_LESSONS;
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return effectiveLessons.filter((l) => {
      const matchesSearch =
        (l?.title || '').toLowerCase().includes(contentSearch.toLowerCase()) ||
        ((l?.category || '') && l.category.toLowerCase().includes(contentSearch.toLowerCase()));
      const matchesCategory =
        selectedCategoryFilter === 'All' ||
        (l?.category && l.category.toLowerCase() === selectedCategoryFilter.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [effectiveLessons, contentSearch, selectedCategoryFilter]);

  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.department.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = selectedRoleFilter === 'All' || u.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [userList, userSearch, selectedRoleFilter]);

  const handleExportCSV = () => {
    sounds.playTap();
    const csvContent =
      "Learner Name,Role,Department,Location,Assigned SOP,Score,Status,Timestamp\n" +
      userList
        .map(
          (u) =>
            `"${u.name}","${u.role}","${u.department}","${u.location}","Room Sanitization & Disinfection","94%","Certified","2026-10-16 08:30:00"`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOP_Compliance_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Audit CSV verification record exported.');
  };

  const handleSaveSettings = () => {
    sounds.playTap();
    setSavedSettingsNotice(true);
    showToast('Global settings saved successfully.');
    setTimeout(() => setSavedSettingsNotice(false), 2200);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    sounds.playCorrect();
    const emailToUse =
      newUserEmail.trim() ||
      `${newUserName.toLowerCase().replace(/\s+/g, '.')}@org.internal`;

    const newUser: UserItem = {
      id: `u_${Date.now()}`,
      name: newUserName.trim(),
      email: emailToUse,
      role: newUserRole,
      department: newUserDept.trim() || 'Operations',
      location: newUserLoc,
      status: 'Active',
    };

    setUserList((prev) => [newUser, ...prev]);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserDept('');
    setIsAddUserModalOpen(false);
    showToast(`User '${newUser.name}' created.`);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    sounds.playTap();
    setUserList((prev) => prev.filter((u) => u.id !== userToDelete.id));
    showToast(`User '${userToDelete.name}' deleted.`);
    setUserToDelete(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 pt-4 pb-20 text-white relative z-10 w-full max-w-2xl mx-auto space-y-6 font-sans select-none animate-in fade-in duration-150 bg-black min-h-screen">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1C1C1E] text-white border border-white/20 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-white shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header - Exact Screenshot Style */}
      <header className="flex items-start justify-between gap-4 pt-2 pb-1">
        <div className="space-y-1">
          {activeViewMode !== 'landing' ? (
            <button
              onClick={() => {
                sounds.playTap();
                if (activeViewMode === 'assignments' && assignmentSubView !== 'hub') {
                  setAssignmentSubView('hub');
                  setIsRoleDropdownOpen(false);
                } else {
                  setActiveViewMode('landing');
                }
              }}
              className="text-[11px] font-bold tracking-widest uppercase text-[#8E8E93] hover:text-white flex items-center gap-1 transition-colors cursor-pointer mb-1"
            >
              {activeViewMode === 'assignments' && assignmentSubView !== 'hub'
                ? '← ASSIGNMENTS'
                : '← ADMIN WORKSPACE'}
            </button>
          ) : (
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#8E8E93] block">
              ADMIN WORKSPACE
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {activeViewMode === 'landing'
              ? 'Administration Control Center'
              : activeViewMode === 'users'
              ? 'User Management'
              : activeViewMode === 'settings'
              ? 'Settings'
              : activeViewMode === 'assignments'
              ? assignmentSubView === 'new_hire'
                ? 'New Hire'
                : assignmentSubView === 'continuous'
                ? 'Continuous Learning'
                : assignmentSubView === 'upskilling'
                ? 'Upskilling'
                : 'Assignments'
              : activeViewMode === 'repository'
              ? 'Content Library'
              : activeViewMode === 'reports'
              ? 'Reports & Analytics'
              : activeViewMode === 'quiz'
              ? 'Quiz Management'
              : 'Control Tower'}
          </h1>
          <p className="text-xs text-[#8E8E93] font-normal leading-relaxed">
            {activeViewMode === 'landing'
              ? 'Manage your organisation, content and training.'
              : activeViewMode === 'users'
              ? 'Manage staff roster, roles and access.'
              : activeViewMode === 'settings'
              ? 'Configure global training threshold & retry controls.'
              : activeViewMode === 'assignments'
              ? assignmentSubView === 'new_hire'
                ? 'Day 1 – Day 10 role onboarding modules.'
                : assignmentSubView === 'continuous'
                ? 'Ongoing training and mandatory role modules.'
                : assignmentSubView === 'upskilling'
                ? 'Selective skill progression modules by role.'
                : 'Select a training phase to manage role modules.'
              : activeViewMode === 'repository'
              ? 'Scan, upload and manage SOPs and training content.'
              : activeViewMode === 'reports'
              ? 'Track progress, completion and key insights.'
              : activeViewMode === 'quiz'
              ? 'Upload documents or paste content to generate standalone quizzes.'
              : 'Track progress, completion and key insights.'}
          </p>
        </div>

        {/* Bell Icon & Back to Frontline */}
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {onBackToHome && (
            <button
              onClick={() => {
                sounds.playTap();
                onBackToHome();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white text-xs font-medium cursor-pointer transition-all"
            >
              Back
            </button>
          )}

          <button
            onClick={() => {
              sounds.playTap();
              onOpenRoleSwitcher();
            }}
            className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-white hover:bg-[#2C2C2E] transition-all cursor-pointer"
            title="Switch Role"
          >
            <Bell size={18} />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. LANDING PAGE HUB VIEW                                                   */}
      {/* ========================================================================= */}
      {activeViewMode === 'landing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* A. Primary Navigation Stack (Users, Assignments, Settings) */}
          <div className="space-y-3">
            {/* 1. Users */}
            <div
              onClick={() => {
                sounds.playTap();
                setActiveViewMode('users');
              }}
              className="p-4 sm:p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white tracking-tight">Users</h3>
                  <p className="text-xs text-[#8E8E93] font-normal mt-0.5 truncate">
                    Manage learners, teams and access
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
            </div>

            {/* 2. Assignments */}
            <div
              onClick={() => {
                sounds.playTap();
                setAssignmentSubView('hub');
                setIsRoleDropdownOpen(false);
                setActiveViewMode('assignments');
              }}
              className="p-4 sm:p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
                  <ClipboardList size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white tracking-tight">Assignments</h3>
                  <p className="text-xs text-[#8E8E93] font-normal mt-0.5 truncate">
                    Create and track training assignments
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
            </div>

            {/* 3. Settings */}
            <div
              onClick={() => {
                sounds.playTap();
                setActiveViewMode('settings');
              }}
              className="p-4 sm:p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-white/10 text-[#8E8E93] flex items-center justify-center shrink-0">
                  <Settings size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white tracking-tight">Settings</h3>
                  <p className="text-xs text-[#8E8E93] font-normal mt-0.5 truncate">
                    Configure organisation and preferences
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
            </div>
          </div>

          {/* B. Quick Access Section (Horizontal Cards with Pink/Red Outlines) */}
          <div className="space-y-3 pt-1">
            <h3 className="text-base font-bold text-white tracking-tight px-1">
              Quick Access
            </h3>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
              {/* Card 1: SOP Repository */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('repository');
                }}
                className="p-3 sm:p-4 bg-[#0A0A0C] hover:bg-rose-950/20 rounded-2xl border border-rose-500/50 hover:border-rose-400 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] h-36 shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#1C1C1E] text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0 group-hover:scale-105 transition-transform">
                    <BookOpen size={16} />
                  </div>
                  <ChevronRight size={15} className="text-[#8E8E93] group-hover:text-rose-400 transition-colors" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">SOP Repository</h4>
                  <p className="text-[10px] text-[#8E8E93] font-normal mt-0.5 line-clamp-2">
                    Browse & manage content
                  </p>
                </div>
              </div>

              {/* Card 2: Reports */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('reports');
                }}
                className="p-3 sm:p-4 bg-[#0A0A0C] hover:bg-rose-950/20 rounded-2xl border border-rose-500/50 hover:border-rose-400 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] h-36 shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#1C1C1E] text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0 group-hover:scale-105 transition-transform">
                    <BarChart2 size={16} />
                  </div>
                  <ChevronRight size={15} className="text-[#8E8E93] group-hover:text-rose-400 transition-colors" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">Reports</h4>
                  <p className="text-[10px] text-[#8E8E93] font-normal mt-0.5 line-clamp-2">
                    View progress & analytics
                  </p>
                </div>
              </div>

              {/* Card 3: Quiz */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('quiz');
                }}
                className="p-3 sm:p-4 bg-[#0A0A0C] hover:bg-rose-950/20 rounded-2xl border border-rose-500/50 hover:border-rose-400 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] h-36 shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#1C1C1E] text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0 group-hover:scale-105 transition-transform">
                    <HelpCircle size={16} />
                  </div>
                  <ChevronRight size={15} className="text-[#8E8E93] group-hover:text-rose-400 transition-colors" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">Quiz</h4>
                  <p className="text-[10px] text-[#8E8E93] font-normal mt-0.5 line-clamp-2">
                    Upload or paste to create
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* C. Recent Activity Feed */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                Recent Activity
              </h3>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('reports');
                }}
                className="text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
              {liveAuditLogs.length > 0 ? (
                liveAuditLogs.slice(0, 5).map((log, idx) => (
                  <div key={log.id || idx} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shrink-0 border border-white/10">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-white truncate">{log.action.replace(/_/g, ' ')}</h5>
                        <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">{log.details}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#8E8E93] shrink-0">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shrink-0 border border-white/10">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-white truncate">New SOP uploaded</h5>
                        <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">Aircraft Turnaround Safety SOP</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#8E8E93] shrink-0">2h ago</span>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shrink-0 border border-white/10">
                        <Users size={16} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-white truncate">12 users assigned</h5>
                        <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">Ground Operations Team</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#8E8E93] shrink-0">4h ago</span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USER MANAGEMENT SUB-PAGE                                                */}
      {/* ========================================================================= */}
      {activeViewMode === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search staff by name or department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <button
              onClick={() => {
                sounds.playTap();
                setIsAddUserModalOpen(true);
              }}
              className="h-11 px-5 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <span>+ Add User</span>
            </button>
          </div>

          {/* Info Banner on Phase 3 Selective Upskilling Control */}
          <div className="p-3.5 rounded-2xl bg-[#0A0A0C] border border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="text-[#8E8E93]">
              <strong className="text-white">Learning Journey Control:</strong> New hires start in <span className="text-white">Phase 1 (Day 1–10)</span> and move to <span className="text-white">Phase 2 (Continuous)</span>. Use the toggle on any Learner row below to unlock <span className="text-sky-400 font-semibold">Phase 3 Upskilling</span> for that employee.
            </div>
          </div>

          <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8E8E93]">
                No staff found matching query.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{u.name}</span>
                      {u.role === 'Learner' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#8E8E93]">
                          {u.journeyStage || 'Phase 1 (Day 1–10)'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-[#8E8E93] block truncate mt-0.5">
                      {u.email} · {u.department}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {u.role === 'Learner' && (
                      <button
                        onClick={() => {
                          sounds.playTap();
                          const nextState = !u.phase3Selected;
                          setUserList((prev) =>
                            prev.map((item) =>
                              item.id === u.id ? { ...item, phase3Selected: nextState } : item
                            )
                          );
                          localStorage.setItem('guruji_phase3_upskilling_enabled', String(nextState));
                          logAuditEvent(
                            nextState ? 'PHASE3_UPSKILLING_UNLOCKED' : 'PHASE3_UPSKILLING_LOCKED',
                            `Admin ${nextState ? 'unlocked' : 'locked'} Phase 3 Selective Upskilling for ${u.name}`,
                            'admin_user',
                            'System Admin'
                          );
                          showToast(
                            nextState
                              ? `Phase 3 Upskilling unlocked for ${u.name}!`
                              : `Phase 3 Upskilling locked for ${u.name}.`
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                          u.phase3Selected
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-[#1C1C1E] hover:bg-white/10 text-[#8E8E93] hover:text-white border-white/10'
                        }`}
                        title="Toggle Phase 3 Selective Upskilling in Employee Learning Journey"
                      >
                        {u.phase3Selected ? '★ Phase 3 Upskilling: Unlocked' : 'Unlock Phase 3 Upskilling'}
                      </button>
                    )}

                    <span className="text-xs font-medium text-slate-300 bg-[#1C1C1E] px-3 py-1 rounded-full text-center min-w-[70px]">
                      {u.role}
                    </span>

                    <button
                      onClick={() => {
                        sounds.playTap();
                        setUserToDelete(u);
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-[#8E8E93] hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SETTINGS SUB-PAGE                                                       */}
      {/* ========================================================================= */}
      {activeViewMode === 'settings' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          <div className="p-5 bg-[#0A0A0C] rounded-2xl border border-white/10 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Global Training & Safety Controls</h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Pass threshold (85%), retry limits, and strict safety breach controls.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-xs shrink-0 cursor-pointer transition-all"
            >
              Save Settings
            </button>
          </div>

          <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">Global Passing Score Threshold</h4>
                <p className="text-xs text-[#8E8E93]">
                  Solo Test Me score required for certification (Preset: 85%).
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="60"
                  max="100"
                  value={minPassScore}
                  onChange={(e) => setMinPassScore(Number(e.target.value))}
                  className="w-20 h-10 rounded-xl bg-[#1C1C1E] border border-white/10 text-center text-xs font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-xs font-bold text-white">%</span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">Assessment Retry Limits</h4>
                <p className="text-xs text-[#8E8E93]">
                  Attempts allowed before triggering supervisor observation.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      sounds.playTap();
                      setMaxRetries(num);
                    }}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      maxRetries === num
                        ? 'bg-white text-black font-bold'
                        : 'bg-[#1C1C1E] border border-white/10 text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">Strict Safety Breach Lockdown</h4>
                <p className="text-xs text-[#8E8E93]">
                  Instant failure if any critical safety control gate is violated.
                </p>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setStrictMode(!strictMode);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  strictMode
                    ? 'bg-white text-black'
                    : 'bg-[#1C1C1E] border border-white/10 text-[#8E8E93]'
                }`}
              >
                {strictMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ASSIGNMENTS SUB-PAGE (CLEAN APPLE-STYLE HUB & ROLE MODULE MANAGER)     */}
      {/* ========================================================================= */}
      {activeViewMode === 'assignments' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {assignmentSubView === 'hub' ? (
            /* --------------------------------------------------------------------- */
            /* 4A. ASSIGNMENTS LANDING HUB (VERY CLEAN STACK - NO MESSY TEXT)        */
            /* --------------------------------------------------------------------- */
            <div className="space-y-3">
              {/* 1. New Hire */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setAssignmentSubView('new_hire');
                  setIsRoleDropdownOpen(false);
                }}
                className="p-4 sm:p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
                    <UserPlus size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white tracking-tight">New Hire</h3>
                    <p className="text-xs text-[#8E8E93] font-normal mt-0.5 truncate">
                      Day 1 – Day 10 onboarding modules
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
              </div>

              {/* 2. Continuous Learning */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setAssignmentSubView('continuous');
                  setIsRoleDropdownOpen(false);
                }}
                className="p-4 sm:p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white tracking-tight">Continuous Learning</h3>
                    <p className="text-xs text-[#8E8E93] font-normal mt-0.5 truncate">
                      Ongoing training and mandatory procedures
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
              </div>

              {/* 3. Upskilling */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setAssignmentSubView('upskilling');
                  setIsRoleDropdownOpen(false);
                }}
                className="p-4 sm:p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Award size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white tracking-tight">Upskilling</h3>
                    <p className="text-xs text-[#8E8E93] font-normal mt-0.5 truncate">
                      Selective skill progression modules
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
              </div>
            </div>
          ) : (
            /* --------------------------------------------------------------------- */
            /* 4B. PHASE SUB-SCREEN (NEW HIRE / CONTINUOUS / UPSKILLING)             */
            /*     Apple-Style Role Dropdown + Clean Modules List                    */
            /* --------------------------------------------------------------------- */
            (() => {
              const activeRole = assignmentRoles.includes(selectedAssignmentRole)
                ? selectedAssignmentRole
                : assignmentRoles[0] || 'General Operator';
              const phaseKey = `${assignmentSubView}__${activeRole}`;
              const currentModules = roleModulesMap[phaseKey] || [];

              const handleDeleteCurrentRole = (roleToRemove: string) => {
                if (assignmentRoles.length <= 1) {
                  showToast('At least one role must remain.');
                  return;
                }
                sounds.playTap();
                const updatedRoles = assignmentRoles.filter((r) => r !== roleToRemove);
                setAssignmentRoles(updatedRoles);
                localStorage.setItem('guruji_assignment_roles', JSON.stringify(updatedRoles));
                if (activeRole === roleToRemove) {
                  setSelectedAssignmentRole(updatedRoles[0]);
                }
                setIsRoleDropdownOpen(false);
                showToast(`Role '${roleToRemove}' deleted.`);
              };

              const handleDeleteModule = (moduleId: string, moduleTitle: string) => {
                sounds.playTap();
                const updatedList = currentModules.filter((m) => m.id !== moduleId);
                const nextMap = { ...roleModulesMap, [phaseKey]: updatedList };
                setRoleModulesMap(nextMap);
                localStorage.setItem('guruji_role_phase_modules', JSON.stringify(nextMap));
                showToast(`Removed '${moduleTitle}'.`);
              };

              return (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* STEP 1: APPLE-STYLE ROLE SELECTOR + CREATE / DELETE ROLE */}
                  <div className="space-y-2.5 relative">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
                        Role
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setNewRoleNameInput('');
                            setIsCreateRoleModalOpen(true);
                            setIsRoleDropdownOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>New Role</span>
                        </button>

                        {assignmentRoles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCurrentRole(activeRole)}
                            className="p-1.5 rounded-xl bg-[#1C1C1E] hover:bg-rose-500/20 border border-white/10 text-[#8E8E93] hover:text-rose-400 transition-all cursor-pointer"
                            title={`Delete ${activeRole}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Apple-Style Glass Dropdown Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setIsRoleDropdownOpen((prev) => !prev);
                      }}
                      className="w-full p-4 rounded-2xl bg-[#1C1C1E]/90 hover:bg-[#242428] backdrop-blur-xl border border-white/15 flex items-center justify-between text-left transition-all cursor-pointer shadow-lg"
                    >
                      <div className="min-w-0">
                        <span className="text-base font-bold text-white block truncate">
                          {activeRole}
                        </span>
                        <span className="text-xs text-[#8E8E93] block mt-0.5">
                          {currentModules.length} {currentModules.length === 1 ? 'module' : 'modules'} assigned
                        </span>
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93] transition-transform duration-200 ${
                          isRoleDropdownOpen ? 'rotate-180 text-white' : ''
                        }`}
                      >
                        <ChevronDown size={16} />
                      </div>
                    </button>

                    {/* Apple-Style Glass Dropdown Popover List */}
                    {isRoleDropdownOpen && (
                      <div className="w-full rounded-2xl bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/15 shadow-2xl divide-y divide-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-30">
                        <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                          {assignmentRoles.map((roleItem) => {
                            const isSelected = roleItem === activeRole;
                            const count = (roleModulesMap[`${assignmentSubView}__${roleItem}`] || []).length;
                            return (
                              <div
                                key={roleItem}
                                onClick={() => {
                                  sounds.playTap();
                                  setSelectedAssignmentRole(roleItem);
                                  setIsRoleDropdownOpen(false);
                                }}
                                className={`px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'bg-white text-black'
                                        : 'border border-white/20 text-transparent'
                                    }`}
                                  >
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-sm font-bold text-white block truncate">
                                      {roleItem}
                                    </span>
                                    <span className="text-[11px] text-[#8E8E93] block">
                                      {count} {count === 1 ? 'module' : 'modules'}
                                    </span>
                                  </div>
                                </div>

                                {assignmentRoles.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCurrentRole(roleItem);
                                    }}
                                    className="p-1.5 rounded-lg text-[#8E8E93] hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer shrink-0"
                                    title={`Delete ${roleItem}`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setNewRoleNameInput('');
                            setIsRoleDropdownOpen(false);
                            setIsCreateRoleModalOpen(true);
                          }}
                          className="w-full px-4 py-3 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Create New Role</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: CLEAN MODULES LIST FOR SELECTED ROLE */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
                        Modules ({currentModules.length})
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setNewModuleTitleInput('');
                          setNewModuleSubtitleInput(
                            assignmentSubView === 'new_hire'
                              ? 'Day 1–10 · Core SOP'
                              : assignmentSubView === 'continuous'
                              ? 'Ongoing · Mandatory'
                              : 'Selective Upskilling'
                          );
                          setNewModuleSopId('custom');
                          setIsAddModuleModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Plus size={14} />
                        <span>Add Module</span>
                      </button>
                    </div>

                    {currentModules.length === 0 ? (
                      <div className="p-8 bg-[#0A0A0C] rounded-2xl border border-white/10 text-center space-y-3">
                        <p className="text-xs text-[#8E8E93]">
                          No modules assigned to <strong className="text-white">{activeRole}</strong> yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playTap();
                            setNewModuleTitleInput('');
                            setNewModuleSubtitleInput(
                              assignmentSubView === 'new_hire'
                                ? 'Day 1–10 · Core SOP'
                                : assignmentSubView === 'continuous'
                                ? 'Ongoing · Mandatory'
                                : 'Selective Upskilling'
                            );
                            setNewModuleSopId('custom');
                            setIsAddModuleModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus size={14} />
                          <span>Add First Module</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
                        {currentModules.map((mod, idx) => (
                          <div
                            key={mod.id}
                            className="p-4 flex items-center justify-between gap-3.5 hover:bg-white/[0.02] transition-colors"
                          >
                            <div
                              onClick={() => {
                                if (mod.sopId) {
                                  sounds.playTap();
                                  onSelectSop(mod.sopId, mod.title);
                                }
                              }}
                              className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                            >
                              <div className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-white/10 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-white truncate">
                                  {mod.title}
                                </h4>
                                <p className="text-xs text-[#8E8E93] truncate mt-0.5">
                                  {mod.subtitle}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteModule(mod.id, mod.title)}
                              className="p-2 rounded-xl text-[#8E8E93] hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer shrink-0"
                              title="Delete Module"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REPORTS & CONTROL TOWER (EXACT REPLICA OF Screenshot 8.26.34 PM)         */}
      {/* ========================================================================= */}
      {(activeViewMode === 'reports' || activeViewMode === 'control_tower') && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Action Row: Export CSV & Time Period Dropdown (No duplicate title) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
              REPORTS & ANALYTICS
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                title="Export CSV Audit Log"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>

              <div className="relative">
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="appearance-none h-9 pl-3.5 pr-8 rounded-xl bg-[#1C1C1E] border border-white/10 text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Year to Date">Year to Date</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4 Equal Top Cards Row (Total Users, Completed, In Progress, Not Started) */}
          <div className="grid grid-cols-4 gap-2.5">
            {/* Card 1 */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-[#0A0A0C] flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono block leading-none">
                245
              </span>
              <span className="text-[11px] text-[#8E8E93] font-medium mt-1.5 block truncate">
                Total Users
              </span>
            </div>

            {/* Card 2 */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-[#0A0A0C] flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono block leading-none">
                198
              </span>
              <span className="text-[11px] text-[#8E8E93] font-medium mt-1.5 block truncate">
                Completed <span className="text-[#8E8E93] font-normal">(81%)</span>
              </span>
            </div>

            {/* Card 3 */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-[#0A0A0C] flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono block leading-none">
                32
              </span>
              <span className="text-[11px] text-[#8E8E93] font-medium mt-1.5 block truncate">
                In Progress <span className="text-[#8E8E93] font-normal">(13%)</span>
              </span>
            </div>

            {/* Card 4 */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-[#0A0A0C] flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono block leading-none">
                15
              </span>
              <span className="text-[11px] text-[#8E8E93] font-medium mt-1.5 block truncate">
                Not Started <span className="text-[#8E8E93] font-normal">(6%)</span>
              </span>
            </div>
          </div>

          {/* Section 1: Completion Rate Card with Donut Chart */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0A0A0C] space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Completion Rate</h3>

            <div className="flex items-center gap-6 sm:gap-10 pt-1">
              {/* High-Fidelity Donut Ring */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Ring */}
                  <path
                    className="text-[#2C2C2E]"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Arc Segment (81% Completed) */}
                  <path
                    className="text-white"
                    strokeDasharray="81, 100"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-white font-mono">81%</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                    <span className="text-slate-200 font-medium">Completed</span>
                  </div>
                  <span className="font-mono font-bold text-white">198</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8E8E93] shrink-0" />
                    <span className="text-slate-200 font-medium">In Progress</span>
                  </div>
                  <span className="font-mono font-bold text-white">32</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3A3A3C] shrink-0" />
                    <span className="text-slate-200 font-medium">Not Started</span>
                  </div>
                  <span className="font-mono font-bold text-white">15</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Training by Category Card */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0A0A0C] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Training by Category</h3>
              <button className="text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors cursor-pointer">
                View All
              </button>
            </div>

            <div className="space-y-3.5 text-xs pt-1">
              {/* Safety */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-200 font-medium w-32 shrink-0">Safety</span>
                <div className="flex-1 bg-[#2C2C2E] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full rounded-full" style={{ width: '92%' }} />
                </div>
                <span className="font-mono font-bold text-white w-10 text-right shrink-0">92%</span>
              </div>

              {/* Operations */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-200 font-medium w-32 shrink-0">Operations</span>
                <div className="flex-1 bg-[#2C2C2E] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full rounded-full" style={{ width: '78%' }} />
                </div>
                <span className="font-mono font-bold text-white w-10 text-right shrink-0">78%</span>
              </div>

              {/* Customer Service */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-200 font-medium w-32 shrink-0">Customer Service</span>
                <div className="flex-1 bg-[#2C2C2E] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full rounded-full" style={{ width: '84%' }} />
                </div>
                <span className="font-mono font-bold text-white w-10 text-right shrink-0">84%</span>
              </div>

              {/* Compliance */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-200 font-medium w-32 shrink-0">Compliance</span>
                <div className="flex-1 bg-[#2C2C2E] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full rounded-full" style={{ width: '70%' }} />
                </div>
                <span className="font-mono font-bold text-white w-10 text-right shrink-0">70%</span>
              </div>
            </div>
          </div>

          {/* Section 3: Recent Performance Container (Zero Nested Inner Cards) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-white tracking-tight">Recent Performance</h3>
              <button className="text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors cursor-pointer">
                View All
              </button>
            </div>

            <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
              {/* Row 1: Completion rate increased */}
              <div className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#0F291E] border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">Completion rate increased</h5>
                    <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">Compared to previous 30 days</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400 font-mono shrink-0">+12%</span>
              </div>

              {/* Row 2: 5 teams achieved 100% */}
              <div className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">5 teams achieved 100%</h5>
                    <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">Ground Ops, Cabin Crew, Finance...</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#8E8E93] shrink-0" />
              </div>

              {/* Row 3: 15 learners overdue */}
              <div className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">15 learners overdue</h5>
                    <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">Require follow-up</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#8E8E93] shrink-0" />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REPOSITORY SUB-PAGE                                                    */}
      {/* ========================================================================= */}
      {activeViewMode === 'repository' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                sounds.playTap();
                onScanClick();
              }}
              className="py-3 px-4 rounded-xl border border-white/20 bg-[#0A0A0C] hover:bg-[#121215] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Camera size={16} />
              <span>Scan SOP</span>
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                onUploadClick();
              }}
              className="py-3 px-4 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all"
            >
              <Upload size={16} />
              <span>Upload SOP</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search SOPs..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Safety">Safety</option>
              <option value="Operations">Operations</option>
              <option value="Compliance">Compliance</option>
              <option value="Customer Service">Customer Service</option>
            </select>
          </div>

          <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectSop(lesson.id, lesson.title);
                }}
                className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#1C1C1E] text-slate-300">
                      {lesson.category || 'SAFETY'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{lesson.title}</h4>
                  <p className="text-xs text-[#8E8E93] line-clamp-1">{lesson.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onDeleteSop && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playTap();
                        if (confirm(`Delete '${lesson.title}'?`)) {
                          onDeleteSop(lesson.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <ChevronRight size={16} className="text-[#8E8E93]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUIZ VIEW (Creation Form & Simple Quiz Layout After Creation)              */}
      {/* ========================================================================= */}
      {activeViewMode === 'quiz' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {createdQuizResult ? (
            /* SIMPLE QUIZ LAYOUT AFTER CREATION */
            <div className="space-y-5">
              {/* Top Banner / Confirmation */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Quiz Generated Successfully</h4>
                    <p className="text-[11px] text-emerald-300/80">Ready for review or deployment to frontline learners</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setCreatedQuizResult(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  Create Another
                </button>
              </div>

              {/* Quiz Summary Header Card */}
              <div className="p-5 bg-[#0A0A0C] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">
                      {createdQuizResult.questionType}
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-1.5">{createdQuizResult.title}</h2>
                    <p className="text-xs text-[#8E8E93] mt-0.5">Created on {createdQuizResult.createdDate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-white">{createdQuizResult.numQuestions}</div>
                    <div className="text-[10px] font-semibold text-[#8E8E93] uppercase">Questions</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Award size={14} className="text-amber-400" />
                    <span>Passing Score: <strong className="text-white">{createdQuizResult.passingScore}%</strong></span>
                  </span>
                  <span className="text-[11px] text-slate-400">Status: <strong className="text-emerald-400 font-bold">Active Draft</strong></span>
                </div>
              </div>

              {/* Simple Quiz Layout: Questions List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] px-1">
                  Generated Questions ({createdQuizResult.questions.length})
                </h3>

                <div className="space-y-3">
                  {createdQuizResult.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-[#0A0A0C] border border-white/10 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold text-white shrink-0 bg-[#1C1C1E] px-2.5 py-1 rounded-lg border border-white/10">
                          Q{idx + 1}
                        </span>
                        <p className="text-sm font-semibold text-white flex-1 leading-snug">
                          {q.question}
                        </p>
                      </div>

                      {/* Options or Answer Key */}
                      {q.options && q.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = opt === q.correctAnswer;
                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                                    : 'bg-[#1C1C1E] border-white/10 text-slate-300'
                                }`}
                              >
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                {isCorrect && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="pl-8 text-xs text-slate-300 bg-[#1C1C1E] p-3 rounded-xl border border-white/10 flex items-center justify-between">
                          <span className="text-slate-400">Answer Key:</span>
                          <span className="font-bold text-emerald-400">{q.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setCreatedQuizResult(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Create Another Quiz
                </button>
                <button
                  onClick={() => {
                    sounds.playCorrect();
                    showToast(`Quiz '${createdQuizResult.title}' saved to Frontline standalone quizzes.`);
                    setActiveViewMode('landing');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-slate-100 font-bold text-xs cursor-pointer shadow-lg transition-all"
                >
                  Save & Deploy Quiz
                </button>
              </div>
            </div>
          ) : (
            /* CREATION FORM (Upload or Copy Paste Option & Settings) */
            <div className="space-y-5">
              {/* Card 1: Input Option (Upload or Copy Paste) */}
              <div className="p-5 bg-[#0A0A0C] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <HelpCircle size={16} className="text-amber-400" />
                    <span>Select Source Input Method</span>
                  </h3>
                  <span className="text-[11px] text-[#8E8E93]">Upload or paste text</span>
                </div>

                {/* Input Method Segmented Toggle */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#1C1C1E] rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setQuizInputType('upload');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      quizInputType === 'upload'
                        ? 'bg-white text-black shadow-sm font-extrabold'
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <Upload size={14} />
                    <span>Upload Option</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setQuizInputType('paste');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      quizInputType === 'paste'
                        ? 'bg-white text-black shadow-sm font-extrabold'
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Copy / Paste Option</span>
                  </button>
                </div>

                {/* File Upload UI */}
                {quizInputType === 'upload' && (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <label className="text-xs text-[#8E8E93] block font-medium">Upload Quiz Document or SOP File</label>
                    <div
                      onClick={() => {
                        sounds.playTap();
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.docx,.txt,.csv';
                        input.onchange = (e: any) => {
                          if (e.target.files && e.target.files[0]) {
                            setQuizSelectedFile(e.target.files[0]);
                            if (!quizTitleInput) {
                              setQuizTitleInput(e.target.files[0].name.replace(/\.[^/.]+$/, "") + " Quiz");
                            }
                            showToast(`File '${e.target.files[0].name}' attached.`);
                          }
                        };
                        input.click();
                      }}
                      className="p-6 border-2 border-dashed border-white/20 hover:border-white/40 bg-[#121215] hover:bg-[#1A1A1F] rounded-xl text-center cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-semibold text-white">
                        {quizSelectedFile ? quizSelectedFile.name : 'Click to select PDF, DOCX, TXT, or CSV'}
                      </p>
                      <p className="text-[11px] text-[#8E8E93]">
                        {quizSelectedFile ? `${(quizSelectedFile.size / 1024).toFixed(1)} KB uploaded` : 'Automatic question extraction engine ready'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Paste Option UI */}
                {quizInputType === 'paste' && (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <label className="text-xs text-[#8E8E93] block font-medium">Paste SOP Text, Questions or Guidelines</label>
                    <textarea
                      rows={4}
                      value={quizPastedText}
                      onChange={(e) => setQuizPastedText(e.target.value)}
                      placeholder="Paste training notes, SOP rules, or raw question list here..."
                      className="w-full p-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30 resize-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Card 2: Quiz Settings */}
              <div className="p-5 bg-[#0A0A0C] border border-white/10 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Settings size={16} className="text-indigo-400" />
                  <span>Quiz Settings</span>
                </h3>

                <div className="space-y-3.5">
                  {/* Title */}
                  <div>
                    <label className="text-xs text-[#8E8E93] block mb-1 font-medium">Quiz Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Room Sanitization & Dwell Time Drill"
                      value={quizTitleInput}
                      onChange={(e) => setQuizTitleInput(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white focus:outline-none focus:border-white/30 font-medium"
                    />
                  </div>

                  {/* Generic Settings: Question Type & Num Questions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Question Type */}
                    <div>
                      <label className="text-xs text-[#8E8E93] block mb-1 font-medium">Question Format</label>
                      <select
                        value={quizQuestionType}
                        onChange={(e) => setQuizQuestionType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white focus:outline-none cursor-pointer font-medium"
                      >
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="Fill in the Blanks">Fill in the Blanks</option>
                        <option value="True/False">True / False</option>
                        <option value="Mixed">Mixed Questions</option>
                      </select>
                    </div>

                    {/* Number of Questions */}
                    <div>
                      <label className="text-xs text-[#8E8E93] block mb-1 font-medium">Number of Questions</label>
                      <select
                        value={quizNumQuestions}
                        onChange={(e) => setQuizNumQuestions(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white focus:outline-none cursor-pointer font-medium"
                      >
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                      </select>
                    </div>
                  </div>

                  {/* Passing Threshold */}
                  <div>
                    <label className="text-xs text-[#8E8E93] block mb-1 font-medium">
                      Passing Score Threshold ({quizPassingScore}%)
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={quizPassingScore}
                      onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Generate Quiz CTA */}
              <button
                type="button"
                onClick={handleGenerateQuiz}
                className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
              >
                <Plus size={18} />
                <span>Create Quiz</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD USER                                                         */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0A0A0C] border border-white/15 rounded-2xl p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Add Staff Member</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1C1C1E] flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. maya.l@org.internal"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Learner">Learner</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Housekeeping Services"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-md"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DELETE USER CONFIRMATION                                        */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0A0A0C] border border-white/15 rounded-2xl p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white">Delete User</h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">{userToDelete.name}</span> ({userToDelete.role}, {userToDelete.department})?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-[#8E8E93] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs cursor-pointer hover:bg-slate-100"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW ROLE (APPLE STYLE)                                    */}
      {/* ========================================================================= */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0A0A0C] border border-white/15 rounded-2xl p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">New Role</h3>
              <button
                type="button"
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1C1C1E] flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = newRoleNameInput.trim();
                if (!trimmed) return;
                if (assignmentRoles.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
                  showToast('Role already exists.');
                  return;
                }
                sounds.playCorrect();
                const updatedRoles = [...assignmentRoles, trimmed];
                setAssignmentRoles(updatedRoles);
                localStorage.setItem('guruji_assignment_roles', JSON.stringify(updatedRoles));
                setSelectedAssignmentRole(trimmed);
                setIsCreateRoleModalOpen(false);
                setNewRoleNameInput('');
                showToast(`Role '${trimmed}' created.`);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-[#8E8E93] block mb-1.5">Role Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Line Supervisor"
                  value={newRoleNameInput}
                  onChange={(e) => setNewRoleNameInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-md"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD MODULE TO SELECTED ROLE (APPLE STYLE)                        */}
      {/* ========================================================================= */}
      {isAddModuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0A0A0C] border border-white/15 rounded-2xl p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">Add Module</h3>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  {selectedAssignmentRole}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModuleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1C1C1E] flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selectedSop = effectiveLessons.find((l) => l.id === newModuleSopId);
                const finalTitle =
                  newModuleTitleInput.trim() ||
                  selectedSop?.title ||
                  'Standard Operating Procedure';
                const finalSubtitle =
                  newModuleSubtitleInput.trim() ||
                  (assignmentSubView === 'new_hire'
                    ? 'Day 1–10 · Core SOP'
                    : assignmentSubView === 'continuous'
                    ? 'Ongoing · Mandatory'
                    : 'Selective Upskilling');

                sounds.playCorrect();
                const activeRole = assignmentRoles.includes(selectedAssignmentRole)
                  ? selectedAssignmentRole
                  : assignmentRoles[0] || 'General Operator';
                const phaseKey = `${assignmentSubView}__${activeRole}`;
                const existing = roleModulesMap[phaseKey] || [];

                const newItem: RoleModuleItem = {
                  id: `mod_${Date.now()}`,
                  title: finalTitle,
                  subtitle: finalSubtitle,
                  sopId: selectedSop?.id || 'picking-101',
                };

                const nextMap = {
                  ...roleModulesMap,
                  [phaseKey]: [...existing, newItem],
                };
                setRoleModulesMap(nextMap);
                localStorage.setItem('guruji_role_phase_modules', JSON.stringify(nextMap));

                // Also sync with Employee Learning Journey campaigns
                const mappedPhase: JourneyPhaseType =
                  assignmentSubView === 'new_hire'
                    ? 'Phase 1: New Hire (Day 1–10)'
                    : assignmentSubView === 'continuous'
                    ? 'Phase 2: Continuous / Mandate'
                    : 'Phase 3: Selective Upskilling';

                const newCamp: CampaignItem = {
                  id: `c_${Date.now()}`,
                  title: finalTitle,
                  sop: `${activeRole} · ${finalSubtitle}`,
                  sopId: newItem.sopId,
                  target: activeRole,
                  department: activeRole,
                  location: 'All Facilities',
                  completion: 0,
                  journeyPhase: mappedPhase,
                };
                const updatedCamps = [newCamp, ...campaigns];
                setCampaigns(updatedCamps);
                localStorage.setItem('guruji_admin_campaigns', JSON.stringify(updatedCamps));

                setIsAddModuleModalOpen(false);
                setNewModuleTitleInput('');
                showToast(`Added '${finalTitle}' to ${activeRole}.`);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Select from SOP Library</label>
                <select
                  value={newModuleSopId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewModuleSopId(val);
                    const found = effectiveLessons.find((l) => l.id === val);
                    if (found) {
                      setNewModuleTitleInput(found.title);
                    }
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="custom">Custom Module Title...</option>
                  {effectiveLessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Module Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aseptic Gowning & Airlock Protocol"
                  value={newModuleTitleInput}
                  onChange={(e) => setNewModuleTitleInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#8E8E93] block mb-1">Details / Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. Day 1–3 · Core SOP"
                  value={newModuleSubtitleInput}
                  onChange={(e) => setNewModuleSubtitleInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#1C1C1E] border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-md"
                >
                  Add Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
