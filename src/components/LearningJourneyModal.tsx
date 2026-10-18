import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface LearningJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSimulation: (lessonId: string) => void;
}

interface AdminJourneyCampaign {
  id: string;
  title: string;
  sop: string;
  sopId?: string;
  target: string;
  completion: number;
  journeyPhase?:
    | 'Phase 1: New Hire (Day 1–10)'
    | 'Phase 2: Continuous / Mandate'
    | 'Phase 3: Selective Upskilling';
}

export const LearningJourneyModal: React.FC<LearningJourneyModalProps> = ({
  isOpen,
  onClose,
  onStartSimulation,
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
  });

  // Admin control flag: Phase 3 is ONLY unlocked when Admin selects the user for Upskilling
  const [isPhase3SelectedByAdmin, setIsPhase3SelectedByAdmin] = useState<boolean>(() => {
    const saved = localStorage.getItem('guruji_phase3_upskilling_enabled');
    return saved !== null ? saved === 'true' : false;
  });

  const [adminCampaigns, setAdminCampaigns] = useState<AdminJourneyCampaign[]>([]);

  // Refresh state from Admin controls whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const savedPhase3 = localStorage.getItem('guruji_phase3_upskilling_enabled');
      if (savedPhase3 !== null) {
        setIsPhase3SelectedByAdmin(savedPhase3 === 'true');
      }
      try {
        const savedCamps = JSON.parse(localStorage.getItem('guruji_admin_campaigns') || '[]');
        if (Array.isArray(savedCamps)) {
          setAdminCampaigns(savedCamps);
        }
      } catch {
        setAdminCampaigns([]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('guruji_phase3_upskilling_enabled', String(isPhase3SelectedByAdmin));
  }, [isPhase3SelectedByAdmin]);

  if (!isOpen) return null;

  const togglePhase = (phaseNum: number) => {
    sounds.playTap();
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseNum]: !prev[phaseNum],
    }));
  };

  // Custom modules pushed by Admin in Admin -> Assignments
  const customPhase1 = adminCampaigns.filter(
    (c) => c.journeyPhase === 'Phase 1: New Hire (Day 1–10)' && !['c1', 'c2', 'c3'].includes(c.id)
  );
  const customPhase2 = adminCampaigns.filter(
    (c) => c.journeyPhase === 'Phase 2: Continuous / Mandate' && !['c1', 'c2', 'c3'].includes(c.id)
  );
  const customPhase3 = adminCampaigns.filter(
    (c) => c.journeyPhase === 'Phase 3: Selective Upskilling' && !['c1', 'c2', 'c3'].includes(c.id)
  );

  const overallProgress = isPhase3SelectedByAdmin ? 68 : 88;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0A0A0C] border border-white/15 rounded-3xl p-5 sm:p-6 space-y-5 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header with Sky Blue Headline */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-sky-400 tracking-tight leading-snug">
              Employee Learning Journey
            </h2>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">
              Phase 1 (Day 1–10 New Hire) · Phase 2 (Continuous & Mandates) · Phase 3 (Admin-Selected Upskilling)
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overall Completion Progress */}
        <div className="p-4 bg-[#121215] border border-white/10 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Target size={15} className="text-white" />
              <span>Active Journey Readiness</span>
            </span>
            <span className="font-mono font-black text-white">{overallProgress}% Completed</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[#8E8E93]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              <span className="truncate">Phase 1 (Day 1–10): 100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
              <span className="truncate">Phase 2 (Mandates): 75%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/30 shrink-0" />
              <span className="truncate">
                Phase 3: {isPhase3SelectedByAdmin ? '30% Active' : 'Admin Invite Only'}
              </span>
            </div>
          </div>
        </div>

        {/* 3 COLLAPSIBLE PHASES LIST */}
        <div className="space-y-3 pt-1">
          
          {/* ============================================================
              PHASE 1: NEW HIRE (DAY 1 – DAY 10)
              ============================================================ */}
          <div className="rounded-2xl border border-white/10 bg-[#121215] overflow-hidden transition-all">
            <div
              onClick={() => togglePhase(1)}
              className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  1
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate">
                    Phase 1: New Hire Onboarding (Day 1 – Day 10)
                  </h3>
                  <p className="text-[11px] text-[#8E8E93] truncate">
                    Day 1 – Day 10 · Core SOPs & Manager Floor Readiness Sign-Off
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold">
                  100% Certified
                </span>
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                  {expandedPhases[1] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>
            </div>

            {expandedPhases[1] && (
              <div className="p-3.5 sm:p-4 pt-1 border-t border-white/10 space-y-2.5 bg-[#0A0A0C]/50 animate-in fade-in duration-200">
                {customPhase1.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 gap-3 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <Zap size={16} className="text-sky-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-xs truncate">{item.title}</h4>
                        <p className="text-[10px] text-sky-400/90 truncate">
                          Assigned by Admin · {item.sop}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        sounds.playTap();
                        onClose();
                        onStartSimulation(item.sopId || 'picking-101');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-slate-200 text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ml-2"
                    >
                      Start
                    </button>
                  </div>
                ))}

                {/* Day 1–3 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">
                        Day 1–3: Orientation & PPE Safety Baseline
                      </h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">
                        Assigned by Admin · Universal gowning, ESD & floor safety rules
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 shrink-0 ml-2">
                    Passed
                  </span>
                </div>

                {/* Day 4–7 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">
                        Day 4–7: Core Role SOP (Warehouse Order Picking 101)
                      </h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">
                        Know It · Show Me · Guide Me · Test Me (Score: 92%)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onClose();
                      onStartSimulation('picking-101');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-slate-200 text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ml-2"
                  >
                    Review
                  </button>
                </div>

                {/* Day 8–10 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">
                        Day 8–10: Manager Floor Observation & Readiness Gate
                      </h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">
                        Verified on floor by Manager · Graduated from New Hire Track
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 shrink-0 ml-2">
                    Manager Signed Off
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================
              PHASE 2: CONTINUOUS LEARNING (ONGOING · MANDATES · ANY TRAINING)
              ============================================================ */}
          <div className="rounded-2xl border border-white/10 bg-[#121215] overflow-hidden transition-all">
            <div
              onClick={() => togglePhase(2)}
              className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  2
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate">
                    Phase 2: Continuous Learning & Mandates
                  </h3>
                  <p className="text-[11px] text-[#8E8E93] truncate">
                    Ongoing · Mandatory Compliance, SOP Revisions & Assigned Drills
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold">
                  {1 + customPhase2.length} Mandate{customPhase2.length > 0 ? 's' : ''} Due
                </span>
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                  {expandedPhases[2] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>
            </div>

            {expandedPhases[2] && (
              <div className="p-3.5 sm:p-4 pt-1 border-t border-white/10 space-y-2.5 bg-[#0A0A0C]/50 animate-in fade-in duration-200">
                {customPhase2.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 gap-3 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <AlertCircle size={16} className="text-sky-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-xs truncate">[Admin Mandate] {item.title}</h4>
                        <p className="text-[10px] text-sky-400/90 truncate">
                          Pushed by Admin · {item.sop} · Target: {item.target}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        sounds.playTap();
                        onClose();
                        onStartSimulation(item.sopId || 'housekeeping_sanitization');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-slate-200 text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ml-2"
                    >
                      Start Mandate
                    </button>
                  </div>
                ))}

                {/* Mandate 2.1 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">
                        [Mandate] High-Bay Forklift & Floor Safety Refresher
                      </h4>
                      <p className="text-[10px] text-amber-300/90 truncate">
                        Pushed by Admin · Due in 3 Days · Tracked by Manager
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onClose();
                      onStartSimulation('safety-first');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-slate-200 text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ml-2"
                  >
                    Start Mandate
                  </button>
                </div>

                {/* Ongoing 2.2 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">
                        [SOP Update v2.4] Room Sanitization & Dwell Time Protocol
                      </h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">
                        Completed Oct 14, 2026 · Manager Verified
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 shrink-0 ml-2">
                    Compliant
                  </span>
                </div>

                {/* Ongoing 2.3 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <Clock size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">
                        [Ongoing Drill] Cycle Count & Stock Discrepancy Calibration
                      </h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">
                        Assigned by Manager · Digital Passed (Awaiting Manager Check)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onClose();
                      onStartSimulation('inventory-count');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold border border-white/15 transition-all cursor-pointer shrink-0 ml-2"
                  >
                    Practice
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================
              PHASE 3: SELECTIVE UPSKILLING (ONLY WHEN ADMIN SELECTS USER)
              ============================================================ */}
          <div className="rounded-2xl border border-white/10 bg-[#121215] overflow-hidden transition-all">
            <div
              onClick={() => togglePhase(3)}
              className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  3
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate">
                    Phase 3: Selective Upskilling
                  </h3>
                  <p className="text-[11px] text-[#8E8E93] truncate">
                    {isPhase3SelectedByAdmin
                      ? 'Selected by Admin · Target: Senior Floor Lead / QA Inspector'
                      : 'Admin Nomination Only · Unlocks when Admin selects you for Upskilling'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                {isPhase3SelectedByAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold flex items-center gap-1">
                    <Unlock size={10} />
                    <span>Selected · 30%</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[#8E8E93] border border-white/10 text-[10px] font-bold flex items-center gap-1">
                    <Lock size={10} />
                    <span>By Admin Selection</span>
                  </span>
                )}
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                  {expandedPhases[3] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>
            </div>

            {expandedPhases[3] && (
              <div className="p-3.5 sm:p-4 pt-1 border-t border-white/10 space-y-3 bg-[#0A0A0C]/50 animate-in fade-in duration-200">
                {!isPhase3SelectedByAdmin ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Lock size={16} className="text-[#8E8E93] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-white">
                          Phase 3 is controlled by Admin Selection
                        </p>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-relaxed">
                          This track only activates when an Admin nominates you in Admin → Users for role advancement or cross-department upskilling.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        sounds.playTap();
                        setIsPhase3SelectedByAdmin(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10px] font-bold shrink-0 cursor-pointer transition-all"
                    >
                      Simulate Admin Unlock
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px]">
                      <span className="text-slate-300 font-medium">
                        Admin Nomination Active: <strong>Senior Floor Lead Track</strong>
                      </span>
                      <button
                        onClick={() => {
                          sounds.playTap();
                          setIsPhase3SelectedByAdmin(false);
                        }}
                        className="text-[10px] text-[#8E8E93] hover:text-white underline cursor-pointer"
                      >
                        Lock Track
                      </button>
                    </div>

                    {customPhase3.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1.5 gap-3 text-xs">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <Zap size={16} className="text-sky-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-white text-xs truncate">{item.title}</h4>
                            <p className="text-[10px] text-sky-400/90 truncate">
                              Admin Upskilling Assignment · {item.sop}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            sounds.playTap();
                            onClose();
                            onStartSimulation(item.sopId || 'picking-101');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-slate-200 text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ml-2"
                        >
                          Start
                        </button>
                      </div>
                    ))}

                    {/* Milestone 3.1 */}
                    <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-white text-xs truncate">
                            Cross-Department Ops: Packing & Dunnage Protocol
                          </h4>
                          <p className="text-[10px] text-[#8E8E93] truncate">
                            Assigned by Admin · Completed
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 shrink-0 ml-2">
                        Mastered
                      </span>
                    </div>

                    {/* Milestone 3.2 */}
                    <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <Zap size={16} className="text-white shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-white text-xs truncate">
                            Quality Assurance Audit & Defect Root-Cause Analysis
                          </h4>
                          <p className="text-[10px] text-[#8E8E93] truncate">
                            Active Upskilling Module · 60% Progress
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playTap();
                          onClose();
                          onStartSimulation('aseptic-hygiene');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white text-black hover:bg-slate-200 text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ml-2"
                      >
                        Continue
                      </button>
                    </div>

                    {/* Milestone 3.3 */}
                    <div className="flex items-center justify-between py-1.5 gap-3 text-xs opacity-75">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <ShieldCheck size={16} className="text-[#8E8E93] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-white text-xs truncate">
                            Shift Leadership, Mentorship & Floor Audits
                          </h4>
                          <p className="text-[10px] text-[#8E8E93] truncate">
                            Requires Manager Final Certification Sign-Off
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#8E8E93] bg-white/5 px-2 py-0.5 rounded border border-white/10 shrink-0 ml-2">
                        Next Role
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-xs text-[#8E8E93]">
            Controlled by Admin · Verified on floor by Manager
          </span>

          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default LearningJourneyModal;
