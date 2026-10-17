import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  Zap,
  RotateCcw,
  Clock,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  Play,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  FileText,
  Settings
} from 'lucide-react';
import { Lesson } from '../types';
import ClayArt from './ClayArt';
import { sounds } from '../utils/audio';

interface ProgressViewProps {
  lessons: Lesson[];
  onStartSimulation: (lessonId: string) => void;
}

type ArtType = 'scanner' | 'box' | 'tote' | 'safety' | 'clipboard' | 'trolley' | 'medal' | 'guru' | 'printer' | 'tape';

interface ProgressModuleItem {
  id: string;
  title: string;
  subtitle: string;
  masteryPercentage: number;
  artType: ArtType;
  statusText: string;
  statusColor: string;
}

export default function ProgressView({ lessons, onStartSimulation }: ProgressViewProps) {
  // Main Sections (Module, Quiz, Others) - default null shows vertical cards stack
  const [activeSection, setActiveSection] = useState<'module' | 'quiz' | 'other' | null>(null);

  // Sub-Category Tab for Module Competency Breakdown ('practice', 'pending', 'not_started')
  const [moduleFilter, setModuleFilter] = useState<'practice' | 'pending' | 'not_started'>('practice');

  // Defined Module Categorization
  const practiceModules: ProgressModuleItem[] = [
    {
      id: 'housekeeping_sanitization',
      title: 'Housekeeping: Room Sanitization',
      subtitle: 'Hospitality SOP · 5 steps',
      masteryPercentage: 94,
      artType: 'trolley',
      statusText: 'Completed',
      statusColor: 'emerald',
    },
    {
      id: 'picking-101',
      title: 'Warehouse Order Picking (Picking 101)',
      subtitle: 'Logistics SOP · 9 steps',
      masteryPercentage: 88,
      artType: 'tote',
      statusText: 'Completed',
      statusColor: 'emerald',
    },
    {
      id: 'inventory-count',
      title: 'Cycle Count & Stock Discrepancy',
      subtitle: 'Inventory SOP · 6 steps',
      masteryPercentage: 92,
      artType: 'clipboard',
      statusText: 'Completed',
      statusColor: 'emerald',
    },
  ];

  const pendingModules: ProgressModuleItem[] = [
    {
      id: 'packing-basics',
      title: 'Packing Basics & Dunnage Protocol',
      subtitle: 'Packing SOP · 4 steps',
      masteryPercentage: 60,
      artType: 'box',
      statusText: 'In Progress',
      statusColor: 'indigo',
    },
    {
      id: 'aseptic-hygiene',
      title: 'Aseptic Hand Hygiene & Cleanroom Gowning',
      subtitle: 'Cleanroom SOP · 6 steps',
      masteryPercentage: 45,
      artType: 'safety',
      statusText: 'In Progress',
      statusColor: 'indigo',
    },
  ];

  const notStartedModules: ProgressModuleItem[] = [
    {
      id: 'safety-first',
      title: 'Safety First: Warehouse Floor Rules',
      subtitle: 'Safety SOP · 5 steps',
      masteryPercentage: 0,
      artType: 'safety',
      statusText: 'Not Started',
      statusColor: 'amber',
    },
    {
      id: 'fire-safety',
      title: 'Emergency Exit & Fire Extinguisher Protocol',
      subtitle: 'Safety SOP · 4 steps',
      masteryPercentage: 0,
      artType: 'clipboard',
      statusText: 'Queued',
      statusColor: 'slate',
    },
    {
      id: 'customer-service-1',
      title: 'Customer Grievance & Escalation Handling',
      subtitle: 'Customer Service SOP · 5 steps',
      masteryPercentage: 0,
      artType: 'tote',
      statusText: 'Queued',
      statusColor: 'slate',
    },
  ];

  // Standalone Quizzes Data
  const standaloneQuizzes = [
    {
      id: 'quiz_housekeeping',
      lessonId: 'housekeeping_sanitization',
      title: 'Room Sanitization & Dwell Time Drill',
      category: 'Safety',
      questionsCount: 4,
      duration: '5 min',
      passingScore: '80%',
      description: 'Test your understanding of chemical dilution ratios, contact dwell times, and high-touch surface protocols.',
      color: 'from-sky-500/20 to-blue-600/20',
      borderColor: 'border-sky-500/30'
    },
    {
      id: 'quiz_picking',
      lessonId: 'picking-101',
      title: 'E-Commerce Order Picking & Scanner Quiz',
      category: 'Picking',
      questionsCount: 5,
      duration: '6 min',
      passingScore: '85%',
      description: 'Evaluate handheld scanner verification, pick route optimization, and damaged item escalation.',
      color: 'from-indigo-500/20 to-purple-600/20',
      borderColor: 'border-indigo-500/30'
    },
    {
      id: 'quiz_safety',
      lessonId: 'safety-first',
      title: 'Forklift & High-Bay Pallet Stacking Safety',
      category: 'Safety',
      questionsCount: 6,
      duration: '8 min',
      passingScore: '90%',
      description: 'Mandatory safety check on load center balancing, tilt control, and rack alignment procedures.',
      color: 'from-amber-500/20 to-orange-600/20',
      borderColor: 'border-amber-500/30'
    },
    {
      id: 'quiz_inventory',
      lessonId: 'inventory-count',
      title: 'Inventory Cycle Count & Bin Audit Drill',
      category: 'Inventory',
      questionsCount: 4,
      duration: '5 min',
      passingScore: '80%',
      description: 'Scenario assessment on blind count accuracy, variance threshold reporting, and bin tag verification.',
      color: 'from-emerald-500/20 to-teal-600/20',
      borderColor: 'border-emerald-500/30'
    }
  ];

  // Key Frontline Metrics
  const totalAssigned = 8;
  const completedCount = practiceModules.length;
  const pendingCount = pendingModules.length;
  const notStartedCount = notStartedModules.length;
  const delayedCount = 1;

  const avgMastery = Math.round(
    [...practiceModules, ...pendingModules].reduce((acc, curr) => acc + curr.masteryPercentage, 0) /
      (practiceModules.length + pendingModules.length)
  ) || 76;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-6 pt-4 pb-28 space-y-5 text-white relative z-10 animate-in fade-in duration-200 w-full max-w-2xl mx-auto font-sans select-none">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Your Progress</h1>
        <p className="text-xs text-[#8E8E93] font-normal mt-0.5">
          Mastery metrics & floor readiness evaluation
        </p>
      </div>

      {/* 1. HERO DASHBOARD CARD (Circle Ring Graphic + 5 Metrics Grid) */}
      <div className="bg-[#0A0A0C] rounded-2xl p-5 sm:p-6 text-white shadow-2xl border border-white/10 relative overflow-hidden space-y-5">
        
        {/* Top Status Badge */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20">
            FLOOR READY
          </span>
          <span className="text-xs font-semibold text-[#8E8E93]">Level 2 Certified</span>
        </div>

        {/* Hero Circular Ring + Qualification Title */}
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Circle Mastery Ring */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.12)" strokeWidth="8" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#FFFFFF"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 - (avgMastery / 100) * 2 * Math.PI * 42}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white font-mono">{avgMastery}%</span>
              <span className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider">MASTERY</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
              Warehouse Floor Qualification
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              3 of 4 core modules mastered with high accuracy. Ready for active shift operations.
            </p>
          </div>
        </div>

        {/* 5-Metrics Row (Pure Black & White, No Card Nesting, Un-truncated Small Labels) */}
        <div className="grid grid-cols-5 gap-1 text-center pt-3 border-t border-white/10">
          <div className="flex flex-col items-center justify-center py-1 px-0.5">
            <span className="text-lg font-black font-mono text-white leading-none">{totalAssigned}</span>
            <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1">Assigned</span>
          </div>

          <div className="flex flex-col items-center justify-center py-1 px-0.5">
            <span className="text-lg font-black font-mono text-white leading-none">{completedCount}</span>
            <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1">Completed</span>
          </div>

          <div className="flex flex-col items-center justify-center py-1 px-0.5">
            <span className="text-lg font-black font-mono text-white leading-none">{pendingCount}</span>
            <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1">Pending</span>
          </div>

          <div className="flex flex-col items-center justify-center py-1 px-0.5">
            <span className="text-lg font-black font-mono text-white leading-none">{notStartedCount}</span>
            <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1 whitespace-nowrap">Not Started</span>
          </div>

          <div className="flex flex-col items-center justify-center py-1 px-0.5">
            <span className="text-lg font-black font-mono text-white leading-none">{delayedCount}</span>
            <span className="text-[9px] font-medium text-slate-300 leading-tight mt-1">Delayed</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onStartSimulation('picking-101');
          }}
          className="w-full h-11 rounded-xl bg-white text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-98 transition-all cursor-pointer shadow-md"
        >
          <RotateCcw size={16} />
          <span>Run Shift Readiness Drill</span>
        </button>
      </div>

      {/* 2. VERTICAL CARDS STACK (Module · Quiz · Others) OR SECTION ACTIVE HEADER */}
      {activeSection === null ? (
        <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
          {/* 1. Module Card */}
          <div
            onClick={() => {
              sounds.playTap();
              setActiveSection('module');
            }}
            className="p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-[24px] border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-xl group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white tracking-tight">Module</h3>
                <p className="text-xs sm:text-sm text-[#8E8E93] font-normal mt-0.5 leading-relaxed">
                  Manage training modules, content and access
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 2. Quiz Card */}
          <div
            onClick={() => {
              sounds.playTap();
              setActiveSection('quiz');
            }}
            className="p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-[24px] border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-xl group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white tracking-tight">Quiz</h3>
                <p className="text-xs sm:text-sm text-[#8E8E93] font-normal mt-0.5 leading-relaxed">
                  Create and manage quiz questions and assignments
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 3. Others Card */}
          <div
            onClick={() => {
              sounds.playTap();
              setActiveSection('other');
            }}
            className="p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-[24px] border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-xl group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Settings size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white tracking-tight">Others</h3>
                <p className="text-xs sm:text-sm text-[#8E8E93] font-normal mt-0.5 leading-relaxed">
                  Access additional settings and preferences
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#8E8E93] shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          {/* Back Header */}
          <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10">
            <button
              onClick={() => {
                sounds.playTap();
                setActiveSection(null);
              }}
              className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>← Back to Overview</span>
            </button>

            <div className="flex items-center gap-1 bg-[#0A0A0C] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSection('module');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  activeSection === 'module' ? 'bg-white text-black font-extrabold' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                Module
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSection('quiz');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  activeSection === 'quiz' ? 'bg-white text-black font-extrabold' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                Quiz
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSection('other');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  activeSection === 'other' ? 'bg-white text-black font-extrabold' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                Others
              </button>
            </div>
          </div>

          {/* TAB 1: MODULE COMPETENCY BREAKDOWN */}
          {activeSection === 'module' && (
        <div className="space-y-3 pt-1 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
              <BrainCircuit size={14} className="text-indigo-400" />
              <span>Module Competency Breakdown</span>
            </h3>
          </div>

          {/* Sub-Filter Buttons Row */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0A0A0C] rounded-xl border border-white/10">
            <button
              onClick={() => {
                sounds.playTap();
                setModuleFilter('practice');
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                moduleFilter === 'practice'
                  ? 'bg-white text-black shadow-sm font-extrabold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Practice ({practiceModules.length})
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setModuleFilter('pending');
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                moduleFilter === 'pending'
                  ? 'bg-white text-black shadow-sm font-extrabold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Pending ({pendingModules.length})
            </button>

            <button
              onClick={() => {
                sounds.playTap();
                setModuleFilter('not_started');
              }}
              className={`py-2 px-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                moduleFilter === 'not_started'
                  ? 'bg-white text-black shadow-sm font-extrabold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Not Started ({notStartedCount})
            </button>
          </div>

          {/* Expanded Modules Container - Smart Grid Layout */}
          <div className="space-y-2.5 pt-1">
            {/* SUB-TAB 1: PRACTICE MODULES */}
            {moduleFilter === 'practice' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {practiceModules.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center shrink-0">
                        <ClayArt type={item.artType} size={24} />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold font-mono">
                        {item.masteryPercentage}% Mastery
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">{item.subtitle}</p>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playTap();
                        onStartSimulation(item.id);
                      }}
                      className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play size={13} className="fill-white" />
                      <span>Practice Drill</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* SUB-TAB 2: PENDING MODULES */}
            {moduleFilter === 'pending' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pendingModules.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center shrink-0">
                        <ClayArt type={item.artType} size={24} />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold font-mono">
                        {item.masteryPercentage}% Progress
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">{item.subtitle}</p>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playTap();
                        onStartSimulation(item.id);
                      }}
                      className="w-full py-2 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer shadow-md"
                    >
                      <Play size={13} className="fill-black" />
                      <span>Continue Drill</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* SUB-TAB 3: NOT STARTED MODULES */}
            {moduleFilter === 'not_started' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notStartedModules.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center shrink-0">
                        <ClayArt type={item.artType} size={24} />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-[#8E8E93] border border-white/10 text-[10px] font-bold">
                        Queued
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">{item.subtitle}</p>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playTap();
                        onStartSimulation(item.id);
                      }}
                      className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Start Module</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STANDALONE QUIZZES */}
      {activeSection === 'quiz' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Award size={14} className="text-amber-400" />
                <span>Standalone Quizzes</span>
              </h3>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                Test operational knowledge and compliance with standalone quizzes
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              {standaloneQuizzes.length} Quizzes
            </span>
          </div>

          <div className="space-y-3">
            {standaloneQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => {
                  sounds.playTap();
                  onStartSimulation(quiz.lessonId);
                }}
                className={`p-4 bg-gradient-to-r ${quiz.color} bg-[#0A0A0C] hover:bg-[#121215] rounded-2xl border ${quiz.borderColor} shadow-lg transition-all cursor-pointer space-y-3 group active:scale-[0.99]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/10">
                        {quiz.category}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-300">
                        {quiz.questionsCount} Questions · {quiz.duration}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Pass: {quiz.passingScore}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                      {quiz.title}
                    </h3>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-black transition-all">
                    <Zap size={16} />
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {quiz.description}
                </p>

                <div className="pt-1 flex items-center justify-between border-t border-white/10 text-xs">
                  <span className="text-[#8E8E93] font-medium">Standalone Quiz</span>
                  <span className="text-amber-300 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Take Quiz</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OTHER (Empty for a while) */}
      {activeSection === 'other' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="text-center py-12 px-6 bg-[#0A0A0C] rounded-3xl border border-white/10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <Sparkles size={22} className="text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Other Resources & Tools</h3>
              <p className="text-xs text-[#8E8E93] max-w-xs mx-auto leading-relaxed">
                This space is currently empty as requested. Custom extensions and supplementary media decks will appear here.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-slate-400">
                <span>Reserved Section</span>
              </span>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* 4. EARNED BADGES */}
      <div className="bg-[#0A0A0C] rounded-2xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-amber-400 shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
            Earned Badges
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold text-white">
          <div className="p-3 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Zero Short Error</span>
          </div>

          <div className="p-3 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-center gap-2.5">
            <Zap size={16} className="text-amber-400 shrink-0" />
            <span>Sub-2min Pick Rate</span>
          </div>
        </div>
      </div>

    </div>
  );
}

