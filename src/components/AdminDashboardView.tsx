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
  ChevronDown
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
  { id: 'u3', name: 'Carlos Mendez', email: 'carlos.m@org.internal', role: 'Learner', department: 'Housekeeping Services', location: 'Bay A/B', status: 'Active' },
  { id: 'u4', name: 'Amina Al-Mansoor', email: 'amina.a@org.internal', role: 'Learner', department: 'Manufacturing', location: 'Bay A/B', status: 'Active' },
  { id: 'u5', name: 'David Kim', email: 'david.k@org.internal', role: 'Manager', department: 'Floor Operations', location: 'Airport Terminal', status: 'Active' },
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
  const [userList, setUserList] = useState<UserItem[]>(INITIAL_USERS);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);

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
                setActiveViewMode('landing');
              }}
              className="text-[11px] font-bold tracking-widest uppercase text-[#8E8E93] hover:text-white flex items-center gap-1 transition-colors cursor-pointer mb-1"
            >
              ← ADMIN WORKSPACE
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
              ? 'Assignments'
              : activeViewMode === 'repository'
              ? 'Content Library'
              : 'Training Readiness'}
          </h1>
          <p className="text-xs text-[#8E8E93] font-normal leading-relaxed">
            {activeViewMode === 'landing'
              ? 'Manage your organisation, content and training.'
              : activeViewMode === 'users'
              ? 'Manage staff roster, roles and access.'
              : activeViewMode === 'settings'
              ? 'Configure global training threshold & retry controls.'
              : activeViewMode === 'assignments'
              ? 'Deploy mandatory procedures and track frontline compliance.'
              : activeViewMode === 'repository'
              ? 'Scan, upload and manage SOPs and training content.'
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
              Frontline
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
                <div className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
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

          {/* B. Quick Access Section (Horizontal Cards) */}
          <div className="space-y-3 pt-1">
            <h3 className="text-base font-bold text-white tracking-tight px-1">
              Quick Access
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Card 1: SOP Repository */}
              <div
                onClick={() => {
                  sounds.playTap();
                  setActiveViewMode('repository');
                }}
                className="p-4 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] h-36"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#1C1C1E] text-white flex items-center justify-center border border-white/10">
                    <BookOpen size={18} />
                  </div>
                  <ChevronRight size={16} className="text-[#8E8E93]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">SOP Repository</h4>
                  <p className="text-[11px] text-[#8E8E93] font-normal mt-0.5 line-clamp-2">
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
                className="p-4 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] h-36"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#1C1C1E] text-white flex items-center justify-center border border-white/10">
                    <BarChart2 size={18} />
                  </div>
                  <ChevronRight size={16} className="text-[#8E8E93]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Reports</h4>
                  <p className="text-[11px] text-[#8E8E93] font-normal mt-0.5 line-clamp-2">
                    View training progress and analytics
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

              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shrink-0 border border-white/10">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">Training completed</h5>
                    <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">Passenger Boarding Procedures</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#8E8E93] shrink-0">6h ago</span>
              </div>
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

          <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8E8E93]">
                No staff found matching query.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">{u.name}</span>
                    <span className="text-xs font-mono text-[#8E8E93] block truncate mt-0.5">{u.email}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
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
      {/* 4. ASSIGNMENTS SUB-PAGE                                                    */}
      {/* ========================================================================= */}
      {activeViewMode === 'assignments' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          <div className="p-5 bg-[#0A0A0C] rounded-2xl border border-white/10 space-y-1">
            <h3 className="text-base font-bold text-white">Organization-Wide Training Campaigns</h3>
            <p className="text-xs text-[#8E8E93]">
              Deploy mandatory procedures and track frontline compliance across cohorts.
            </p>
          </div>

          <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-5 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{camp.title}</h4>
                  <p className="text-xs text-[#8E8E93]">
                    SOP: {camp.sop} · Target: {camp.target}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-white font-mono">
                    {camp.completion}% Completed
                  </span>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      showToast(`Nudge sent to ${camp.target}.`);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
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

    </div>
  );
}
