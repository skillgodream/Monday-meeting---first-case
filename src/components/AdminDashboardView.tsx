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
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Lesson } from '../types';
import { INITIAL_LESSONS } from '../data/lessonsData';
import { sounds } from '../utils/audio';

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
  | 'control_tower';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Learner' | 'Manager';
  department: string;
  location: string;
  status: 'Active' | 'Inactive';
}

export interface CampaignItem {
  id: string;
  title: string;
  sop: string;
  target: string;
  department: string;
  location: string;
  completion: number;
}

const INITIAL_USERS: UserItem[] = [
  { id: 'u1', name: 'Vikram Sharma', email: 'vikram.s@org.internal', role: 'Admin', department: 'Executive Operations', location: 'Munich Facility', status: 'Active' },
  { id: 'u2', name: 'Priya Patel', email: 'priya.p@org.internal', role: 'Learner', department: 'Cleanroom', location: 'Munich Facility', status: 'Active' },
  { id: 'u3', name: 'Carlos Mendez', email: 'carlos.m@org.internal', role: 'Learner', department: 'Housekeeping', location: 'Bay A/B', status: 'Active' },
  { id: 'u4', name: 'Amina Al-Mansoor', email: 'amina.a@org.internal', role: 'Learner', department: 'Manufacturing', location: 'Bay A/B', status: 'Active' },
  { id: 'u5', name: 'David Kim', email: 'david.k@org.internal', role: 'Manager', department: 'Assembly', location: 'Airport Terminal', status: 'Active' },
  { id: 'u6', name: 'Sarah Jenkins', email: 'sarah.j@org.internal', role: 'Manager', department: 'Quality Assurance', location: 'Warehouse North', status: 'Active' },
];

const INITIAL_CAMPAIGNS: CampaignItem[] = [
  { id: 'c1', title: 'Q4 Cleanroom Sterilization Protocol', sop: 'Aseptic Hand Hygiene & Gowning', target: 'Cleanroom Division (42 Staff)', department: 'Cleanroom', location: 'Munich Facility', completion: 94 },
  { id: 'c2', title: 'High-Touch Disinfection Mandate', sop: 'Room Sanitization & Disinfection', target: 'Housekeeping Services (68 Staff)', department: 'Housekeeping', location: 'Bay A/B', completion: 88 },
  { id: 'c3', title: 'ESD Assembly Line Re-Certification', sop: 'Precision Mechanical Assembly', target: 'Assembly Technicians (32 Staff)', department: 'Assembly', location: 'Bay A/B', completion: 100 },
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

export const getModuleAssignedStatus = (lesson: Lesson, campaigns: CampaignItem[]): 'Assigned' | 'Not Assigned' => {
  if (lesson.assignedStatus) return lesson.assignedStatus;
  if (lesson.isAssigned !== undefined) return lesson.isAssigned ? 'Assigned' : 'Not Assigned';
  const assignedInCampaign = campaigns.some((c) =>
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

  // Ensure scroll is at top when view changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeViewMode]);

  // Search & Filter States
  const [contentSearch, setContentSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [userSearch, setUserSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');

  // State data arrays
  const [userList, setUserList] = useState<UserItem[]>(INITIAL_USERS);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);

  // User Management Modals State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Learner' | 'Manager' | 'Admin'>('Learner');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserLoc, setNewUserLoc] = useState('Munich Facility');

  // Delete User Modal State
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // Campaign Modal State
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignSop, setNewCampaignSop] = useState('');
  const [newCampaignTarget, setNewCampaignTarget] = useState('');
  const [newCampaignDept, setNewCampaignDept] = useState('Cleanroom');

  // Global System Settings State
  const [minPassScore, setMinPassScore] = useState(85);
  const [maxRetries, setMaxRetries] = useState(3);
  const [strictMode, setStrictMode] = useState(true);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Control Tower Filter States
  const [selectedTowerDept, setSelectedTowerDept] = useState<string>('All');
  const [selectedTowerLoc, setSelectedTowerLoc] = useState<string>('All');
  const [timePeriod, setTimePeriod] = useState<string>('Last 30 Days');

  // Action Notification Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lessons fallback
  const effectiveLessons = useMemo(() => {
    return Array.isArray(lessons) && lessons.length > 0 ? lessons : INITIAL_LESSONS;
  }, [lessons]);

  // Filtered SOP Lessons
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

  // Filtered Users
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

  // Department Breakdown for Control Tower
  const departmentMetrics = useMemo(() => {
    const depts = [
      { name: 'Cleanroom', total: 42, completed: 39, rate: 92 },
      { name: 'Housekeeping', total: 68, completed: 53, rate: 78 },
      { name: 'Assembly', total: 32, completed: 32, rate: 100 },
      { name: 'Manufacturing', total: 55, completed: 46, rate: 84 },
      { name: 'Quality Assurance', total: 24, completed: 21, rate: 87 },
      { name: 'Executive Ops', total: 10, completed: 10, rate: 100 },
    ];
    if (selectedTowerDept === 'All') return depts;
    return depts.filter((d) => d.name.toLowerCase() === selectedTowerDept.toLowerCase());
  }, [selectedTowerDept]);

  // Handlers
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
    showToast('Audit-Ready CSV Report downloaded successfully.');
  };

  const handleSaveSettings = () => {
    sounds.playTap();
    setSavedSettingsNotice(true);
    showToast('Global training parameters updated across organization.');
    setTimeout(() => setSavedSettingsNotice(false), 2500);
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
    showToast(`User '${newUser.name}' added as ${newUser.role}.`);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    sounds.playTap();
    setUserList((prev) => prev.filter((u) => u.id !== userToDelete.id));
    showToast(`User '${userToDelete.name}' removed from workspace.`);
    setUserToDelete(null);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignTitle.trim()) return;
    sounds.playCorrect();
    const newCamp: CampaignItem = {
      id: `c_${Date.now()}`,
      title: newCampaignTitle.trim(),
      sop: newCampaignSop.trim() || 'General Safety SOP',
      target: newCampaignTarget.trim() || 'All Active Staff',
      department: newCampaignDept,
      location: 'Organization Wide',
      completion: 0,
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    setNewCampaignTitle('');
    setNewCampaignSop('');
    setNewCampaignTarget('');
    setIsCreateCampaignModalOpen(false);
    showToast(`Training Campaign '${newCamp.title}' deployed.`);
  };

  const getViewTitle = (mode: AdminViewMode): string => {
    switch (mode) {
      case 'users':
        return 'User Management';
      case 'assignments':
        return 'Training Campaigns & Assignments';
      case 'settings':
        return 'Global Organisation Settings';
      case 'repository':
        return 'SOP Content Repository';
      case 'reports':
        return 'Compliance & Audit Reports';
      case 'control_tower':
        return 'Control Tower Readiness';
      default:
        return 'Control Center';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 pt-4 pb-20 text-white relative z-10 w-full max-w-5xl mx-auto space-y-6 font-sans select-none animate-in fade-in duration-200">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#12151E] text-white border border-emerald-500/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 backdrop-blur-xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Unified Top Breadcrumb Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span
              onClick={() => {
                sounds.playTap();
                setActiveViewMode('landing');
              }}
              className="text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              ADMIN WORKSPACE
            </span>
            <span className="text-slate-600">/</span>
            {activeViewMode === 'landing' ? (
              <span className="text-white font-bold">Control Center</span>
            ) : (
              <>
                <span
                  onClick={() => {
                    sounds.playTap();
                    setActiveViewMode('landing');
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Control Center
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-indigo-400 font-bold">{getViewTitle(activeViewMode)}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeViewMode === 'landing' ? 'Administration Control Center' : getViewTitle(activeViewMode)}
          </h1>
          <p className="text-xs text-slate-400 font-normal">
            {activeViewMode === 'landing'
              ? 'Manage your organisation, content and training.'
              : `Configure and audit ${getViewTitle(activeViewMode).toLowerCase()} parameters.`}
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onBackToHome && (
            <button
              onClick={() => {
                sounds.playTap();
                onBackToHome();
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>← Frontline Coach</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playTap();
              onOpenRoleSwitcher();
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Users size={14} className="text-indigo-400" />
            <span>Switch Role</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. LANDING PAGE HUB VIEW (when activeViewMode === 'landing')             */}
      {/* ========================================================================= */}
      {activeViewMode === 'landing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* A. Primary Action Tiles (Vertical List matching User Specification) */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block px-1">
              Primary Administration Tasks
            </span>

            {/* 1. Users Tile */}
            <div
              onClick={() => {
                sounds.playTap();
                setActiveViewMode('users');
              }}
              className="group p-5 bg-[#12151E]/90 hover:bg-[#1A1E2C] backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 shadow-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Users
                  </h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5 truncate">
                    Manage learners, teams and access
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all ml-2">
                <ChevronRight size={18} />
              </div>
            </div>

            {/* 2. Assignments Tile */}
            <div
              onClick={() => {
                sounds.playTap();
                setActiveViewMode('assignments');
              }}
              className="group p-5 bg-[#12151E]/90 hover:bg-[#1A1E2C] backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 shadow-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ClipboardList size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Assignments
                  </h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5 truncate">
                    Create and track training assignments & campaigns
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all ml-2">
                <ChevronRight size={18} />
              </div>
            </div>

            {/* 3. Settings Tile */}
            <div
              onClick={() => {
                sounds.playTap();
                setActiveViewMode('settings');
              }}
              className="group p-5 bg-[#12151E]/90 hover:bg-[#1A1E2C] backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 shadow-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Settings size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Settings
                  </h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5 truncate">
                    Configure organisation and preferences
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all ml-2">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>

          {/* B. Quick Access Horizontal Cards Row */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block px-1">
              Quick Access Modules
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Card 1: SOP Repository */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('repository');
                }}
                className="group p-5 bg-[#12151E]/80 hover:bg-[#1A1E2C] backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 shadow-lg flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] h-40"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BookOpen size={20} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">SOP Repository</h4>
                  <p className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-2">
                    Browse, upload and manage content
                  </p>
                </div>
              </div>

              {/* Card 2: Reports */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('reports');
                }}
                className="group p-5 bg-[#12151E]/80 hover:bg-[#1A1E2C] backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 shadow-lg flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] h-40"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart2 size={20} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">Reports</h4>
                  <p className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-2">
                    View training progress & audit analytics
                  </p>
                </div>
              </div>

              {/* Card 3: Control Tower */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('control_tower');
                }}
                className="group p-5 bg-[#12151E]/80 hover:bg-[#1A1E2C] backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 shadow-lg flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] h-40"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Radio size={20} />
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">Control Tower</h4>
                  <p className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-2">
                    Function-wise & location-wise readiness
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* C. Recent Activity Feed Section */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Recent Activity
              </span>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('reports');
                }}
                className="text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="bg-[#12151E]/80 backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-lg">
              {/* Activity 1 */}
              <div className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">New SOP uploaded</h5>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">Aircraft Turnaround Safety SOP</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">2h ago</span>
              </div>

              {/* Activity 2 */}
              <div className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">12 users assigned</h5>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">Ground Operations Team</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">4h ago</span>
              </div>

              {/* Activity 3 */}
              <div className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">Training completed</h5>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">Passenger Boarding Procedures</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">6h ago</span>
              </div>

              {/* Activity 4 */}
              <div className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">Safety drill certified</h5>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">Sterile Cleanroom Hygiene Protocol</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">12h ago</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-PAGE a: USER MANAGEMENT (`activeViewMode === 'users'`)            */}
      {/* ========================================================================= */}
      {activeViewMode === 'users' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search staff by name or department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#12151E] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="h-11 px-3 rounded-xl bg-[#12151E] border border-white/10 text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Learner">Learners</option>
                <option value="Manager">Managers</option>
                <option value="Admin">Admins</option>
              </select>

              <button
                onClick={() => {
                  sounds.playTap();
                  setIsAddUserModalOpen(true);
                }}
                className="h-11 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shrink-0"
              >
                <Plus size={16} />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Staff Roster List */}
          <div className="bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-xl">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No users found matching filter parameters.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-white/10">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{u.name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active Status" />
                      </div>
                      <span className="text-xs font-mono text-slate-400 block truncate">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-semibold text-slate-300 block">{u.department}</span>
                      <span className="text-[10px] text-slate-500 block">{u.location}</span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${
                        u.role === 'Admin'
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          : u.role === 'Manager'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                      }`}
                    >
                      {u.role}
                    </span>

                    {/* Delete User Icon Action */}
                    <button
                      onClick={() => {
                        sounds.playTap();
                        setUserToDelete(u);
                      }}
                      className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-PAGE b: SETTINGS (`activeViewMode === 'settings'`)                */}
      {/* ========================================================================= */}
      {activeViewMode === 'settings' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="p-5 bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Global Training & Safety Controls</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pass threshold (85%), retry limits, and strict safety breach controls.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-xs transition-all cursor-pointer shadow-lg shrink-0"
            >
              Save Settings
            </button>
          </div>

          {savedSettingsNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <Check size={16} />
              <span>System parameters saved and applied globally across all cohorts.</span>
            </div>
          )}

          <div className="bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-xl">
            {/* Setting 1: Passing Score */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-md">
                <span className="text-sm font-bold text-white block">Global Passing Score Threshold</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Solo Test Me score required for certification (Preset: 85%). Learners below threshold must retry drill.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="60"
                  max="100"
                  value={minPassScore}
                  onChange={(e) => setMinPassScore(Number(e.target.value))}
                  className="w-20 h-11 rounded-xl bg-[#0E1017] border border-white/20 text-center text-sm font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-sm font-bold text-white">%</span>
              </div>
            </div>

            {/* Setting 2: Assessment Retry Limits */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-md">
                <span className="text-sm font-bold text-white block">Assessment Retry Limits</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Attempts allowed before triggering supervisor observation and trainer dispatch.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {[1, 2, 3, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      sounds.playTap();
                      setMaxRetries(num);
                    }}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      maxRetries === num
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Setting 3: Strict Safety Breach Lockdown */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-md">
                <span className="text-sm font-bold text-white block">Strict Safety Breach Lockdown</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instant failure if any critical safety control gate is violated during scenario execution.
                </p>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setStrictMode(!strictMode);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  strictMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {strictMode ? 'Enabled ✓' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-PAGE c: ASSIGNMENTS (`activeViewMode === 'assignments'`)          */}
      {/* ========================================================================= */}
      {activeViewMode === 'assignments' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="p-5 bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Organization-Wide Training Campaigns</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Deploy mandatory procedures and track frontline compliance across cohorts.
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playTap();
                setIsCreateCampaignModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shrink-0"
            >
              <Plus size={16} />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-xl">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{camp.title}</h4>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      {camp.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    SOP: <span className="text-white font-medium">{camp.sop}</span> · Target: {camp.target}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${camp.completion}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 rounded-xl">
                    {camp.completion}% Completed
                  </span>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      showToast(`Nudge notification dispatched to ${camp.target}.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    Nudge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-PAGE d: SOP REPOSITORY (`activeViewMode === 'repository'`)        */}
      {/* ========================================================================= */}
      {activeViewMode === 'repository' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Top Scan & Upload Authority Box */}
          <div className="rounded-2xl border border-white/15 bg-[#12151E]/90 backdrop-blur-xl p-5 flex flex-col items-center justify-center text-center gap-4 shadow-xl">
            <div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-base font-bold text-sky-400">Scan & Upload Authority</span>
                <span className="text-[10px] font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded">
                  Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                Sole authority to scan SOPs with camera OCR, upload document files, and build training decks.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 w-full max-w-md">
              <button
                onClick={() => {
                  sounds.playTap();
                  onScanClick();
                }}
                className="flex-1 py-3 px-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera size={16} className="text-sky-400" />
                <span>Scan SOP</span>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  onUploadClick();
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-white text-black hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload size={16} />
                <span>Upload SOP</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search repository SOPs..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#12151E] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-11 px-3 rounded-xl bg-[#12151E] border border-white/10 text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Safety">Safety</option>
              <option value="Operations">Operations</option>
              <option value="Compliance">Compliance</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Aviation">Aviation</option>
            </select>
          </div>

          {/* Repository List */}
          <div className="bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-xl">
            {filteredLessons.map((lesson, idx) => {
              const createdDate = getModuleCreationDate(lesson, idx);
              const assignedStatus = getModuleAssignedStatus(lesson, campaigns);
              const isAssigned = assignedStatus === 'Assigned';

              return (
                <div
                  key={lesson.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isAssigned ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                        title={isAssigned ? 'Assigned in Campaign' : 'Not Assigned'}
                      />
                      <h4 className="text-base font-bold text-white truncate">{lesson.title}</h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300 shrink-0">
                        {lesson.category || 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 pl-5">{lesson.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                    <button
                      onClick={() => {
                        sounds.playTap();
                        onSelectSop(lesson.id, lesson.title);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-semibold text-white cursor-pointer transition-colors"
                    >
                      Inspect
                    </button>

                    <span className="text-xs font-mono text-slate-400">{createdDate}</span>

                    {onDeleteSop && (
                      <button
                        onClick={() => {
                          sounds.playTap();
                          if (confirm(`Delete '${lesson.title}' from the repository?`)) {
                            onDeleteSop(lesson.id);
                            showToast(`Deleted '${lesson.title}' from repository.`);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete SOP"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-PAGE e: REPORTS (`activeViewMode === 'reports'`)                   */}
      {/* ========================================================================= */}
      {activeViewMode === 'reports' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="p-5 bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white">Audit-Ready Compliance Reporting</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate timestamped compliance CSV verification records certifying completed solo drills.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shrink-0"
            >
              <Download size={15} />
              <span>Export Audit CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl border border-white/10 bg-[#12151E]/90 backdrop-blur-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Compliance Rate</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">94.2%</span>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-[#12151E]/90 backdrop-blur-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Certified Associates</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">142</span>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-[#12151E]/90 backdrop-blur-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Safety Non-Conformances</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">0</span>
            </div>
          </div>

          {/* Detailed Audit Ledger */}
          <div className="bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Certified Drill Log</span>
              <span className="text-xs font-mono text-slate-400">Timestamped Logs</span>
            </div>
            <div className="divide-y divide-white/10">
              {userList.slice(0, 5).map((u, i) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{u.department} · {u.location}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold font-mono block">Certified (96%)</span>
                    <span className="text-slate-500 text-[10px]">2026-10-16 08:{30 - i * 5}:00</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUB-PAGE f: CONTROL TOWER (`activeViewMode === 'control_tower'`)       */}
      {/* ========================================================================= */}
      {activeViewMode === 'control_tower' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Header & Date Filter */}
          <div className="p-5 bg-[#12151E]/90 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Training Readiness Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track progress, completion and key insights across departments and locations.
              </p>
            </div>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Year to Date">Year to Date</option>
            </select>
          </div>

          {/* 4 Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl border border-white/10 bg-[#12151E]/90 backdrop-blur-xl">
              <span className="text-2xl font-black text-white font-mono block">245</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 block">Total Users</span>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-[#12151E]/90 backdrop-blur-xl">
              <span className="text-2xl font-black text-emerald-400 font-mono block">198</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 block">Completed (81%)</span>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-[#12151E]/90 backdrop-blur-xl">
              <span className="text-2xl font-black text-indigo-400 font-mono block">32</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 block">In Progress (13%)</span>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-[#12151E]/90 backdrop-blur-xl">
              <span className="text-2xl font-black text-amber-400 font-mono block">15</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 block">Not Started (6%)</span>
            </div>
          </div>

          {/* Department (Function-wise) & Location-wise Interactive Breakdown */}
          <div className="bg-[#12151E]/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Function-wise Completion Rates
              </span>

              {/* Department Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {['All', 'Cleanroom', 'Housekeeping', 'Assembly', 'Manufacturing', 'Executive Ops'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      sounds.playTap();
                      setSelectedTowerDept(dept);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      selectedTowerDept === dept
                        ? 'bg-white text-black font-bold shadow-sm'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Progress Bars */}
            <div className="space-y-3 pt-2">
              {departmentMetrics.map((dept) => (
                <div key={dept.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{dept.name}</span>
                    <span className="text-indigo-400 font-mono">{dept.rate}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${dept.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD USER                                                         */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#12151E] border border-white/15 rounded-2xl p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Add Staff / Associate</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. maya.l@org.internal"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Learner">Learner</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Cleanroom"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Facility Location</label>
                <select
                  value={newUserLoc}
                  onChange={(e) => setNewUserLoc(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Munich Facility">Munich Facility</option>
                  <option value="Bay A/B">Bay A/B</option>
                  <option value="Airport Terminal">Airport Terminal</option>
                  <option value="Warehouse North">Warehouse North</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#12151E] border border-rose-500/30 rounded-2xl p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle size={24} />
              <h3 className="text-base font-bold text-white">Delete User Record</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-white">{userToDelete.name}</span> ({userToDelete.role}, {userToDelete.department}) from the organisation? This will revoke their assigned training credentials.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE CAMPAIGN                                                 */}
      {/* ========================================================================= */}
      {isCreateCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#12151E] border border-white/15 rounded-2xl p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Deploy Training Campaign</h3>
              <button
                onClick={() => setIsCreateCampaignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Safety Refresher"
                  value={newCampaignTitle}
                  onChange={(e) => setNewCampaignTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target SOP</label>
                <input
                  type="text"
                  placeholder="e.g. Room Sanitization & Disinfection"
                  value={newCampaignSop}
                  onChange={(e) => setNewCampaignSop(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Staff Cohort</label>
                <input
                  type="text"
                  placeholder="e.g. Cleanroom Division (42 Staff)"
                  value={newCampaignTarget}
                  onChange={(e) => setNewCampaignTarget(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Department</label>
                <select
                  value={newCampaignDept}
                  onChange={(e) => setNewCampaignDept(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0E1017] border border-white/15 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Cleanroom">Cleanroom</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Assembly">Assembly</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-md"
                >
                  Deploy Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
