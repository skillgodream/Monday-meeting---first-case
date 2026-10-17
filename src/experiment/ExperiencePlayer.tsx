import React, { useState, useMemo } from 'react';
import { SlidePlan } from './types';
import { Lesson, SlidePage } from '../types';
import { WelcomePage } from './pages/WelcomePage';
import { findBestVisualMatch } from '../utils/visualLibraryMatcher';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Layers, Lightbulb, Play } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ExperiencePlayerProps {
  plan: SlidePlan;
  lesson?: Lesson;
  onClose: () => void;
  onComplete?: () => void;
}

export function ExperiencePlayer({
  plan,
  lesson,
  onClose,
  onComplete,
}: ExperiencePlayerProps) {
  // View states: 'welcome' (Front Blue Title Page) | 'modules' (The 6-Module Picture Flow)
  const [currentView, setCurrentView] = useState<'welcome' | 'modules'>('welcome');
  const [activeModule, setActiveModule] = useState<number>(1); // 1 to 6
  const [viewOriginalPpt, setViewOriginalPpt] = useState<boolean>(false);
  const [currentPptSlide, setCurrentPptSlide] = useState<number>(1);

  // Compute actual slides derived directly from uploaded PowerPoint / PDF / document
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
          `Document Reference: ${lesson?.sourceMeta?.filename || 'Uploaded_Presentation.pptx'}`,
          `Target Role: ${lesson?.operationalBlueprint?.role || 'Operator'} · Scope: ${lesson?.operationalBlueprint?.scope || 'Operational Standard'}`,
          `Total Words: ${lesson?.sourceMeta?.wordCount || 0} · Pages: ${lesson?.sourceMeta?.pageCount || 1}`,
        ],
        rawContent: lesson?.description || '',
      },
    ];
  }, [lesson]);

  const totalPptSlides = realSlides.length;
  const currentSlideIndex = Math.min(Math.max(0, currentPptSlide - 1), totalPptSlides - 1);
  const activeSlide = realSlides[currentSlideIndex] || realSlides[0];

  // Welcome Slide (Slide 0)
  const welcomeSlide = plan?.slides?.find((s) => s.type === 'WELCOME') || {
    type: 'WELCOME' as const,
    title: lesson?.title || plan.title || 'Standard Operating Procedure',
    content: lesson?.description || 'Interactive operational procedure walkthrough and key concepts review.',
    role: lesson?.subtitle || (lesson as any)?.role || 'Frontline Operations Specialist',
    tag: 'Module Overview',
    cta: "Let's Begin",
  };

  // Derive structured data for the 6 modules from lesson / blueprint / plan
  const sopTitle = lesson?.title || plan.title || 'Standard Operating Procedure';
  const sopRole = lesson?.subtitle?.replace(/^Role:\s*/i, '') || (lesson?.operationalBlueprint as any)?.role || 'Workplace Operator';
  const sopScope = (lesson?.operationalBlueprint as any)?.scope || 'Personnel Airlock & Primary Operating Core Suite';
  const sopPurpose = lesson?.description || (lesson?.operationalBlueprint as any)?.purpose || 'Maintain strict operational compliance and safety integrity.';

  // Module 1: Objectives & Scope
  const rawObjectives = plan?.slides?.find((s) => s.type === 'OBJECTIVES')?.items || [
    'Verify active order ID and baseline authorization before entry',
    'Follow sequence steps in exact order without bypassing verification',
    'Execute correct exception protocol when encountering anomalies'
  ];

  // Module 2: Foundational Concepts & Tools
  const rawConcepts = useMemo(() => {
    const tools = lesson?.operationalBlueprint?.tools_and_systems || [];
    const terminology = lesson?.operationalBlueprint?.terminology || [];
    const controls = lesson?.operationalBlueprint?.critical_controls || [];

    const list: Array<{ title: string; subtitle: string; why: string; tag: string; imageLabel: string }> = [];

    if (tools.length > 0) {
      tools.slice(0, 3).forEach((t, i) => {
        list.push({
          title: t.name,
          subtitle: t.purpose || 'Mandatory equipment for standard procedure execution.',
          why: t.never_do ? `NEVER: ${t.never_do}` : 'Zero deviation allowed during equipment handling.',
          tag: `TOOL 0${i + 1}`,
          imageLabel: `${t.name} Calibration & Spec Verification`,
        });
      });
    }

    if (terminology.length > 0 && list.length < 3) {
      terminology.slice(0, 2).forEach((term, i) => {
        list.push({
          title: term.term,
          subtitle: term.meaning,
          why: 'Clear understanding required for compliance audit standards.',
          tag: `CONCEPT 0${list.length + 1}`,
          imageLabel: `${term.term} Boundary Definition`,
        });
      });
    }

    if (controls.length > 0 && list.length < 3) {
      controls.slice(0, 2).forEach((c, i) => {
        list.push({
          title: typeof c === 'string' ? c : (c as any).rule || 'Critical Parameter Check',
          subtitle: 'Core operational threshold required for zero-defect compliance.',
          why: typeof c === 'object' && (c as any).rationale ? (c as any).rationale : 'Prevents process failures and security breaches.',
          tag: `PARAMETER 0${list.length + 1}`,
          imageLabel: 'Parameter Threshold Verification',
        });
      });
    }

    if (list.length === 0) {
      list.push(
        {
          title: 'Differential Pressure & Environmental Threshold',
          subtitle: 'Physical parameters required for zero-defect operating zone boundary compliance.',
          why: 'Prevents environmental contamination migration into clean working suites.',
          tag: 'CONCEPT 01',
          imageLabel: 'Differential Pressure (>= +15 Pa) Manometer',
        },
        {
          title: 'Step-Over Bench (SOB) Line of Demarcation',
          subtitle: 'Physical boundary dividing non-sterile preparation area from certified cleanroom boundary.',
          why: 'Zero contact is permitted between unbooted feet and sterile flooring to prevent microbial transfer.',
          tag: 'CONCEPT 02',
          imageLabel: '70% IPA Contact Time & Hand Scrub Protocol',
        }
      );
    }
    return list;
  }, [lesson]);

  // Module 3: Sequential Milestones & Flow
  const rawFlowSteps = useMemo(() => {
    const opSteps = lesson?.operationalBlueprint?.operational_steps || [];
    if (opSteps.length > 0) {
      return opSteps.slice(0, 4).map((s, idx) => ({
        stepNum: idx + 1,
        title: s.instruction,
        why: s.why_it_matters || 'Strict adherence required for procedural integrity.',
        category: s.category || 'Sequential Step',
        imageLabel: `Milestone 0${idx + 1}: ${s.action_verb || 'Step'} Execution Phase`,
      }));
    }
    const teachSlides = plan?.slides?.filter((s) => s.type === 'TEACH_STEP') || [];
    if (teachSlides.length > 0) {
      return teachSlides.slice(0, 4).map((s, idx) => ({
        stepNum: idx + 1,
        title: s.title,
        why: s.why || (s.items ? s.items.join('. ') : 'Follow sequential execution order strictly.'),
        category: 'Phase Milestone',
        imageLabel: `Milestone 0${idx + 1}: ${s.title.slice(0, 30)}`,
      }));
    }
    return [
      { stepNum: 1, title: 'Verify active order parameters and confirm identity', why: 'Prevents taking action against incorrect or unassigned records.', category: 'Preparation', imageLabel: 'Order & Identity Verification' },
      { stepNum: 2, title: 'Inspect condition, packaging seals & physical tags', why: 'Identifies damage before accepting custody transfer.', category: 'Inspection', imageLabel: 'Seal & Condition Verification' },
      { stepNum: 3, title: 'Apply documented acceptance decision criteria', why: 'Never improvise rules or guess approval timelines.', category: 'Decision Gate', imageLabel: 'Acceptance Criteria Evaluation' },
      { stepNum: 4, title: 'Record transaction audit timestamp and secure items', why: 'Ensures unbroken chain-of-custody logging.', category: 'Closeout', imageLabel: 'Audit Record & Secure Handover' },
    ];
  }, [lesson, plan]);

  // Module 4: Operational Scenarios & Practice
  const rawScenarios = useMemo(() => {
    const decisions = lesson?.operationalBlueprint?.decision_points || [];
    if (decisions.length > 0) {
      return decisions.slice(0, 3).map((d, i) => ({
        title: d.situation,
        action: d.action || 'Apply documented acceptance criteria strictly.',
        rationale: d.decision || 'Follow approved operating decision matrix without improvisation.',
        imageLabel: `Scenario 0${i + 1}: Real-Time Decision Audit`,
      }));
    }
    return [
      {
        title: 'Customer disputes eligibility or demands immediate verbal guarantee',
        action: 'DO: Explain recorded check calmly. NEVER: Guarantee refund or invent rules.',
        rationale: 'Company policy governs financial disposition; verbal promises create compliance liabilities.',
        imageLabel: 'Real-Time Telemetry & Parameter Audit',
      },
      {
        title: 'App or scanner network disconnection during live handover',
        action: 'DO: Follow approved offline log procedure. NEVER: Complete task without timestamp.',
        rationale: 'Ensures data reconciliation upon system reconnection without lost items.',
        imageLabel: 'Offline Protocol & System Disconnection',
      }
    ];
  }, [lesson]);

  // Module 5: Mistakes, Exceptions & Consequences
  const rawMistakes = useMemo(() => {
    const commonMistakes = lesson?.operationalBlueprint?.common_mistakes || [];
    const exceptions = lesson?.operationalBlueprint?.exceptions || [];
    const list: Array<{ mistake: string; prevention: string; consequence: string; imageLabel: string }> = [];

    if (commonMistakes.length > 0) {
      commonMistakes.slice(0, 3).forEach((m) => {
        list.push({
          mistake: m.mistake,
          prevention: m.prevention || 'Adhere strictly to verified SOP criteria.',
          consequence: 'Risk of inventory defect, compliance audit failure, or safety compromise.',
          imageLabel: 'Critical Boundary & Contamination Trap Warning',
        });
      });
    }

    if (exceptions.length > 0 && list.length < 3) {
      exceptions.slice(0, 2).forEach((e) => {
        list.push({
          mistake: `Ignoring exception trigger: "${e.trigger}"`,
          prevention: `Execute mandated action: ${e.resolution}`,
          consequence: 'Unresolved operational gap leading to escalation failure.',
          imageLabel: 'Exception Escalation Protocol',
        });
      });
    }

    if (list.length === 0) {
      list.push(
        {
          mistake: 'Inventing an unapproved custom workaround for borderline conditions',
          prevention: 'Pause the affected step and escalate directly to the designated shift lead.',
          consequence: 'Severe regulatory breach and forfeiture of audit certification.',
          imageLabel: 'Critical Boundary & Contamination Trap Warning',
        },
        {
          mistake: 'Bypassing pre-execution identity or physical seal verification checks',
          prevention: 'Always match documented SKU and serial identifiers before proceeding.',
          consequence: 'High probability of incorrect shipment dispatch and inventory shrinkage.',
          imageLabel: 'Seal Integrity Breach Violation',
        }
      );
    }
    return list;
  }, [lesson]);

  // Module 6: Key Takeaways
  const rawTakeaways = useMemo(() => {
    const takeawaysSlide = plan?.slides?.find((s) => s.type === 'KEY_TAKEAWAYS')?.items;
    if (takeawaysSlide && takeawaysSlide.length > 0) {
      return takeawaysSlide.slice(0, 3);
    }
    return [
      `Always follow the documented SOP standard for ${sopTitle}.`,
      'Never improvise rules or guess timelines for exceptions.',
      'Log audit evidence and capture required serial identifiers.'
    ];
  }, [plan, sopTitle]);

  // Helper to fetch matching visual for module headers and content cards
  const heroImage = useMemo(() => {
    const match = findBestVisualMatch(sopTitle, `Module 0${activeModule}`);
    return match.url || '/Guruji_Real_Photo_Visual_Library_500/001_retail_store_front.webp';
  }, [sopTitle, activeModule]);

  // Module Definition Config matching user's requested specification:
  const MODULES = [
    {
      num: 1,
      id: 'introduction',
      name: 'Introduction',
      shortPill: '01 Introduction',
      badge: `01 // INTRODUCTION • ${sopTitle.toUpperCase()}`,
      title: 'SOP Title & Operational Baseline Scope',
      subtitle: `${sopPurpose} Governing frontline execution for ${sopRole}.`,
      heroBg: findBestVisualMatch('hospitality clean room entrance store front', sopTitle).url,
    },
    {
      num: 2,
      id: 'understand',
      name: 'Understand',
      shortPill: '02 Understand',
      badge: `02 // UNDERSTAND • ${sopTitle.toUpperCase()}`,
      title: 'Foundational Concepts & Principles',
      subtitle: 'Core operational rules, physical thresholds, and parameters required for zero-defect compliance.',
      heroBg: findBestVisualMatch('cleanroom equipment laboratory tools', sopTitle).url,
    },
    {
      num: 3,
      id: 'visualise',
      name: 'Visualise',
      shortPill: '03 Visualise',
      badge: `03 // VISUALISE • ${sopTitle.toUpperCase()}`,
      title: 'Process Flows & Sequential Milestones',
      subtitle: 'Sequential barrier progression, workflow stages, and handover boundaries.',
      heroBg: findBestVisualMatch('warehouse workflow timeline process', sopTitle).url,
    },
    {
      num: 4,
      id: 'apply',
      name: 'Apply',
      shortPill: '04 Apply',
      badge: `04 // APPLY • ${sopTitle.toUpperCase()}`,
      title: 'Operational Scenarios & Practice',
      subtitle: 'Real-world execution contexts testing your capability to resolve live operating challenges.',
      heroBg: findBestVisualMatch('scanner verification technician check', sopTitle).url,
    },
    {
      num: 5,
      id: 'avoid-errors',
      name: 'Avoid Errors',
      shortPill: '05 Avoid Errors',
      badge: `05 // AVOID ERRORS • ${sopTitle.toUpperCase()}`,
      title: 'Mistakes, Exceptions & Consequences',
      subtitle: 'High-risk failure modes, boundary breaches, and non-negotiable corrective actions.',
      heroBg: findBestVisualMatch('safety hazard caution inspection warning', sopTitle).url,
    },
    {
      num: 6,
      id: 'reinforce',
      name: 'Reinforce',
      shortPill: '06 Reinforce',
      badge: `06 // REINFORCE • ${sopTitle.toUpperCase()}`,
      title: 'Key Takeaways & Quick Knowledge Checks',
      subtitle: 'Core operational rules to memorize and final readiness confirmation before practice.',
      heroBg: findBestVisualMatch('checklist quality certificate badge complete', sopTitle).url,
    },
  ];

  const currentMod = MODULES[activeModule - 1] || MODULES[0];

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

  // If on initial front page: render WelcomePage (the Front Blue Title page) 100% intact!
  if (currentView === 'welcome') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040814] select-none p-0 sm:p-4">
        <div className="w-full max-w-[440px] h-full sm:h-[820px] sm:rounded-[32px] bg-[#050B18] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-blue-950/40 relative">
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

  // Otherwise: Render the 6-Module Picture Support Training Deck matching the 6 screenshots!
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070A14] select-none p-0 sm:p-4">
      <div className="w-full max-w-[440px] h-full sm:h-[820px] sm:rounded-[32px] bg-[#0A0E1A] flex flex-col overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] border border-white/10 relative text-white font-sans">
        
        {/* TOP BAR: Back Navigation Button */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-[#0A0E1A]/90 backdrop-blur-xl shrink-0 z-20">
          <button
            onClick={handlePrevModule}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={14} className="text-white" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Module {activeModule} of 6
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              title="Exit to Overview"
            >
              ✕
            </button>
          </div>
        </div>

        {/* VIEW MODE TOGGLE BAR: Interactive Learning Modules vs Original PPT Slide Presentation */}
        <div className="px-4 pt-2 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-full">
            <button
              onClick={() => {
                sounds.playTap();
                setViewOriginalPpt(false);
              }}
              className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !viewOriginalPpt
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Interactive Deck</span>
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                setViewOriginalPpt(true);
              }}
              className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                viewOriginalPpt
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🖼️ Original PPT Slides</span>
            </button>
          </div>
        </div>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          
          {/* OPTION A: ORIGINAL UPLOADED PPT SLIDE PRESENTATION VIEW (1:1 Preserved Layout) */}
          {viewOriginalPpt ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Top Banner Notice */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="font-bold text-indigo-200">Original Presentation Slide Design Preserved</span>
                </div>
                <span className="font-mono text-indigo-300 font-bold">
                  Slide {activeSlide.slideNumber} of {totalPptSlides}
                </span>
              </div>

              {/* 16:9 Presentation Slide Card (Original PPT Design Replica) */}
              <div className="bg-[#0D1222] border-2 border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-white relative overflow-hidden">
                {/* Decorative PPT Header Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-indigo-400">
                    {lesson?.sourceMeta?.filename || 'Uploaded_Presentation.pptx'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Slide {String(activeSlide.slideNumber).padStart(2, '0')}
                  </span>
                </div>

                {/* Original Slide Title */}
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {activeSlide.title}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {activeSlide.subtitle || `Content extracted directly from slide ${activeSlide.slideNumber}.`}
                  </p>
                </div>

                {/* Original Visual Diagram Frame or Canvas Screenshot */}
                <div className="relative rounded-2xl overflow-hidden min-h-[190px] max-h-[320px] w-full border border-white/10 bg-black/60 flex items-center justify-center">
                  {activeSlide.imageDataUrl ? (
                    <img
                      src={activeSlide.imageDataUrl}
                      alt={`Slide ${activeSlide.slideNumber} Rendered Image`}
                      className="w-full h-full max-h-[300px] object-contain rounded-2xl"
                    />
                  ) : (
                    <>
                      <img
                        src={heroImage}
                        alt={`Slide ${activeSlide.slideNumber} Visual`}
                        className="w-full h-48 object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold">
                        Slide {activeSlide.slideNumber} Visual Layout & Diagram
                      </div>
                    </>
                  )}
                </div>

                {/* Original Slide Bullet Points */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                    SLIDE BULLET POINTS & SPECIFICATIONS
                  </span>
                  <div className="space-y-2 text-xs font-semibold text-slate-200">
                    {activeSlide.bullets && activeSlide.bullets.length > 0 ? (
                      activeSlide.bullets.map((bullet, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                          <span className="text-indigo-400 font-bold shrink-0">•</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                        <span className="text-indigo-400 font-bold shrink-0">•</span>
                        <span>{activeSlide.rawContent || 'Slide content loaded from original deck.'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slide Carousel Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    disabled={currentPptSlide <= 1}
                    onClick={() => {
                      sounds.playTap();
                      setCurrentPptSlide((prev) => Math.max(1, prev - 1));
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1 overflow-x-auto max-w-[180px] sm:max-w-none scrollbar-none py-1">
                    {realSlides.map((s, idx) => {
                      const num = idx + 1;
                      return (
                        <button
                          key={num}
                          onClick={() => {
                            sounds.playTap();
                            setCurrentPptSlide(num);
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            currentPptSlide === num
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPptSlide >= totalPptSlides}
                    onClick={() => {
                      sounds.playTap();
                      setCurrentPptSlide((prev) => Math.min(totalPptSlides, prev + 1));
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Next →
                  </button>
                </div>

              </div>

            </div>
          ) : (
            /* OPTION B: INTERACTIVE LEARNING MODULES DECK */
            <>
          <div className="relative rounded-3xl overflow-hidden p-6 border border-white/15 shadow-2xl min-h-[190px] flex flex-col justify-end">
            {/* Background Image with Ambient Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
              style={{ backgroundImage: `url(${currentMod.heroBg || heroImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/80 to-[#0A0E1A]/40" />

            {/* Translucent Capsule Monospace Badge */}
            <div className="relative z-10 self-start mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold tracking-widest text-indigo-200 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                {currentMod.badge}
              </span>
            </div>

            {/* Oversized Structural Title */}
            <h1 className="relative z-10 text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {currentMod.title}
            </h1>

            {/* Subtitle Sentence */}
            <p className="relative z-10 text-xs sm:text-[13px] text-slate-300 font-medium mt-1.5 leading-relaxed max-w-sm">
              {currentMod.subtitle}
            </p>
          </div>

          {/* HORIZONTAL TAB BAR (Scrollable Pills with Active Dark Blue Pill) */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {MODULES.map((mod) => (
              <button
                key={mod.num}
                onClick={() => {
                  sounds.playTap();
                  setActiveModule(mod.num);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                  activeModule === mod.num
                    ? 'bg-[#0B1528] text-white border border-blue-500/50 shadow-md shadow-blue-900/30 ring-1 ring-blue-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {mod.shortPill}
              </button>
            ))}
          </div>

          {/* DYNAMIC PICTURE SUPPORT CARDS FOR THE ACTIVE MODULE */}
          
          {/* MODULE 01: INTRODUCTION */}
          {activeModule === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-5 text-slate-900 shadow-xl border border-slate-200/80 space-y-4">
                
                {/* Meta details */}
                <div className="space-y-2 text-xs">
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {sopPurpose} All personnel are primary vectors of execution and must strictly maintain documented standard behaviour.
                  </p>
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="font-extrabold text-slate-800 shrink-0">Target Role:</span>
                      <span className="font-bold text-indigo-700">{sopRole}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-extrabold text-slate-800 shrink-0">Scope:</span>
                      <span className="text-slate-700">{sopScope}</span>
                    </div>
                  </div>
                </div>

                {/* Picture Banner with Bottom-Left Caption Badge */}
                <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 w-full border border-slate-200">
                  <img
                    src={findBestVisualMatch('sterile cleanroom personnel check', sopTitle).url || heroImage}
                    alt="Scope Verification"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-bold">
                    Sterile PPE & Demarcation Verification
                  </div>
                </div>

                {/* Explicit Learning Objectives */}
                <div className="pt-2 space-y-2.5">
                  <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase block">
                    EXPLICIT LEARNING OBJECTIVES
                  </span>
                  <div className="space-y-2">
                    {rawObjectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-800 leading-snug">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 02: UNDERSTAND (Foundational Concepts & Principles) */}
          {activeModule === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {rawConcepts.map((concept, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-5 text-slate-900 shadow-xl border border-slate-200/80 space-y-3.5">
                  
                  {/* Picture Banner with Bottom-Left Overlay Badge */}
                  <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 w-full border border-slate-200">
                    <img
                      src={findBestVisualMatch(concept.title, sopTitle).url || heroImage}
                      alt={concept.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-bold">
                      {concept.imageLabel}
                    </div>
                  </div>

                  {/* Concept Kicker & Section Citation */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-wider text-purple-700 uppercase">
                      {concept.tag}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Section 3.{idx + 1}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {concept.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                      {concept.subtitle}
                    </p>
                  </div>

                  {/* Operational Rationale Box */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
                      OPERATIONAL RATIONALE
                    </span>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3">
                      {concept.why}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODULE 03: VISUALISE (Process Flows & Sequential Milestones) */}
          {activeModule === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-5 text-slate-900 shadow-xl border border-slate-200/80 space-y-4">
                
                {/* Header Picture Banner */}
                <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 w-full border border-slate-200">
                  <img
                    src={findBestVisualMatch('process flow warehouse step checkpoint', sopTitle).url || heroImage}
                    alt="Process Flow"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-bold">
                    Three-Stage Barrier & Sequential Flow
                  </div>
                </div>

                {/* Milestone Node Timeline */}
                <div className="space-y-3">
                  <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase block">
                    SEQUENTIAL EXECUTION ORDER
                  </span>

                  {rawFlowSteps.map((stepItem, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-400 transition-all">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                        {stepItem.stepNum}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                            {stepItem.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Phase {idx + 1}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {stepItem.title}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-600 mt-1">
                          <span className="font-bold text-slate-700">Rationale: </span>
                          {stepItem.why}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 04: APPLY (Operational Scenarios & Practice) */}
          {activeModule === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {rawScenarios.map((scenario, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-5 text-slate-900 shadow-xl border border-slate-200/80 space-y-3.5">
                  
                  {/* Picture Banner with Bottom-Left Caption */}
                  <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 w-full border border-slate-200">
                    <img
                      src={findBestVisualMatch(scenario.title, sopTitle).url || heroImage}
                      alt={scenario.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-bold">
                      {scenario.imageLabel}
                    </div>
                  </div>

                  {/* Scenario Kicker */}
                  <span className="text-[11px] font-black tracking-wider text-blue-700 uppercase block">
                    LIVE FIELD SCENARIO 0{idx + 1}
                  </span>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-snug">
                      {scenario.title}
                    </h3>
                  </div>

                  {/* Compliant Standard Response */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                      MANDATORY OPERATIONAL ACTION
                    </span>
                    <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                      {scenario.action}
                    </p>
                  </div>

                  {/* Verification Rule */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      AUDIT SPECIFICATION
                    </span>
                    <p className="text-xs font-medium text-slate-600">
                      {scenario.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODULE 05: AVOID ERRORS (Mistakes, Exceptions & Consequences) */}
          {activeModule === 5 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {rawMistakes.map((mistakeItem, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-5 text-slate-900 shadow-xl border border-slate-200/80 space-y-3.5 relative overflow-hidden">
                  
                  {/* Red Alert Indicator Stripe on Left */}
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />

                  {/* Picture Banner with Bottom-Left Caption */}
                  <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 w-full border border-slate-200">
                    <img
                      src={findBestVisualMatch('safety violation warning hazard spill', sopTitle).url || heroImage}
                      alt="Mistake Warning"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-rose-950/80 backdrop-blur-md border border-rose-500/40 text-rose-200 text-[11px] font-mono font-bold">
                      {mistakeItem.imageLabel}
                    </div>
                  </div>

                  {/* Kicker */}
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <AlertTriangle size={15} />
                    <span className="text-[11px] font-black tracking-wider uppercase">
                      CRITICAL FAILURE MODE 0{idx + 1}
                    </span>
                  </div>

                  {/* The Mistake */}
                  <div>
                    <h3 className="text-sm font-black text-rose-900 leading-snug">
                      {mistakeItem.mistake}
                    </h3>
                  </div>

                  {/* Prevention Directive */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                      REQUIRED CORRECTIVE ACTION
                    </span>
                    <p className="text-xs font-bold text-slate-900 leading-relaxed">
                      {mistakeItem.prevention}
                    </p>
                  </div>

                  {/* Severe Consequence */}
                  <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3">
                    <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                      CONSEQUENCE OF NON-COMPLIANCE
                    </span>
                    <p className="text-xs font-semibold text-rose-950 mt-0.5">
                      {mistakeItem.consequence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODULE 06: REINFORCE (Key Takeaways & Certification Readiness) */}
          {activeModule === 6 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-5 text-slate-900 shadow-xl border border-slate-200/80 space-y-4">
                
                {/* Picture Banner with Bottom-Left Caption */}
                <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 w-full border border-slate-200">
                  <img
                    src={findBestVisualMatch('quality check complete certificate worker', sopTitle).url || heroImage}
                    alt="Takeaways"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-200 text-[11px] font-mono font-bold">
                    Operational Knowledge & Certification Readiness
                  </div>
                </div>

                <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase block">
                  3 GOLDEN RULES TO MEMORIZE
                </span>

                <div className="space-y-2.5">
                  {rawTakeaways.map((takeaway, i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                        {takeaway}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <span className="text-xs font-bold text-slate-500 block">
                    You have mastered all 6 modules of this SOP.
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ready to witness live frontline demonstration with Guruji.
                  </p>
                </div>
              </div>
            </div>
          )}
          </>
          )}

        </div>

        {/* FIXED FOOTER CONTROLS: PREVIOUS / NEXT */}
        <div className="p-4 bg-[#0A0E1A]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handlePrevModule}
            className="px-4 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>{activeModule === 1 ? 'Cover' : 'Previous'}</span>
          </button>

          {/* Module Step Indicator Dots */}
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
                    ? 'w-5 bg-indigo-500 shadow-sm shadow-indigo-500/50'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextModule}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>{activeModule === 6 ? 'Continue to Show Me' : `Next: ${MODULES[activeModule]?.name || 'Next'}`}</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
