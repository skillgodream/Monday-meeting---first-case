import React, { useState } from 'react';
import { 
  Upload, Camera, Sparkles, ArrowRight, ShieldCheck, FileText, Play, BookOpen,
  HelpCircle, Layers, CheckCircle2, Award, Zap, BrainCircuit, ChevronRight, Settings, GraduationCap
} from 'lucide-react';
import { Lesson } from '../types';
import { sounds } from '../utils/audio';
import { UserRole } from '../components/RoleNavigationModal';

interface HomeScreenProps {
  lessons: Lesson[];
  onScanClick: () => void;
  onUploadClick: () => void;
  onSelectSop: (lessonId: string, title?: string) => void;
  onExploreLibrary: () => void;
  onOpenPassport: () => void;
  onShowGurujiWelcome?: () => void;
  onOpenLearningJourney?: () => void;
  userRole?: UserRole;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  lessons,
  onScanClick,
  onUploadClick,
  onSelectSop,
  onExploreLibrary,
  onOpenPassport,
  onShowGurujiWelcome,
  onOpenLearningJourney,
  userRole = 'learn',
}) => {
  const [activeTab, setActiveTab] = useState<'module' | 'quiz' | 'other' | null>(null);

  // Standalone Quizzes Data
  const standaloneQuizzes = [
    {
      id: 'quiz_housekeeping',
      lessonId: lessons[0]?.id || 'housekeeping_sanitization',
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
      lessonId: lessons[1]?.id || 'ecommerce_order_picking',
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
      lessonId: lessons[2]?.id || 'forklift_pallet_stacking',
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
      lessonId: lessons[3]?.id || 'inventory_cycle_count',
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

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-28 space-y-5 max-w-lg mx-auto w-full animate-in fade-in duration-200">
      
      {/* Overview Navigation Sections */}


      {activeTab === null ? (
        <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
          {/* 1. Module Card */}
          <div
            onClick={() => {
              sounds.playTap();
              setActiveTab('module');
            }}
            className="p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-[24px] border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-xl group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-transparent border-2 border-rose-500 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-rose-400 transition-all">
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
              setActiveTab('quiz');
            }}
            className="p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-[24px] border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-xl group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-transparent border-2 border-rose-500 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-rose-400 transition-all">
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
              setActiveTab('other');
            }}
            className="p-5 bg-[#0A0A0C] hover:bg-[#121215] rounded-[24px] border border-white/10 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-xl group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-transparent border-2 border-rose-500 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-rose-400 transition-all">
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
                setActiveTab(null);
              }}
              className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>← Back to Overview</span>
            </button>

            <div className="flex items-center gap-1 bg-[#0A0A0C] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('module');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  activeTab === 'module' ? 'bg-white text-black font-extrabold' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                Module
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('quiz');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  activeTab === 'quiz' ? 'bg-white text-black font-extrabold' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                Quiz
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('other');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  activeTab === 'other' ? 'bg-white text-black font-extrabold' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                Others
              </button>
            </div>
          </div>

          {/* TAB 1: MODULE COMPETENCY BREAKDOWN */}
          {activeTab === 'module' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <BrainCircuit size={14} className="text-indigo-400" />
                    <span>Module Competency Breakdown</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Core operational SOP modules and skill breakdown
                  </p>
                </div>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onExploreLibrary();
                  }}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <span>View All</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="space-y-2.5">
                {lessons.slice(0, 4).map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      sounds.playTap();
                      onSelectSop(lesson.id, lesson.title);
                    }}
                    className="group flex items-center justify-between p-4 bg-[#12151E]/80 hover:bg-[#1A1E2C]/90 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 shadow-md active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 font-black text-sm group-hover:scale-105 transition-transform">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Module {idx + 1}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                            {lesson.category}
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">
                            {lesson.stepsCount || 5} Steps
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate mt-1">
                          {lesson.title}
                        </h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {lesson.subtitle || lesson.description}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all ml-2">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Process Passport Audit Banner */}
              <div
                onClick={() => {
                  sounds.playTap();
                  onOpenPassport();
                }}
                className="p-4 bg-[#12151E]/80 hover:bg-[#1A1E2C]/90 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all shadow-md mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 text-amber-400 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Process Passport Audit</h4>
                    <p className="text-[11px] text-slate-400">Review operational controls & safety rules</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  Review →
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: STANDALONE QUIZZES */}
          {activeTab === 'quiz' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-400" />
                    <span>Standalone Quizzes</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
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
                      onSelectSop(quiz.lessonId, quiz.title);
                    }}
                    className={`p-4 bg-gradient-to-r ${quiz.color} bg-[#12151E]/90 hover:bg-[#1A1E2C]/95 backdrop-blur-xl rounded-2xl border ${quiz.borderColor} shadow-lg transition-all cursor-pointer space-y-3 group active:scale-[0.99]`}
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
                      <span className="text-slate-400 font-medium">Standalone Quiz</span>
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
          {activeTab === 'other' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center py-12 px-6 bg-[#12151E]/80 backdrop-blur-xl rounded-3xl border border-white/10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                  <Sparkles size={22} className="text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Other Resources & Tools</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
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

    </div>
  );
};


