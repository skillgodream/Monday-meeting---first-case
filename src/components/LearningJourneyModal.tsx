import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ShieldCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface LearningJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSimulation: (lessonId: string) => void;
}

export const LearningJourneyModal: React.FC<LearningJourneyModalProps> = ({
  isOpen,
  onClose,
  onStartSimulation,
}) => {
  // State for collapsible phase tabs (collapsed by default when landing on page)
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const togglePhase = (phaseNum: number) => {
    sounds.playTap();
    setExpandedPhases(prev => ({
      ...prev,
      [phaseNum]: !prev[phaseNum]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0A0A0C] border border-white/15 rounded-3xl p-5 sm:p-6 space-y-5 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header with Sky Blue Headline */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl font-black text-sky-400 tracking-tight leading-snug">
            Employee Learning Journey
          </h2>

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

        {/* Overall Completion Progress (Flat monochrome bar) */}
        <div className="p-4 bg-[#121215] border border-white/10 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Target size={15} className="text-white" />
              <span>Overall Roadmap Progress</span>
            </span>
            <span className="font-mono font-black text-white">68% Completed</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white w-[68%]" />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[#8E8E93]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              <span className="truncate">Phase 1: 100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
              <span className="truncate">Phase 2: 75%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/30 shrink-0" />
              <span className="truncate">Phase 3: 30%</span>
            </div>
          </div>
        </div>

        {/* 3 COLLAPSIBLE PHASES LIST */}
        <div className="space-y-3 pt-1">
          
          {/* PHASE 1: ONBOARDING */}
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
                  <h3 className="text-sm font-extrabold text-white truncate">Phase 1: Onboarding</h3>
                  <p className="text-[11px] text-[#8E8E93] truncate">Day 1 – Day 90 · Floor Readiness Qualification</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold">
                  100% Completed
                </span>
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                  {expandedPhases[1] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>
            </div>

            {/* Collapsible Content */}
            {expandedPhases[1] && (
              <div className="p-3.5 sm:p-4 pt-1 border-t border-white/10 space-y-2.5 bg-[#0A0A0C]/50 animate-in fade-in duration-200">
                
                {/* Milestone 1.1 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">Orientation & PPE Safety Baseline</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">Universal gowning, ESD, & cleanroom rules</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 shrink-0 ml-2">
                    Passed
                  </span>
                </div>

                {/* Milestone 1.2 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">Core Warehouse Order Picking (Picking 101)</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">Barcode scanning & tote loading drills</p>
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

                {/* Milestone 1.3 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">Shift Readiness & Process Passport Audit</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">85%+ score verified by Floor Supervisor</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 shrink-0 ml-2">
                    Certified
                  </span>
                </div>

              </div>
            )}
          </div>

          {/* PHASE 2: CONTINUOUS LEARNING */}
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
                  <h3 className="text-sm font-extrabold text-white truncate">Phase 2: Continuous Learning</h3>
                  <p className="text-[11px] text-[#8E8E93] truncate">Ongoing · Refresher Drills & Audit Re-Certification</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold">
                  75% Active
                </span>
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                  {expandedPhases[2] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>
            </div>

            {/* Collapsible Content */}
            {expandedPhases[2] && (
              <div className="p-3.5 sm:p-4 pt-1 border-t border-white/10 space-y-2.5 bg-[#0A0A0C]/50 animate-in fade-in duration-200">
                
                {/* Milestone 2.1 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">Monthly Room Sanitization & Dwell Time Drill</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">Completed Oct 14, 2026</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15 shrink-0 ml-2">
                    Current
                  </span>
                </div>

                {/* Milestone 2.2 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <Clock size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">Quarterly High-Bay Forklift Safety Refresher</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">Due in 5 Days · Mandatory Compliance</p>
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
                    Take Drill
                  </button>
                </div>

                {/* Milestone 2.3 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">Cycle Count & Stock Discrepancy Calibration</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">Blind count accuracy 92% verified</p>
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
                    Review
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* PHASE 3: UPSKILLING */}
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
                  <h3 className="text-sm font-extrabold text-white truncate">Phase 3: Upskilling</h3>
                  <p className="text-[11px] text-[#8E8E93] truncate">Target: Senior Floor Lead / QA Inspector</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold">
                  30% In Progress
                </span>
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8E8E93]">
                  {expandedPhases[3] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>
            </div>

            {/* Collapsible Content */}
            {expandedPhases[3] && (
              <div className="p-3.5 sm:p-4 pt-1 border-t border-white/10 space-y-2.5 bg-[#0A0A0C]/50 animate-in fade-in duration-200">
                
                {/* Milestone 3.1 */}
                <div className="flex items-center justify-between py-1.5 gap-3 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs truncate">Cross-Department Ops: Packing & Dunnage Protocol</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">Logistics Module Completed</p>
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
                      <h4 className="font-bold text-white text-xs truncate">Quality Assurance Audit & Defect Root-Cause Analysis</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">Active Upskilling Module · 60% Progress</p>
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
                      <h4 className="font-bold text-white text-xs truncate">Shift Leadership, Mentorship & Floor Audits</h4>
                      <p className="text-[10px] text-[#8E8E93] truncate">Locked · Unlocks upon QA Certification</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#8E8E93] bg-white/5 px-2 py-0.5 rounded border border-white/10 shrink-0 ml-2">
                    Next Role
                  </span>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-xs text-[#8E8E93]">
            Tracked automatically via shift audit logs
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
