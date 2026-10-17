import React, { useState, useMemo } from 'react';
import { SlidePlan } from './types';
import { Lesson, SlidePage } from '../types';
import { WelcomePage } from './pages/WelcomePage';
import { findBestVisualMatch } from '../utils/visualLibraryMatcher';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Play, Sparkles, Sliders, Layers, Zap } from 'lucide-react';
import { sounds } from '../utils/audio';

export interface BentoCardItem {
  label: string;
  value: string;
  subtext: string;
  tag?: string;
  tagType?: 'default' | 'positive' | 'negative' | 'warning';
  why?: string;
  action?: string;
  consequence?: string;
}

export interface BentoModuleConfig {
  num: number;
  tabLabel: string;
  badge: string;
  layoutType: 'grid_4' | 'split_2' | 'sequence_3' | 'hero_photo_traps' | 'scorecard_cta';
  layoutName: string;
  title: string;
  subtitle: string;
  cards: BentoCardItem[];
  photoUrl: string;
  photoCaption: string;
  extraDetails?: any;
}

interface ExperiencePlayerProps {
  plan: SlidePlan;
  lesson?: Lesson;
  onClose: () => void;
  onComplete?: () => void;
}

/**
 * Dynamic Domain Extractor: Parses lesson/blueprint data into 6 Apple-grade Bento Module Archetypes
 */
function extractBentoModulesFromLesson(lesson?: Lesson, plan?: SlidePlan): BentoModuleConfig[] {
  const sopTitle = lesson?.title || plan?.title || 'Standard Operating Procedure';
  const sopRole = lesson?.subtitle?.replace(/^Role:\s*/i, '') || (lesson?.operationalBlueprint as any)?.role || 'Frontline Specialist';
  const opBlueprint = lesson?.operationalBlueprint;

  // 1. MODULE 01: Parameters & Numeric Limits (Type A: 4-Card Bento Grid 2x2)
  const controls: any[] = opBlueprint?.critical_controls || [];
  const tools: any[] = opBlueprint?.tools_and_systems || [];

  const c0 = controls[0];
  const c1 = controls[1];
  const val0 = c0 ? (typeof c0 === 'string' ? (c0 as string).substring(0, 18) : (c0 as any).rule || '2.1 - 2.4 bar') : '2.1 - 2.4 bar';
  const val1 = c1 ? (typeof c1 === 'string' ? (c1 as string).substring(0, 18) : (c1 as any).rule || '121.5°C') : '121.5°C';

  const mod1Cards: BentoCardItem[] = [
    {
      label: 'PRIMARY OPERATING WINDOW',
      value: val0,
      subtext: 'Mandatory operating pressure & flow limit.',
      tag: 'CONTROL 01',
      tagType: 'positive',
    },
    {
      label: 'DWELL & THERMAL TARGET',
      value: val1,
      subtext: 'Continuous thermal contact threshold required.',
      tag: 'TARGET 02',
      tagType: 'default',
    },
    {
      label: 'MAXIMUM HOLD DURATION',
      value: '30 Min',
      subtext: 'Maximum permissible dwell before audit re-check.',
      tag: 'LIMIT 03',
      tagType: 'warning',
    },
    {
      label: 'HALT & CRITICAL BOUNDARY',
      value: '< 2.05 bar',
      subtext: 'Immediate process halt trigger if breached.',
      tag: 'CRITICAL HALT',
      tagType: 'negative',
    },
  ];

  // 2. MODULE 02: Foundational Principles (Type B: 2-Card Dual Split Compare)
  const terminology = opBlueprint?.terminology || [];
  const mod2Cards: BentoCardItem[] = [
    {
      label: 'MANDATORY OPERATIONAL STANDARD',
      value: terminology[0] ? terminology[0].term : 'Verified Identity & Seal Check',
      subtext: terminology[0] ? terminology[0].meaning : 'Match serial tags and inspect physical security seals prior to line entry.',
      tag: 'MANDATORY REQUIREMENT',
      tagType: 'positive',
      why: 'Prevents unverified materials from entering the active operational stream.',
    },
    {
      label: 'ABSOLUTE RESTRICTION & NON-NEGOTIABLE',
      value: tools[0] ? `Never bypass ${tools[0].name}` : 'Zero Custom Workarounds',
      subtext: tools[0] ? (tools[0].never_do || 'Do not bypass automated calibration interlocks.') : 'Improvised procedures or unverified bypasses violate ISO compliance.',
      tag: 'ZERO TOLERANCE',
      tagType: 'negative',
      why: 'Protects frontline operators and prevents irreversible equipment contamination.',
    },
  ];

  // 3. MODULE 03: Sequential Flow & Milestones (Type C: 3-Card Sequential Flow)
  const opSteps = opBlueprint?.operational_steps || [];
  const mod3Cards: BentoCardItem[] = opSteps.length >= 3
    ? opSteps.slice(0, 3).map((s, idx) => ({
        label: `PHASE 0${idx + 1} MILESTONE`,
        value: s.instruction,
        subtext: s.why_it_matters || 'Strict sequential execution required.',
        tag: `0${idx + 1}`,
        why: `Category: ${s.category || 'Operational Step'}`,
      }))
    : [
        {
          label: 'PHASE 01 PREPARATION',
          value: 'Verify Active Work Order & Calibrate Telemetry Gauges',
          subtext: 'Confirm SKU batch identity and perform zero-point pressure sensor audit.',
          tag: '01',
          why: 'Ensures equipment readiness before introducing live material.',
        },
        {
          label: 'PHASE 02 RUN EXECUTION',
          value: 'Execute Sequence & Monitor Real-Time Thresholds',
          subtext: 'Maintain parameters within the approved operating window continuously.',
          tag: '02',
          why: 'Guarantees uniform process quality and zero-defect output.',
        },
        {
          label: 'PHASE 03 QUALITY SIGN-OFF',
          value: 'Record Transaction Timestamp & Complete Handover',
          subtext: 'Log digital audit trail entry and secure physical verification tags.',
          tag: '03',
          why: 'Provides unbroken chain-of-custody for administrative review.',
        },
      ];

  // 4. MODULE 04: Scenarios & Decision Matrix (Type B: 2-Card Dual Split Scenario)
  const decisionPoints = opBlueprint?.decision_points || [];
  const mod4Cards: BentoCardItem[] = decisionPoints.length >= 2
    ? decisionPoints.slice(0, 2).map((d, idx) => ({
        label: `SCENARIO 0${idx + 1}: ${d.situation}`,
        value: d.action || 'Apply documented acceptance criteria strictly.',
        subtext: d.decision || 'Follow approved operating decision matrix without improvisation.',
        tag: `FIELD CONDITION 0${idx + 1}`,
        tagType: 'default',
        why: 'Company policy governs disposition; verbal promises create compliance liabilities.',
      }))
    : [
        {
          label: 'SCENARIO 01: SENSOR READOUT FLUCTUATES NEAR BOUNDARY',
          value: 'Pause execution and initiate secondary verification protocol immediately.',
          subtext: 'Re-calibrate digital sensor against physical analog gauge before continuing.',
          tag: 'CONDITION 01',
          tagType: 'warning',
          why: 'Prevents false-positive completions during micro-spikes.',
        },
        {
          label: 'SCENARIO 02: NETWORK DISCONNECTION DURING HANDOVER',
          value: 'Switch to offline ledger logging and record manual supervisor timestamp.',
          subtext: 'Re-sync records automatically once network link is restored.',
          tag: 'CONDITION 02',
          tagType: 'default',
          why: 'Maintains operational continuity without compromising data integrity.',
        },
      ];

  // 5. MODULE 05: Failure Modes & Traps (Type D: Photo-Hero Focal + 2 Trap Warning Cards)
  const commonMistakes = opBlueprint?.common_mistakes || [];
  const mod5Cards: BentoCardItem[] = commonMistakes.length >= 2
    ? commonMistakes.slice(0, 2).map((m, idx) => ({
        label: `TRAP TRIGGER 0${idx + 1}: ${m.mistake}`,
        value: m.prevention || 'Pause step and follow mandated escalation path.',
        subtext: 'High-risk operational trap leading to immediate process shutdown.',
        tag: `HAZARD 0${idx + 1}`,
        tagType: 'negative',
        consequence: 'Risk of equipment damage, audit failure, or safety compromise.',
      }))
    : [
        {
          label: 'TRAP TRIGGER 01: BYPASSING PRE-ENTRY SEAL VERIFICATION',
          value: 'Inspect physical security seals and SKU serial tags prior to line entry.',
          subtext: 'Never assume prior shift completed verification without visual proof.',
          tag: 'CONTAMINATION TRAP',
          tagType: 'negative',
          consequence: 'Irreversible batch contamination and forfeiture of audit certification.',
        },
        {
          label: 'TRAP TRIGGER 02: CUSTOM UNAPPROVED WORKAROUNDS',
          value: 'Pause affected step immediately and escalate to designated shift supervisor.',
          subtext: 'Never invent custom shortcuts or override automated safety interlocks.',
          tag: 'BYPASS RISK',
          tagType: 'negative',
          consequence: 'Severe regulatory breach and potential safety hazard.',
        },
      ];

  // 6. MODULE 06: Pre-Shift Floor Readiness (Type E: Scorecard Banner + Direct CTA)
  const mod6Cards: BentoCardItem[] = [
    {
      label: 'MINIMUM QUALIFICATION SCORE',
      value: '85% Minimum Pass',
      subtext: 'Required baseline score on practice scenarios before floor clearance.',
      tag: 'COMPLIANCE BENCHMARK',
      tagType: 'positive',
    },
    {
      label: 'SAFETY VIOLATION TOLERANCE',
      value: '0 Critical Violations',
      subtext: 'Zero critical safety or boundary breaches permitted during assessment.',
      tag: 'SAFETY STANDARD',
      tagType: 'warning',
    },
  ];

  const defaultImg = '/Guruji_Real_Photo_Visual_Library_500/001_retail_store_front.webp';

  return [
    {
      num: 1,
      tabLabel: '01 Parameters',
      badge: 'MODULE 01',
      layoutType: 'grid_4',
      layoutName: '📐 BENTO GRID 2×2',
      title: 'Operating Parameters & Numeric Limits',
      subtitle: `Key operational windows, dwell targets, tolerances, and halt limits for ${sopTitle}.`,
      cards: mod1Cards,
      photoUrl: findBestVisualMatch('cleanroom pressure gauge equipment', sopTitle).url || defaultImg,
      photoCaption: 'Digital Pressure & Calibration Gauge • Unit 01',
    },
    {
      num: 2,
      tabLabel: '02 Principles',
      badge: 'MODULE 02',
      layoutType: 'split_2',
      layoutName: '⚡ DUAL SPLIT',
      title: 'Foundational Principles & Standards',
      subtitle: 'Mandatory operational standards versus non-negotiable restrictions.',
      cards: mod2Cards,
      photoUrl: findBestVisualMatch('lab equipment sterile inspection', sopTitle).url || defaultImg,
      photoCaption: 'Certified Cleanroom Operating Station • Bay 04',
    },
    {
      num: 3,
      tabLabel: '03 Flow',
      badge: 'MODULE 03',
      layoutType: 'sequence_3',
      layoutName: '🔢 SEQUENTIAL FLOW',
      title: 'Sequential Workflow Progression',
      subtitle: 'Step-by-step milestone progression from prep to final handover.',
      cards: mod3Cards,
      photoUrl: findBestVisualMatch('warehouse workflow process line', sopTitle).url || defaultImg,
      photoCaption: 'Sequential Barrier & Process Handover Corridor',
    },
    {
      num: 4,
      tabLabel: '04 Scenarios',
      badge: 'MODULE 04',
      layoutType: 'split_2',
      layoutName: '⚡ DUAL SPLIT',
      title: 'Field Scenarios & Decision Matrix',
      subtitle: 'Evaluating live operating conditions and executing approved responses.',
      cards: mod4Cards,
      photoUrl: findBestVisualMatch('scanner verification technician check', sopTitle).url || defaultImg,
      photoCaption: 'Live Floor Telemetry & Real-Time Decision Audit',
    },
    {
      num: 5,
      tabLabel: '05 Traps',
      badge: 'MODULE 05',
      layoutType: 'hero_photo_traps',
      layoutName: '⚠️ HERO TRAP',
      title: 'Failure Modes & Bypass Traps',
      subtitle: 'Critical boundary violations, bypass triggers, and mandatory prevention protocols.',
      cards: mod5Cards,
      photoUrl: findBestVisualMatch('safety hazard caution inspection warning', sopTitle).url || defaultImg,
      photoCaption: '⚠️ High-Risk Boundary Zone • Station 02',
    },
    {
      num: 6,
      tabLabel: '06 Readiness',
      badge: 'MODULE 06',
      layoutType: 'scorecard_cta',
      layoutName: '📊 SCORECARD',
      title: 'Pre-Shift Qualification & Readiness',
      subtitle: 'Verify qualification benchmarks before launching interactive floor simulation.',
      cards: mod6Cards,
      photoUrl: findBestVisualMatch('checklist quality certificate badge complete', sopTitle).url || defaultImg,
      photoCaption: 'Floor Supervisor Qualification Sign-Off',
    },
  ];
}

export function ExperiencePlayer({
  plan,
  lesson,
  onClose,
  onComplete,
}: ExperiencePlayerProps) {
  // View states: 'welcome' (Main Blue Title Page) | 'modules' (The Adaptive Bento Learning Deck)
  const [currentView, setCurrentView] = useState<'welcome' | 'modules'>('welcome');
  const [activeModule, setActiveModule] = useState<number>(1); // 1 to 6
  const [viewOriginalPpt, setViewOriginalPpt] = useState<boolean>(false);
  const [currentPptSlide, setCurrentPptSlide] = useState<number>(1);

  // Compute original slide deck pages if available
  const realSlides: SlidePage[] = useMemo(() => {
    if (lesson?.originalSlides && lesson.originalSlides.length > 0) {
      return lesson.originalSlides;
    }
    if (lesson?.sourceMeta?.originalSlides && lesson.sourceMeta.originalSlides.length > 0) {
      return lesson.sourceMeta.originalSlides;
    }
    if (lesson?.operationalBlueprint?.operational_steps && lesson.operationalBlueprint.operational_steps.length > 0) {
      return lesson.operationalBlueprint.operational_steps.map((step, idx) => ({
        slideNumber: idx + 1,
        title: step.instruction,
        subtitle: `Operational Step ${idx + 1} · Category: ${step.category}`,
        bullets: [
          step.why_it_matters ? `Why it matters: ${step.why_it_matters}` : `Source Ref: ${step.source?.source_ref || 'SOP'}`,
          step.scenario_question ? `Assessment Focus: ${step.scenario_question}` : `Follow exact procedure for step ${idx + 1}.`,
        ].filter(Boolean),
        rawContent: step.instruction,
      }));
    }
    return [
      {
        slideNumber: 1,
        title: lesson?.title || 'Standard Operating Procedure',
        subtitle: lesson?.subtitle || 'Original presentation slide content preserved.',
        bullets: [
          `Document Reference: ${lesson?.sourceMeta?.filename || 'Uploaded_SOP.pdf'}`,
          `Target Role: ${lesson?.operationalBlueprint?.role || 'Operator'}`,
          `Total Words: ${lesson?.sourceMeta?.wordCount || 0}`,
        ],
        rawContent: lesson?.description || '',
      },
    ];
  }, [lesson]);

  const totalPptSlides = realSlides.length;
  const currentSlideIndex = Math.min(Math.max(0, currentPptSlide - 1), totalPptSlides - 1);
  const activeSlide = realSlides[currentSlideIndex] || realSlides[0];

  // Welcome Slide (Front Blue Title Page)
  const welcomeSlide = plan?.slides?.find((s) => s.type === 'WELCOME') || {
    type: 'WELCOME' as const,
    title: lesson?.title || plan?.title || 'Standard Operating Procedure',
    content: lesson?.description || 'Interactive operational procedure walkthrough and key concepts review.',
    role: lesson?.subtitle || (lesson as any)?.role || 'Frontline Operations Specialist',
    tag: 'Module Overview',
    cta: "Let's Begin",
  };

  // Derive all 6 Bento Module Configurations
  const bentoModules = useMemo(() => extractBentoModulesFromLesson(lesson, plan), [lesson, plan]);
  const currentMod = bentoModules[activeModule - 1] || bentoModules[0];

  const handleNextModule = () => {
    sounds.playTap();
    if (activeModule < 6) {
      setActiveModule((prev) => prev + 1);
    } else {
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
    }
  };

  const handlePrevModule = () => {
    sounds.playTap();
    if (activeModule > 1) {
      setActiveModule((prev) => prev - 1);
    } else {
      setCurrentView('welcome');
    }
  };

  // RENDER 1: Front Blue Title Page (100% INTACT)
  if (currentView === 'welcome') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040814] select-none p-0 sm:p-4">
        <div className="w-full max-w-[460px] h-full sm:h-[840px] sm:rounded-[36px] bg-[#050B18] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-blue-950/40 relative">
          <WelcomePage
            slide={welcomeSlide}
            onNext={() => {
              sounds.playTap();
              setCurrentView('modules');
              setActiveModule(1);
            }}
            slideIndex={0}
            totalSlides={7}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  // RENDER 2: Modern Apple-Grade Adaptive Bento Learning Deck (#FBFBFD Light Aesthetic)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md select-none p-0 sm:p-4">
      <div className="w-full max-w-[460px] h-full sm:h-[840px] sm:rounded-[36px] bg-[#FBFBFD] flex flex-col overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-slate-200 relative text-slate-900 font-sans">
        
        {/* TOP BAR: Navigation Controls */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md shrink-0 z-20">
          <button
            onClick={handlePrevModule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={14} className="text-slate-700" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              Module {activeModule} of 6
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer text-xs font-bold"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* VIEW TOGGLE BAR: Bento Deck vs Original PPT Slides */}
        <div className="px-5 pt-3 shrink-0 bg-[#FBFBFD]">
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-full">
            <button
              onClick={() => {
                sounds.playTap();
                setViewOriginalPpt(false);
              }}
              className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !viewOriginalPpt
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles size={12} />
              <span>Interactive Bento Deck</span>
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                setViewOriginalPpt(true);
              }}
              className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                viewOriginalPpt
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🖼️ Original PPT</span>
            </button>
          </div>
        </div>

        {/* 6 HORIZONTAL TAB PILLS */}
        <div className="px-5 pt-3 pb-2 shrink-0 bg-[#FBFBFD]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {bentoModules.map((mod) => (
              <button
                key={mod.num}
                onClick={() => {
                  sounds.playTap();
                  setActiveModule(mod.num);
                }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                  activeModule === mod.num
                    ? 'bg-black text-white shadow-sm ring-2 ring-black/10'
                    : 'bg-[#F1F3F5] hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                {mod.tabLabel}
              </button>
            ))}
          </div>
        </div>

        {/* SCROLLABLE MAIN CONTENT CANVAS */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 bg-[#FBFBFD]">
          
          {/* OPTION A: ORIGINAL PPT SLIDE VIEW */}
          {viewOriginalPpt ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Original Presentation Slide Preserved</span>
                <span className="font-mono text-slate-500 font-bold">Slide {activeSlide.slideNumber} of {totalPptSlides}</span>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{activeSlide.title}</h2>
                <p className="text-xs text-slate-500">{activeSlide.subtitle || 'Original slide content.'}</p>
                <div className="rounded-2xl overflow-hidden h-48 bg-slate-100 border border-slate-200 relative flex items-center justify-center">
                  <img src={currentMod.photoUrl} alt="Slide visual" className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold">
                    Slide {activeSlide.slideNumber} Visual
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">KEY SPECIFICATIONS</span>
                  {activeSlide.bullets?.map((b, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
                      • {b}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={currentPptSlide <= 1}
                    onClick={() => setCurrentPptSlide((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-400">{currentPptSlide} / {totalPptSlides}</span>
                  <button
                    disabled={currentPptSlide >= totalPptSlides}
                    onClick={() => setCurrentPptSlide((p) => Math.min(totalPptSlides, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* OPTION B: ADAPTIVE BENTO LEARNING DECK ARCHETYPES */
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* HEADER ANATOMY (Identical across every slide) */}
              <div className="space-y-1.5">
                {/* Row 1: Two capsule badges */}
                <div className="flex items-center gap-2">
                  <span className="bg-black text-white text-[11px] font-bold rounded-full uppercase tracking-wide px-3.5 py-1">
                    {currentMod.badge}
                  </span>
                  <span className="bg-[#F1F3F5] text-slate-600 font-mono text-[10px] font-semibold border border-slate-200/90 rounded-full px-3 py-1 flex items-center gap-1.5">
                    {currentMod.layoutName}
                  </span>
                </div>

                {/* Row 2: Prominent Oversized Heading */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-1">
                  {currentMod.title}
                </h1>

                {/* Row 3: Single-line Subtitle */}
                <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 leading-relaxed">
                  {currentMod.subtitle}
                </p>
              </div>

              {/* ARCHETYPE TYPE A: 4-Card Bento Grid (2x2) [Module 01] */}
              {currentMod.layoutType === 'grid_4' && (
                <div className="space-y-4">
                  {/* 2x2 Grid of compact square cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {currentMod.cards.map((card, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px]"
                      >
                        <div>
                          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-slate-400 uppercase font-bold block mb-1">
                            {card.label}
                          </span>
                          <span className="text-xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight block">
                            {card.value}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-snug mt-2">
                          {card.subtext}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Anchored Equipment Photo with Frosted Glass Telemetry Caption */}
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative h-48 sm:h-52 w-full">
                    <img src={currentMod.photoUrl} alt={currentMod.photoCaption} className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                      {currentMod.photoCaption}
                    </div>
                  </div>
                </div>
              )}

              {/* ARCHETYPE TYPE B: 2-Card Dual Split Compare [Module 02 & Module 04] */}
              {currentMod.layoutType === 'split_2' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {currentMod.cards.map((card, idx) => {
                      const isNegative = card.tagType === 'negative';
                      const isWarning = card.tagType === 'warning';
                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                              {card.label}
                            </span>
                            {card.tag && (
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                isNegative
                                  ? 'bg-rose-100 text-rose-800'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {card.tag}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                            {card.value}
                          </h3>

                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {card.subtext}
                          </p>

                          {card.why && (
                            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
                              <span className="font-bold text-slate-700">Rationale: </span>
                              {card.why}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Station Photo */}
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative h-48 sm:h-52 w-full">
                    <img src={currentMod.photoUrl} alt={currentMod.photoCaption} className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                      {currentMod.photoCaption}
                    </div>
                  </div>
                </div>
              )}

              {/* ARCHETYPE TYPE C: 3-Card Sequential Flow [Module 03] */}
              {currentMod.layoutType === 'sequence_3' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {currentMod.cards.map((card, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start gap-3.5"
                      >
                        <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center text-xs font-mono font-extrabold shrink-0 mt-0.5">
                          {card.tag || `0${idx + 1}`}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-slate-400 uppercase font-bold block">
                            {card.label}
                          </span>
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                            {card.value}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {card.subtext}
                          </p>
                          {card.why && (
                            <p className="text-[11px] text-slate-500 font-medium pt-1">
                              <span className="font-bold text-slate-700">Why it matters: </span>
                              {card.why}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Workflow Station Photo */}
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative h-48 sm:h-52 w-full">
                    <img src={currentMod.photoUrl} alt={currentMod.photoCaption} className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                      {currentMod.photoCaption}
                    </div>
                  </div>
                </div>
              )}

              {/* ARCHETYPE TYPE D: Photo-Hero Focal + 2 Trap Warning Cards [Module 05] */}
              {currentMod.layoutType === 'hero_photo_traps' && (
                <div className="space-y-4">
                  {/* Large Equipment Photo at Top with Hazard Warning Badge */}
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative h-52 sm:h-56 w-full">
                    <img src={currentMod.photoUrl} alt={currentMod.photoCaption} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-rose-600 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm shadow-rose-600/30 flex items-center gap-1.5">
                      <span>⚠️ High-Risk Boundary Zone</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                      {currentMod.photoCaption}
                    </div>
                  </div>

                  {/* 2 Warning Cards */}
                  <div className="space-y-3">
                    {currentMod.cards.map((card, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-rose-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2 relative overflow-hidden"
                      >
                        <div className="flex items-center gap-2 text-rose-600">
                          <AlertTriangle size={15} />
                          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-rose-600 uppercase font-bold">
                            {card.label}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                          {card.value}
                        </h4>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {card.subtext}
                        </p>

                        {card.consequence && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-900">
                            <span className="font-bold">Consequence: </span>
                            {card.consequence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ARCHETYPE TYPE E: 2-Card Scorecard Banner + Direct Simulation CTA [Module 06] */}
              {currentMod.layoutType === 'scorecard_cta' && (
                <div className="space-y-4">
                  {/* 2 Wide Metric Banners */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-emerald-800 uppercase font-bold block mb-1">
                        MINIMUM QUALIFICATION SCORE
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-950 tracking-tight block">
                        85% Minimum Pass
                      </span>
                      <p className="text-xs text-emerald-800 font-medium mt-1">
                        Baseline required before shift sign-off.
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-amber-800 uppercase font-bold block mb-1">
                        CRITICAL SAFETY TOLERANCE
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-amber-950 tracking-tight block">
                        0 Critical Violations
                      </span>
                      <p className="text-xs text-amber-800 font-medium mt-1">
                        Zero safety boundary breaches permitted.
                      </p>
                    </div>
                  </div>

                  {/* Floor Supervisor Verification Photo */}
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative h-40 sm:h-44 w-full">
                    <img src={currentMod.photoUrl} alt={currentMod.photoCaption} className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                      {currentMod.photoCaption}
                    </div>
                  </div>

                  {/* Active Readiness Confirmation Card */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Module Readiness Qualified</h4>
                      <p className="text-xs text-slate-500 font-normal">You are ready to attempt the frontline simulation.</p>
                    </div>
                  </div>

                  {/* Direct Action CTA Button */}
                  <button
                    onClick={() => {
                      sounds.playTap();
                      if (onComplete) {
                        onComplete();
                      } else {
                        onClose();
                      }
                    }}
                    className="w-full py-4 px-6 bg-black hover:bg-slate-800 text-white font-bold text-sm rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <span>Start Practice Simulation →</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* FOOTER NAVIGATION CONTROLS */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handlePrevModule}
            className="px-4 py-2.5 rounded-full border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>{activeModule === 1 ? 'Cover' : 'Previous'}</span>
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((m) => (
              <span
                key={m}
                onClick={() => {
                  sounds.playTap();
                  setActiveModule(m);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  m === activeModule
                    ? 'w-5 bg-black shadow-xs'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextModule}
            className="px-5 py-2.5 rounded-full bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>{activeModule === 6 ? 'Start Practice →' : `Next: ${bentoModules[activeModule]?.tabLabel || 'Next'}`}</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
