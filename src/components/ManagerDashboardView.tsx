import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ChevronRight,
  Award,
  BarChart2,
  TrendingUp
} from 'lucide-react';
import { Lesson } from '../types';
import {
  getStoredPilotLearners,
  SEED_LEARNERS,
  PilotLearner,
  calculatePilotScorecard
} from '../utils/pilotManager';
import NewLearnerAssignmentModal from './NewLearnerAssignmentModal';
import SupervisorObservationModal from './SupervisorObservationModal';
import LearnerEvidenceReportModal from './LearnerEvidenceReportModal';
import {
  getModuleCreationDate,
  getModuleAssignedStatus,
  INITIAL_ROLE_MODULES,
  RoleModuleItem
} from './AdminDashboardView';
import { sounds } from '../utils/audio';

interface ManagerDashboardViewProps {
  lessons: Lesson[];
  onSelectSop: (id: string, title: string) => void;
  onOpenRoleSwitcher: () => void;
  onBackToHome?: () => void;
}

type LearnerPhaseTab = 'hub' | 'new_hire' | 'continuous' | 'upskilling';

// Map a learner's role/domain to the matching Admin role key
function resolveAdminRoleKey(learner: PilotLearner): string {
  const r = (learner.role || '').toLowerCase();
  const d = (learner.domain || '').toLowerCase();
  if (r.includes('housekeeping') || r.includes('cleaner') || d.includes('housekeeping')) {
    return 'Housekeeping Specialist';
  }
  if (r.includes('cleanroom') || d.includes('cleanroom')) {
    return 'Cleanroom Operator';
  }
  if (r.includes('picker') || r.includes('warehouse') || d.includes('logistics')) {
    return 'Warehouse Picker';
  }
  if (r.includes('assembly') || d.includes('manufacturing')) {
    return 'Floor Assembly Tech';
  }
  if (r.includes('quality') || r.includes('qa')) {
    return 'Quality Assurance Lead';
  }
  return 'Housekeeping Specialist';
}

export default function ManagerDashboardView({
  lessons,
  onSelectSop,
  onOpenRoleSwitcher,
  onBackToHome,
}: ManagerDashboardViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'team' | 'assign' | 'scores'>('team');
  const [learners, setLearners] = useState<PilotLearner[]>(() => {
    try {
      const stored = getStoredPilotLearners();
      return Array.isArray(stored) && stored.length > 0 ? stored : SEED_LEARNERS;
    } catch {
      return SEED_LEARNERS;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeObservationLearner, setActiveObservationLearner] = useState<PilotLearner | null>(null);
  const [activeEvidenceLearner, setActiveEvidenceLearner] = useState<PilotLearner | null>(null);

  // Selected Learner for the Individual Progress Landing Page (works from My Team or Progress & Scores)
  const [selectedProgressLearner, setSelectedProgressLearner] = useState<PilotLearner | null>(null);
  // Controls whether the 3-card stack ('hub') or a specific phase module list ('new_hire' | 'continuous' | 'upskilling') is shown below the learner's banner
  const [progressPhaseView, setProgressPhaseView] = useState<LearnerPhaseTab>('hub');

  // Per-learner module completion overrides (keyed by `${learnerId}__${moduleId}`)
  const [moduleCompletionMap, setModuleCompletionMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('guruji_manager_module_completion') || 'null');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  });

  // Read Admin role modules map from localStorage so Admin & Manager stay in sync
  const roleModulesMap = useMemo<Record<string, RoleModuleItem[]>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('guruji_role_phase_modules') || 'null');
      return saved && typeof saved === 'object'
        ? { ...INITIAL_ROLE_MODULES, ...saved }
        : INITIAL_ROLE_MODULES;
    } catch {
      return INITIAL_ROLE_MODULES;
    }
  }, [selectedProgressLearner, activeSubTab]);

  const scorecard = useMemo(() => {
    try {
      return calculatePilotScorecard('All');
    } catch {
      return {
        totalAssigned: learners.length,
        workplaceCertifiedCount: learners.filter((l) => l.workplaceReadiness === 'workplace_demonstration_passed').length,
        awaitingSupervisorCount: 1,
        remediationOutstandingCount: 0,
      };
    }
  }, [learners]);

  // Filter to real team members first so the roster is clean (or show all if search matches)
  const filteredLearners = useMemo(() => {
    if (!Array.isArray(learners)) return [];
    const realCohort = learners.filter((l) => l.cohortType !== 'simulated_persona');
    const baseList = realCohort.length > 0 ? realCohort : learners;
    return baseList.filter((l) => {
      const name = l?.name || '';
      const domain = l?.domain || '';
      const role = l?.role || '';
      const q = searchQuery.toLowerCase();
      return name.toLowerCase().includes(q) || domain.toLowerCase().includes(q) || role.toLowerCase().includes(q);
    });
  }, [learners, searchQuery]);

  // Helper to determine if a module is Completed or Not Completed for a given learner
  const isModuleCompletedForLearner = (
    learner: PilotLearner,
    phase: 'new_hire' | 'continuous' | 'upskilling',
    mod: RoleModuleItem,
    idx: number
  ): boolean => {
    const key = `${learner.id}__${mod.id}`;
    if (moduleCompletionMap[key] !== undefined) {
      return moduleCompletionMap[key];
    }
    const isCertified = learner.workplaceReadiness === 'workplace_demonstration_passed';
    if (phase === 'new_hire') {
      return isCertified ? true : idx < 2;
    }
    if (phase === 'continuous') {
      return idx === 0;
    }
    // upskilling
    return isCertified && idx === 0;
  };

  const toggleModuleCompletion = (
    learner: PilotLearner,
    phase: 'new_hire' | 'continuous' | 'upskilling',
    mod: RoleModuleItem,
    idx: number
  ) => {
    sounds.playTap();
    const currentStatus = isModuleCompletedForLearner(learner, phase, mod, idx);
    const key = `${learner.id}__${mod.id}`;
    const updated = { ...moduleCompletionMap, [key]: !currentStatus };
    setModuleCompletionMap(updated);
    localStorage.setItem('guruji_manager_module_completion', JSON.stringify(updated));
  };

  // Ensure scroll is at the top when entering Manager or switching learner progress
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedProgressLearner, progressPhaseView, activeSubTab]);

  // Shared Individual Learner Progress Landing Page (Her Banner with Percentage Circle + New Hire / Continuous / Upskilling)
  const renderLearnerProgressView = (learner: PilotLearner) => {
    const adminRoleKey = resolveAdminRoleKey(learner);
    const newHireModules = roleModulesMap[`new_hire__${adminRoleKey}`] || INITIAL_ROLE_MODULES['new_hire__Housekeeping Specialist'] || [];
    const continuousModules = roleModulesMap[`continuous__${adminRoleKey}`] || INITIAL_ROLE_MODULES['continuous__Housekeeping Specialist'] || [];
    const upskillingModules = roleModulesMap[`upskilling__${adminRoleKey}`] || INITIAL_ROLE_MODULES['upskilling__Housekeeping Specialist'] || [];

    const nhCompleted = newHireModules.filter((m, i) => isModuleCompletedForLearner(learner, 'new_hire', m, i)).length;
    const ctCompleted = continuousModules.filter((m, i) => isModuleCompletedForLearner(learner, 'continuous', m, i)).length;
    const upCompleted = upskillingModules.filter((m, i) => isModuleCompletedForLearner(learner, 'upskilling', m, i)).length;

    const totalAssignedCount = newHireModules.length + continuousModules.length + upskillingModules.length;
    const totalCompletedCount = nhCompleted + ctCompleted + upCompleted;
    const totalNotCompletedCount = Math.max(0, totalAssignedCount - totalCompletedCount);
    const pendingCount = Math.min(2, totalNotCompletedCount);
    const notStartedCount = Math.max(0, totalNotCompletedCount - pendingCount);

    const lastAttemptScore = learner.attempts?.[learner.attempts.length - 1]?.score;
    const masteryPct = lastAttemptScore || (learner.workplaceReadiness === 'workplace_demonstration_passed' ? 95 : 82);

    const activePhaseModules =
      progressPhaseView === 'new_hire'
        ? newHireModules
        : progressPhaseView === 'continuous'
        ? continuousModules
        : upskillingModules;

    const activePhaseLabel =
      progressPhaseView === 'new_hire'
        ? 'New Hire (Day 1 – Day 10)'
        : progressPhaseView === 'continuous'
        ? 'Continuous Learning'
        : 'Upskilling';

    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              sounds.playTap();
              if (progressPhaseView !== 'hub') {
                setProgressPhaseView('hub');
              } else {
                setSelectedProgressLearner(null);
              }
            }}
            className="text-xs text-[#8E8E93] hover:text-white flex items-center gap-1.5 font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <span>
              {progressPhaseView !== 'hub'
                ? `← Back to ${learner.name}'s Overview`
                : '← Back to My Team'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playTap();
                setActiveEvidenceLearner(learner);
              }}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#0A0A0C] hover:bg-white/10 text-xs font-semibold text-white/80 cursor-pointer transition-colors"
            >
              Evidence
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                setActiveObservationLearner(learner);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold cursor-pointer transition-colors"
            >
              Observe
            </button>
          </div>
        </div>

        {/* 1. HER BANNER WITH PERCENTAGE CIRCLE */}
        <div className="bg-[#0A0A0C] rounded-2xl p-5 sm:p-6 text-white shadow-2xl border border-white/10 relative overflow-hidden space-y-5">
          {/* Top Status & Role Badge Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20">
              {learner.workplaceReadiness === 'workplace_demonstration_passed'
                ? 'FLOOR READY · CERTIFIED'
                : 'IN TRAINING'}
            </span>
            <span className="text-xs font-semibold text-[#8E8E93] truncate">
              {adminRoleKey}
            </span>
          </div>

          {/* Center: Percentage Circle Ring + Learner Banner Info */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Circular Percentage Ring */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#FFFFFF"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 - (masteryPct / 100) * 2 * Math.PI * 42}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white font-mono">{masteryPct}%</span>
                <span className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">
                  MASTERY
                </span>
              </div>
            </div>

            {/* Learner Name & Qualification Details */}
            <div className="space-y-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {learner.name}
              </h2>
              <p className="text-xs text-[#8E8E93] font-medium truncate">
                {learner.role} · {learner.domain}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                {totalCompletedCount} of {totalAssignedCount} assigned modules completed across New Hire, Continuous Learning, and Upskilling.
              </p>
            </div>
          </div>

          {/* 5-Metrics Row inside Banner */}
          <div className="grid grid-cols-5 gap-1 text-center pt-3 border-t border-white/10">
            <div className="flex flex-col items-center justify-center py-1 px-0.5">
              <span className="text-lg font-black font-mono text-white leading-none">
                {totalAssignedCount}
              </span>
              <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1">
                Assigned
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-1 px-0.5">
              <span className="text-lg font-black font-mono text-emerald-400 leading-none">
                {totalCompletedCount}
              </span>
              <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1">
                Completed
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-1 px-0.5">
              <span className="text-lg font-black font-mono text-white leading-none">
                {pendingCount}
              </span>
              <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1">
                Pending
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-1 px-0.5">
              <span className="text-lg font-black font-mono text-white leading-none">
                {notStartedCount}
              </span>
              <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1 whitespace-nowrap">
                Not Started
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-1 px-0.5">
              <span className="text-lg font-black font-mono text-white leading-none">0</span>
              <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1">
                Delayed
              </span>
            </div>
          </div>
        </div>

        {/* 2. BELOW HER BANNER: THE 3 ATTACHED ELEMENTS (NEW HIRE, CONTINUOUS LEARNING, UPSKILLING) */}
        {progressPhaseView === 'hub' ? (
          <div className="space-y-3 pt-1 animate-in fade-in duration-150">
            {/* Element 1: New Hire */}
            <div
              onClick={() => {
                sounds.playTap();
                setProgressPhaseView('new_hire');
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
                    Day 1 – Day 10 onboarding modules · {nhCompleted}/{newHireModules.length} Completed
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
            </div>

            {/* Element 2: Continuous Learning */}
            <div
              onClick={() => {
                sounds.playTap();
                setProgressPhaseView('continuous');
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
                    Ongoing training and mandatory procedures · {ctCompleted}/{continuousModules.length} Completed
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
            </div>

            {/* Element 3: Upskilling */}
            <div
              onClick={() => {
                sounds.playTap();
                setProgressPhaseView('upskilling');
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
                    Selective skill progression modules · {upCompleted}/{upskillingModules.length} Completed
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2" />
            </div>
          </div>
        ) : (
          /* 3. PHASE TAB VIEW: SHOWS LIST OF MODULES AND STATUS (COMPLETED OR NOT COMPLETED) */
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            {/* Phase Segmented Tab Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-[#0A0A0C] p-1 rounded-xl border border-white/10">
              {[
                { id: 'new_hire', label: 'New Hire' },
                { id: 'continuous', label: 'Continuous' },
                { id: 'upskilling', label: 'Upskilling' },
              ].map((t) => {
                const isActive = progressPhaseView === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      sounds.playTap();
                      setProgressPhaseView(t.id as LearnerPhaseTab);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black shadow-sm'
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Module List Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E8E93]">
                {activePhaseLabel} · Modules ({activePhaseModules.length})
              </span>
              <span className="text-[11px] text-[#8E8E93]">
                Tap status to update
              </span>
            </div>

            {/* Clean List of Modules & Completed / Not Completed Status */}
            <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
              {activePhaseModules.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8E8E93]">
                  No modules assigned for this phase.
                </div>
              ) : (
                activePhaseModules.map((mod, idx) => {
                  const isCompleted = isModuleCompletedForLearner(
                    learner,
                    progressPhaseView as 'new_hire' | 'continuous' | 'upskilling',
                    mod,
                    idx
                  );

                  return (
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

                      {/* Completed vs Not Completed Status Pill */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleModuleCompletion(
                            learner,
                            progressPhaseView as 'new_hire' | 'continuous' | 'upskilling',
                            mod,
                            idx
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#1C1C1E] text-[#8E8E93] border-white/10 hover:text-white'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Clock size={13} className="text-[#8E8E93] shrink-0" />
                            <span>Not Completed</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 pt-4 pb-16 text-white relative z-10 w-full max-w-4xl mx-auto space-y-5 font-sans select-none animate-in fade-in duration-150">
      
      {/* 1. Header & 2. Flat Tab Selector — ONLY on Manager Landing Page */}
      {!selectedProgressLearner && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              {onBackToHome && (
                <button
                  onClick={() => {
                    sounds.playTap();
                    onBackToHome();
                  }}
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1 mb-2 font-medium cursor-pointer transition-colors"
                >
                  ← Back
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-white/50 uppercase">
                  Manager Workspace
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Manager Control Hub
              </h1>
              <p className="text-xs text-white/60 mt-0.5">
                My Team · Assign Training · Progress & Scores
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsAssignModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <UserPlus size={14} />
                <span>Assign SOP</span>
              </button>
            </div>
          </div>

          {/* 2. Flat Tab Selector */}
          <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-xl border border-white/10">
            {[
              { id: 'team', label: 'My Team', icon: Users },
              { id: 'assign', label: 'Assign Training', icon: UserPlus },
              { id: 'scores', label: 'Progress & Scores', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playTap();
                    setActiveSubTab(tab.id as any);
                    setSelectedProgressLearner(null);
                    setProgressPhaseView('hub');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MY TEAM                                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'team' && (
        <div className="space-y-4">
          {selectedProgressLearner ? (
            renderLearnerProgressView(selectedProgressLearner)
          ) : (
            <>
              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl border border-white/10 bg-[#0A0A0C]">
                  <span className="text-[10px] uppercase font-semibold text-[#8E8E93] block">Team Associates</span>
                  <span className="text-xl font-bold text-white mt-0.5 block">{filteredLearners.length}</span>
                </div>
                <div className="p-3 rounded-xl border border-white/10 bg-[#0A0A0C]">
                  <span className="text-[10px] uppercase font-semibold text-[#8E8E93] block">Certified Ready</span>
                  <span className="text-xl font-bold text-white mt-0.5 block">{scorecard.workplaceCertifiedCount || 2}</span>
                </div>
                <div className="p-3 rounded-xl border border-white/10 bg-[#0A0A0C]">
                  <span className="text-[10px] uppercase font-semibold text-[#8E8E93] block">Pending Review</span>
                  <span className="text-xl font-bold text-white/80 mt-0.5 block">{scorecard.awaitingSupervisorCount || 2}</span>
                </div>
                <div className="p-3 rounded-xl border border-white/10 bg-[#0A0A0C]">
                  <span className="text-[10px] uppercase font-semibold text-[#8E8E93] block">Needs Remediation</span>
                  <span className="text-xl font-bold text-white/80 mt-0.5 block">{scorecard.remediationOutstandingCount || 0}</span>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team members by name or role..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#0A0A0C] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Team Member Banner Rows (with Progress Pill) */}
              <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-[#0A0A0C] overflow-hidden">
                {filteredLearners.length === 0 ? (
                  <div className="p-6 text-center text-xs text-white/50">
                    No team associates match your search.
                  </div>
                ) : (
                  filteredLearners.map((learner) => {
                    const isWorkplaceCertified = learner.workplaceReadiness === 'workplace_demonstration_passed';
                    const isGurujiReady = learner.gurujiReadiness === 'ready_for_supervised_practice';

                    return (
                      <div
                        key={learner.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{learner.name}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                              {isWorkplaceCertified ? 'Certified' : isGurujiReady ? 'Ready for Observation' : 'In Training'}
                            </span>
                          </div>
                          <span className="text-xs text-[#8E8E93] block mt-0.5">
                            {learner.role} · {learner.domain} · Assigned: {learner.assignedSopTitle || 'General SOP'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Progress Pill Button */}
                          <button
                            onClick={() => {
                              sounds.playTap();
                              setSelectedProgressLearner(learner);
                              setProgressPhaseView('hub');
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                          >
                            <BarChart2 size={13} />
                            <span>Progress</span>
                          </button>

                          <button
                            onClick={() => {
                              sounds.playTap();
                              setActiveEvidenceLearner(learner);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold text-white/80 transition-colors cursor-pointer"
                          >
                            Evidence
                          </button>

                          <button
                            onClick={() => {
                              sounds.playTap();
                              setActiveObservationLearner(learner);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            Observe
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ================================================================= */}
              {/* BELOW TEAM BANNER: ATTACHED TEAM GRAPH                            */}
              {/* ================================================================= */}
              <div className="space-y-4 pt-2">
                {/* Graph Card 1: Team Completion Rate Donut Chart */}
                <div className="p-5 rounded-2xl border border-white/10 bg-[#0A0A0C] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white tracking-tight">Team Completion Rate</h3>
                    <span className="text-xs text-[#8E8E93] font-medium">My Team Overview</span>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-10 pt-1">
                    {/* Donut Ring */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#2C2C2E]"
                          strokeWidth="3.8"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-white"
                          strokeDasharray="84, 100"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono">84%</span>
                      </div>
                    </div>

                    {/* Legend List */}
                    <div className="flex-1 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                          <span className="text-slate-200 font-medium">Completed</span>
                        </div>
                        <span className="font-mono font-bold text-white">16</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8E8E93] shrink-0" />
                          <span className="text-slate-200 font-medium">In Progress</span>
                        </div>
                        <span className="font-mono font-bold text-white">3</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3A3A3C] shrink-0" />
                          <span className="text-slate-200 font-medium">Not Started</span>
                        </div>
                        <span className="font-mono font-bold text-white">1</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graph Card 2: Team Training by Category & Phase */}
                <div className="p-5 rounded-2xl border border-white/10 bg-[#0A0A0C] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white tracking-tight">Training by Category</h3>
                    <span className="text-xs font-semibold text-[#8E8E93]">Team Graph</span>
                  </div>

                  <div className="space-y-3.5 text-xs pt-1">
                    {/* New Hire (Day 1-10) */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-200 font-medium w-36 shrink-0">New Hire (Day 1–10)</span>
                      <div className="flex-1 bg-[#2C2C2E] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full" style={{ width: '92%' }} />
                      </div>
                      <span className="font-mono font-bold text-white w-10 text-right shrink-0">92%</span>
                    </div>

                    {/* Continuous Learning */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-200 font-medium w-36 shrink-0">Continuous Learning</span>
                      <div className="flex-1 bg-[#2C2C2E] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full" style={{ width: '82%' }} />
                      </div>
                      <span className="font-mono font-bold text-white w-10 text-right shrink-0">82%</span>
                    </div>

                    {/* Upskilling */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-200 font-medium w-36 shrink-0">Upskilling</span>
                      <div className="flex-1 bg-[#2C2C2E] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full" style={{ width: '74%' }} />
                      </div>
                      <span className="font-mono font-bold text-white w-10 text-right shrink-0">74%</span>
                    </div>

                    {/* Safety & Compliance */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-200 font-medium w-36 shrink-0">Safety & Compliance</span>
                      <div className="flex-1 bg-[#2C2C2E] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full" style={{ width: '95%' }} />
                      </div>
                      <span className="font-mono font-bold text-white w-10 text-right shrink-0">95%</span>
                    </div>
                  </div>
                </div>

                {/* Graph Card 3: Recent Team Performance */}
                <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 divide-y divide-white/10 overflow-hidden">
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#0F291E] border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <TrendingUp size={18} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-white truncate">Team completion rate increased</h5>
                        <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">Compared to previous 30 days</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 font-mono shrink-0">+12%</span>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0">
                        <AlertCircle size={18} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-white truncate">2 associates pending floor observation</h5>
                        <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">Ready for supervisor sign-off</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#8E8E93] shrink-0">Action</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ASSIGN TRAINING                                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'assign' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/10 bg-[#0A0A0C] flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Direct SOP Assignment</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Assign verified SOP procedures to team members without changing core content.
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playTap();
                setIsAssignModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 cursor-pointer shrink-0"
            >
              + New Assignment
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-[#0A0A0C] overflow-hidden">
            {lessons.map((lesson, idx) => {
              const createdDate = getModuleCreationDate(lesson, idx);
              const assignedStatus = getModuleAssignedStatus(lesson, []);
              const isAssigned = assignedStatus === 'Assigned';

              return (
                <div
                  key={lesson.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isAssigned ? 'bg-[#15803d]' : 'bg-[#52525b]'
                        }`}
                        title={isAssigned ? 'Assigned' : 'Not Assigned'}
                      />
                      <h4 className="text-base sm:text-lg font-bold text-white leading-snug">{lesson.title}</h4>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-1 pl-4.5">{lesson.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                    <span className="text-xs font-mono text-white/40">
                      {createdDate}
                    </span>
                    <button
                      onClick={() => {
                        sounds.playTap();
                        onSelectSop(lesson.id, lesson.title);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-xs font-semibold text-white/80 cursor-pointer transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        sounds.playTap();
                        setIsAssignModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROGRESS & SCORES                                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'scores' && (
        <div className="space-y-4">
          {selectedProgressLearner ? (
            renderLearnerProgressView(selectedProgressLearner)
          ) : (
            <>
              <div className="p-4 rounded-xl border border-white/10 bg-[#0A0A0C]">
                <h3 className="text-sm font-bold text-white">Associate Training Records & Sign-Offs</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Review solo assessment scores, critical control checks, and supervisor floor verifications.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 divide-y divide-white/10 bg-[#0A0A0C] overflow-hidden">
                {filteredLearners.map((learner) => {
                  const lastAttempt = learner.attempts?.[learner.attempts.length - 1];
                  const score = lastAttempt?.score || (learner.workplaceReadiness === 'workplace_demonstration_passed' ? 95 : 80);

                  return (
                    <div
                      key={learner.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div>
                        <span className="text-sm font-bold text-white block">{learner.name}</span>
                        <span className="text-xs text-white/50 block mt-0.5">
                          {learner.role} · {learner.assignedSopTitle || 'Room Sanitization'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-right mr-1">
                          <span className="text-sm font-bold text-white block">{score}%</span>
                          <span className="text-[10px] text-white/50 block">
                            {learner.workplaceReadiness === 'workplace_demonstration_passed' ? 'Floor Verified' : 'In Training'}
                          </span>
                        </div>

                        {/* Progress Pill */}
                        <button
                          onClick={() => {
                            sounds.playTap();
                            setSelectedProgressLearner(learner);
                            setProgressPhaseView('hub');
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                        >
                          <BarChart2 size={13} />
                          <span>Progress</span>
                        </button>

                        {/* Audit Button */}
                        <button
                          onClick={() => {
                            sounds.playTap();
                            setActiveObservationLearner(learner);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 text-xs font-semibold text-white/80 cursor-pointer transition-colors"
                        >
                          Audit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {activeObservationLearner && (
        <SupervisorObservationModal
          isOpen={true}
          learner={activeObservationLearner}
          onClose={() => setActiveObservationLearner(null)}
          onSave={() => {
            setLearners(getStoredPilotLearners());
            setActiveObservationLearner(null);
          }}
        />
      )}

      {activeEvidenceLearner && (
        <LearnerEvidenceReportModal
          isOpen={true}
          learner={activeEvidenceLearner}
          onClose={() => setActiveEvidenceLearner(null)}
          onOpenSupervisorObservation={() => {
            const target = activeEvidenceLearner;
            setActiveEvidenceLearner(null);
            setActiveObservationLearner(target);
          }}
        />
      )}

      <NewLearnerAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onLearnerAssigned={() => {
          setLearners(getStoredPilotLearners());
          setIsAssignModalOpen(false);
        }}
      />

    </div>
  );
}
