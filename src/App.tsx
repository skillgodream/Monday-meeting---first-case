/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MeetGurujiScreen } from './screens/MeetGurujiScreen';
import { ProcessPassport, PerceiveObservation, TabType, Lesson, ExperienceLevel } from './types';
import { sounds } from './utils/audio';
import type { ExtractedDocument } from './utils/documentExtractor';
import { getApiHeaders } from './utils/apiHelper';
import RoleNavigationModal, { UserRole } from './components/RoleNavigationModal';

// Code-split heavy modals, navigation & secondary views so initial bundle loads in <200ms
const BottomNav = React.lazy(() => import('./components/BottomNav'));
const GyanChatModal = React.lazy(() => import('./components/GyanChatModal'));
const ValidationErrorModal = React.lazy(() => import('./components/ValidationErrorModal'));
const HomeScreen = React.lazy(() =>
  import('./screens/HomeScreen').then((m) => ({ default: m.HomeScreen }))
);
const AiUnderstandModal = React.lazy(() => import('./components/AiUnderstandModal'));
const WelcomeJourneyModal = React.lazy(() => import('./components/WelcomeJourneyModal'));
const LearningJourneyModal = React.lazy(() =>
  import('./components/LearningJourneyModal').then((m) => ({ default: m.LearningJourneyModal }))
);
const ExperiencedCheckModal = React.lazy(() => import('./components/ExperiencedCheckModal'));
const AskTrainerModal = React.lazy(() => import('./components/AskTrainerModal'));
const MicroLessonSheet = React.lazy(() => import('./components/MicroLessonSheet'));
const LessonOverview = React.lazy(() => import('./components/LessonOverview'));
const LibraryView = React.lazy(() => import('./components/LibraryView'));
const ProgressView = React.lazy(() => import('./components/ProgressView'));
const ProfileView = React.lazy(() => import('./components/ProfileView'));
const SopGenerationModal = React.lazy(() =>
  import('./components/SopGenerationModal').then((m) => ({ default: m.SopGenerationModal }))
);
const AnalyzingModal = React.lazy(() =>
  import('./components/AnalyzingModal').then((m) => ({ default: m.AnalyzingModal }))
);
const ScanModal = React.lazy(() => import('./components/ScanModal'));
const UploadModal = React.lazy(() => import('./components/UploadModal'));
const SimulatorScreen = React.lazy(() => import('./components/SimulatorScreen'));
const PilotDashboardView = React.lazy(() => import('./components/PilotDashboardView'));
const BentoArchitectureShowcase = React.lazy(() => import('./components/BentoArchitectureShowcase'));
const ProcessPassportModal = React.lazy(() => import('./components/ProcessPassportModal'));
const ManagerDashboardView = React.lazy(() => import('./components/ManagerDashboardView'));
const AdminDashboardView = React.lazy(() => import('./components/AdminDashboardView'));
const ExperiencePlayer = React.lazy(() =>
  import('./experiment/ExperiencePlayer').then((m) => ({ default: m.ExperiencePlayer }))
);
const ShowMeVideoModal = React.lazy(() =>
  import('./components/ShowMeVideoModal').then((m) => ({ default: m.ShowMeVideoModal }))
);
const DesignCheckScreen = React.lazy(() =>
  import('./screens/DesignCheckScreen').then((m) => ({ default: m.DesignCheckScreen }))
);
const ContentCardScreen = React.lazy(() =>
  import('./screens/ContentCardScreen').then((m) => ({ default: m.ContentCardScreen }))
);

export default function App() {
  const [isDesignCheck, setIsDesignCheck] = useState<boolean>(
    window.location.hash === '#design-check' ||
    window.location.pathname === '/design-check'
  );
  const [isContentCard, setIsContentCard] = useState<boolean>(
    window.location.hash === '#content-card' ||
    window.location.pathname === '/content-card'
  );

  React.useEffect(() => {
    const handleHashChange = () => {
      setIsDesignCheck(
        window.location.hash === '#design-check' ||
        window.location.pathname === '/design-check'
      );
      setIsContentCard(
        window.location.hash === '#content-card' ||
        window.location.pathname === '/content-card'
      );
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showBentoShowcase, setShowBentoShowcase] = useState<boolean>(false);
  const [isSopOptionsOpen, setIsSopOptionsOpen] = useState<boolean>(false);
  const [showGurujiHome, setShowGurujiHome] = useState<boolean>(true);

  // Role & Permissions State: Learner · Manager · Admin (ID locking ready)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('guruji_user_role') as UserRole) || 'learn';
  });
  // If user clicked the instant HTML shell before React mounted, open Role Modal immediately
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(() => {
    const clickedEarly = Boolean((window as any).__gurujiExploreClicked);
    if (clickedEarly) {
      (window as any).__gurujiExploreClicked = false;
    }
    return clickedEarly;
  });

  // Navigation & Flow State:
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [extractedDocForModal, setExtractedDocForModal] = useState<ExtractedDocument | null>(null);

  // Validation Error State:
  const [validationError, setValidationError] = useState<{ filename: string; reason: string } | null>(null);

  // AI Pipeline State:
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analyzingSop, setAnalyzingSop] = useState<{
    title: string;
    lesson: Lesson;
    confirmationText?: string;
    filename?: string;
  } | null>(null);

  const [activePassport, setActivePassport] = useState<ProcessPassport | null>(null);
  const [perceiveObservation, setPerceiveObservation] = useState<PerceiveObservation | null>(null);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState<boolean>(false);
  const [activeDeckPlan, setActiveDeckPlan] = useState<any>(null);

  // Onboarding Journey States:
  const [welcomeLesson, setWelcomeLesson] = useState<Lesson | null>(null);
  const [isExperiencedCheckOpen, setIsExperiencedCheckOpen] = useState<boolean>(false);
  const [isLearningJourneyOpen, setIsLearningJourneyOpen] = useState<boolean>(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Active Learning Mode States:
  const [isIntroDeckOpen, setIsIntroDeckOpen] = useState<boolean>(false);
  const [isVideoDemoOpen, setIsVideoDemoOpen] = useState<boolean>(false);
  const [activeSimulator, setActiveSimulator] = useState<Lesson | null>(null);
  const [simulatorPhase, setSimulatorPhase] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Omnipresent Stage Controls:
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState<boolean>(false);
  const [isGyanModalOpen, setIsGyanModalOpen] = useState<boolean>(false);
  const [isMicroLessonOpen, setIsMicroLessonOpen] = useState<boolean>(false);
  const [currentContextTitle, setCurrentContextTitle] = useState<string>('Standard Operating Procedure');

  const isPipelineProcessingRef = useRef<boolean>(false);

  // Helper to persist extracted SOP to Firestore database, server disk repository, and local cache
  const saveToPersistentRepository = useCallback(async (lesson: Lesson) => {
    // 1. Authoritative Firestore Database Persistence
    try {
      const { saveSopToFirestore } = await import('./services/firestorePersistence');
      await saveSopToFirestore(lesson);
      console.log(`[Firestore Sync] Persisted module '${lesson.title}' to Firestore database.`);
    } catch (fsErr) {
      console.warn('[Firestore Sync Error]:', fsErr);
    }

    // 2. Server Repository Backup
    try {
      await fetch('/api/repository/sops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson }),
      });
      console.log(`[Repository Sync] Successfully persisted '${lesson.title}' to server repository.`);
    } catch (err) {
      console.warn('[Repository Sync] Failed to persist to server, falling back to local cache:', err);
    }

    // 3. Local Cache Fallback
    try {
      const cached = JSON.parse(localStorage.getItem('guruji_sop_repository') || '[]');
      const updated = [lesson, ...cached.filter((l: any) => l.id !== lesson.id)];
      localStorage.setItem('guruji_sop_repository', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  }, []);

  // Hydrate initial lessons and prefetch key views right after first paint
  useEffect(() => {
    let cancelled = false;
    import('./data/lessonsData').then(({ INITIAL_LESSONS }) => {
      if (!cancelled) {
        setLessons((prev) => (prev.length === 0 ? INITIAL_LESSONS : prev));
      }
    });

    // Background prefetch of LibraryView & GyanChatModal after initial interaction is ready
    const prefetchTimer = setTimeout(() => {
      import('./components/LibraryView');
      import('./components/GyanChatModal');
    }, 250);

    const fetchRepositorySops = async () => {
      // 1. Fast Local & Server Repository Fetch First
      try {
        const res = await fetch('/api/repository/sops');
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.sops) && data.sops.length > 0) {
          setLessons((prev) => {
            const incomingIds = new Set(data.sops.map((s: any) => s.id));
            const existingNonDuplicates = prev.filter((l) => !incomingIds.has(l.id));
            return [...data.sops, ...existingNonDuplicates];
          });
        }
      } catch (err) {
        // fallback to localStorage
        try {
          const cached = JSON.parse(localStorage.getItem('guruji_sop_repository') || '[]');
          if (!cancelled && Array.isArray(cached) && cached.length > 0) {
            setLessons((prev) => {
              const incomingIds = new Set(cached.map((s: any) => s.id));
              const existingNonDuplicates = prev.filter((l) => !incomingIds.has(l.id));
              return [...cached, ...existingNonDuplicates];
            });
          }
        } catch (e) {
          // ignore
        }
      }

      // 2. Background Firestore Sync (non-blocking)
      try {
        const { getAllSopsFromFirestore } = await import('./services/firestorePersistence');
        const firestoreSops = await getAllSopsFromFirestore();
        if (!cancelled && firestoreSops && firestoreSops.length > 0) {
          setLessons((prev) => {
            const incomingIds = new Set(firestoreSops.map((s) => s.id));
            const existingNonDuplicates = prev.filter((l) => !incomingIds.has(l.id));
            return [...firestoreSops, ...existingNonDuplicates];
          });
        }
      } catch (fsErr) {
        // non-blocking
      }
    };

    const timer = setTimeout(() => {
      fetchRepositorySops();
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(prefetchTimer);
      clearTimeout(timer);
    };
  }, []);

  // Load ProcessPassport lazily only when Passport Modal is opened
  useEffect(() => {
    if (isPassportModalOpen && (!activePassport || !perceiveObservation)) {
      import('./utils/blueprintEngine').then(({ buildProcessPassport, perceiveImage }) => {
        if (!activePassport) setActivePassport(buildProcessPassport('Warehouse Order Picking', 'Picker'));
        if (!perceiveObservation) setPerceiveObservation(perceiveImage('SOP_Page.png'));
      });
    }
  }, [isPassportModalOpen, activePassport, perceiveObservation]);

  // Load Slide Plan lazily only when Intro Deck is opened
  useEffect(() => {
    if (isIntroDeckOpen && selectedLesson) {
      import('./experiment/Planner').then(({ planSlides }) => {
        setActiveDeckPlan(planSlides(selectedLesson));
      });
    } else {
      setActiveDeckPlan(null);
    }
  }, [isIntroDeckOpen, selectedLesson]);

  // Apple Dark Theme Canvas Background Management (black and translucent cards)
  React.useEffect(() => {
    const targetColor = '#000000';
    document.body.style.backgroundColor = targetColor;
    document.documentElement.style.backgroundColor = targetColor;
  }, []);

  /**
   * AUTHORITATIVE SOP PIPELINE HANDLER
   * Extracted Document -> Validation -> Domain Neutral Generator -> Lesson Generation -> Play Lesson
   */
  const handleProcessExtractedDocument = useCallback(async (extractedDoc: ExtractedDocument) => {
    if (isPipelineProcessingRef.current) {
      console.warn('[SOP Pipeline] Transition already in progress, ignoring duplicate trigger.');
      return;
    }
    isPipelineProcessingRef.current = true;
    setIsProcessing(true);
    console.log('[SOP Pipeline START] Processing extracted document:', extractedDoc.filename);

    try {
      // 1. CLEAR PREVIOUS SESSION STATE (Cross-session contamination protection)
      setSelectedLesson(null);
      setActiveSimulator(null);
      setWelcomeLesson(null);
      setIsIntroDeckOpen(false);
      setIsExperiencedCheckOpen(false);
      setValidationError(null);

      // 2. SOURCE FIDELITY VALIDATION (Dynamically imported on demand)
      const [
        { validateSourceFidelity },
        { generateDomainNeutralLesson },
        { perceiveImage },
      ] = await Promise.all([
        import('./utils/sourceValidator'),
        import('./utils/domainNeutralGenerator'),
        import('./utils/blueprintEngine'),
      ]);

      const validation = validateSourceFidelity(extractedDoc);

      if (!validation.isValid) {
        console.error('[SOP Pipeline REJECTED]:', validation.errorReason);
        setValidationError({
          filename: extractedDoc.filename,
          reason: validation.errorReason || 'Unusable or corrupt document.',
        });
        return; // STOP IMMEDIATELY! finally block will clear isProcessing
      }

      // 3. GENERATE OPERATIONAL BLUEPRINT VIA SERVER LLM OR LOCAL BRAIN
      let opBlueprint;
      try {
        const bpController = new AbortController();
        const bpTimeout = setTimeout(() => bpController.abort(), 60000);
        const res = await fetch('/api/gemini/generate-blueprint', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            rawText: extractedDoc.rawText,
            fileBase64: extractedDoc.fileBase64,
            mimeType: extractedDoc.mimeType,
            filename: extractedDoc.filename,
            fileHash: extractedDoc.fileHash,
            pageCount: extractedDoc.pageCount,
            wordCount: extractedDoc.wordCount,
          }),
          signal: bpController.signal,
        });
        clearTimeout(bpTimeout);
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.success && data.blueprint && data.blueprint.operational_steps) {
            console.log('[SOP Pipeline SUCCESS] Generated Deep Operational Blueprint via Gemini Server LLM');
            opBlueprint = data.blueprint;
          } else {
            console.warn('[SOP Pipeline] Server LLM returned:', data.error || data.reason || data.message);
          }
        } else {
          console.warn('[SOP Pipeline] Server returned HTTP', res.status, res.statusText);
        }
      } catch (err: any) {
        console.warn('[SOP Pipeline] Server LLM blueprint error or timeout:', err?.message || err);
      }

      // Secondary Fallback via /api/coach
      if (!opBlueprint) {
        try {
          console.log('[SOP Pipeline] Trying secondary endpoint /api/coach for blueprint generation...');
          const coachController = new AbortController();
          const coachTimeout = setTimeout(() => coachController.abort(), 60000);
          const coachRes = await fetch('/api/coach', {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
              prompt: `Transform this SOP ("${extractedDoc.filename}") into a high-fidelity OPERATIONAL BLUEPRINT. For EACH operational step, generate a realistic workplace scenario question, 3 nuanced choices with compliant rationale and realistic failure modes (subtitle), pro coach tip, and hint. Return JSON with document_identity, role, process, purpose, scope, operational_steps (instruction, category, why_it_matters, scenario_question, task_title, target_code, choices: [{id, title, subtitle, isCorrect}], coach_tip, hint, critical_control, source), decision_points, critical_controls, safety_rules, tools_and_systems, terminology. Document text:\n"""\n${extractedDoc.rawText.slice(0, 32000)}\n"""`,
              systemInstruction: 'You are an expert instructional designer and workplace assessment engineer. Generate deep, authentic frontline questions grounded strictly in the SOP with realistic failure distractors. Respond strictly with valid JSON.',
              maxOutputTokens: 6000,
            }),
            signal: coachController.signal,
          });
          clearTimeout(coachTimeout);
          if (coachRes.ok) {
            const coachData = await coachRes.json().catch(() => ({}));
            if (coachData.operational_steps) {
              console.log('[SOP Pipeline SUCCESS via /api/coach] Generated Operational Blueprint');
              opBlueprint = coachData;
            }
          }
        } catch (coachErr: any) {
          console.warn('[SOP Pipeline] /api/coach fallback error or timeout:', coachErr?.message || coachErr);
        }
      }

      // 4. DOMAIN-NEUTRAL BLUEPRINT & LESSON GENERATION
      const { lesson, passport, blueprint } = generateDomainNeutralLesson(extractedDoc, opBlueprint);

      // 5. SECONDARY FIDELITY CHECK ON GENERATED LESSON
      const lessonValidation = validateSourceFidelity(extractedDoc, lesson, blueprint, passport);
      if (!lessonValidation.isValid) {
        console.error('[SOP Pipeline REJECTED Lesson]:', lessonValidation.errorReason);
        setValidationError({
          filename: extractedDoc.filename,
          reason: lessonValidation.errorReason || 'Generated lesson failed source fidelity validation.',
        });
        return; // STOP IMMEDIATELY! finally block will clear isProcessing
      }

      // Update state with newly generated document-driven lesson
      setCurrentContextTitle(lesson.title);
      setActivePassport(passport);
      setPerceiveObservation(perceiveImage(`${extractedDoc.filename}`));

      setLessons((prev) => {
        const exists = prev.some((l) => l.id === lesson.id);
        if (exists) {
          return prev.map((l) => (l.id === lesson.id ? lesson : l));
        }
        return [lesson, ...prev];
      });

      // Persist to server disk repository & local storage cache
      saveToPersistentRepository(lesson);

      setSelectedLesson(lesson);

      setAnalyzingSop({
        title: lesson.title,
        lesson,
        confirmationText: extractedDoc.confirmationText,
        filename: extractedDoc.filename,
      });
    } catch (err: any) {
      console.error('[SOP Pipeline ERROR]:', err);
      setValidationError({
        filename: extractedDoc.filename,
        reason: `Failed to process document: ${err?.message || 'Processing error'}`,
      });
    } finally {
      setIsProcessing(false);
      isPipelineProcessingRef.current = false;
    }
  }, []);

  // Preset SOP selection from Library / Demo
  const handleSelectSop = (lessonId: string, customTitle?: string) => {
    const lesson = lessons.find((l) => l.id === lessonId) || lessons[0];
    const title = customTitle || lesson.title;
    setCurrentContextTitle(title);

    // Clear previous simulation state
    setSelectedLesson(null);
    setActiveSimulator(null);
    setIsIntroDeckOpen(false);

    if (lesson.sourceMeta?.rawText) {
      handleProcessExtractedDocument({
        filename: lesson.sourceMeta.filename,
        rawText: lesson.sourceMeta.rawText,
        wordCount: lesson.sourceMeta.wordCount,
        pageCount: lesson.sourceMeta.pageCount,
        fileHash: lesson.sourceMeta.fileHash,
        confirmationText: lesson.sourceMeta.confirmationText,
        diagnostics: {
          totalChars: lesson.sourceMeta.rawText.length,
          readableChars: lesson.sourceMeta.rawText.length,
          controlChars: 0,
          replacementChars: 0,
          wordCount: lesson.sourceMeta.wordCount,
          pageCount: lesson.sourceMeta.pageCount,
        },
        mimeType: 'text/plain',
        extractedAt: new Date().toISOString(),
      });
    } else {
      setSelectedLesson(lesson);
      setAnalyzingSop({
        title,
        lesson,
        confirmationText: 'Loaded verified SOP checklist',
        filename: lesson.title,
      });
    }
  };

  const handleAiUnderstandComplete = () => {
    if (analyzingSop) {
      setSelectedLesson(analyzingSop.lesson);
      setAnalyzingSop(null);
    }
  };



  // Learner Journey Start-point Branching:
  const handleSelectExperienceLevel = (level: ExperienceLevel) => {
    const target = welcomeLesson || lessons[0];
    setWelcomeLesson(null);

    if (level === 'experienced') {
      setIsExperiencedCheckOpen(true);
    } else {
      setSelectedLesson(target);
      setIsIntroDeckOpen(true);
    }
  };

  const handleExperiencedCheckPass = () => {
    const target = welcomeLesson || selectedLesson || lessons[0];
    setIsExperiencedCheckOpen(false);
    setSelectedLesson(target);
    handleStartSimulation(0, target);
  };

  const handleExperiencedCheckFail = () => {
    const target = welcomeLesson || selectedLesson || lessons[0];
    setIsExperiencedCheckOpen(false);
    setSelectedLesson(target);
    setIsIntroDeckOpen(true);
  };

  const handleStartSimulation = (phase: number = 1, targetLesson?: Lesson) => {
    const lesson = targetLesson || selectedLesson || lessons[0];
    setSimulatorPhase(phase);
    setActiveSimulator(lesson);
    setSelectedLesson(lesson);
    setIsIntroDeckOpen(false);
  };

  const handleSimulationFinish = async (score: number) => {
    if (!activeSimulator) return;
    setLessons((prev) =>
      prev.map((l) =>
        l.id === activeSimulator.id
          ? {
              ...l,
              progress: Math.min(100, Math.max(l.progress, score)),
              masteryPercentage: Math.min(100, Math.max(l.masteryPercentage, score)),
            }
          : l
      )
    );

    // Save assessment attempt & progress in Firestore
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passed = score >= 80;
    const { saveAttemptToFirestore, saveProgressToFirestore } = await import('./services/firestorePersistence');
    await saveAttemptToFirestore({
      id: attemptId,
      userId: 'user_active',
      userName: 'Active Learner',
      quizId: `quiz_${activeSimulator.id}`,
      sopId: activeSimulator.id,
      sopTitle: activeSimulator.title,
      score,
      passed,
      completedAt: new Date().toISOString()
    });

    await saveProgressToFirestore({
      userId: 'user_active',
      userName: 'Active Learner',
      completedMilestones: [activeSimulator.id],
      phase1Progress: score,
      phase2Progress: score,
      phase3Progress: score,
      lastActiveAt: new Date().toISOString()
    });
  };


  const handleResetData = () => {
    import('./data/lessonsData').then(({ INITIAL_LESSONS }) => {
      setLessons(INITIAL_LESSONS);
    });
  };

  if (isDesignCheck) {
    return (
      <React.Suspense fallback={null}>
        <DesignCheckScreen onBack={() => { window.location.hash = ''; setIsDesignCheck(false); }} />
      </React.Suspense>
    );
  }

  if (isContentCard) {
    return (
      <React.Suspense fallback={null}>
        <ContentCardScreen lesson={selectedLesson || undefined} onBack={() => { window.location.hash = ''; setIsContentCard(false); }} />
      </React.Suspense>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans relative bg-black text-white selection:bg-white/20 selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Ambient Apple VisionOS Specular Glow Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-white/[0.03] blur-[140px]" />
        <div className="absolute top-1/3 -right-24 w-[400px] h-[400px] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-20 -left-20 w-[450px] h-[450px] rounded-full bg-slate-500/[0.03] blur-[130px]" />
      </div>

      {/* Main Tab Views & Bottom Navigation (only rendered when NOT in an active lesson, deck, or simulation) */}
      {!selectedLesson && !activeSimulator && !isIntroDeckOpen && (
    <>
      {activeTab === 'home' && (
        <main className="flex-1 flex flex-col w-full animate-in fade-in duration-200">
          {showGurujiHome ? (
            <div className="max-w-lg mx-auto w-full">
              <MeetGurujiScreen
                onContinue={() => {
                  sounds.playTap();
                  setIsRoleModalOpen(true);
                }}
              />
            </div>
          ) : (
            <React.Suspense fallback={null}>
              {currentUserRole === 'admin' ? (
                <AdminDashboardView
                  lessons={lessons}
                  onScanClick={() => setIsScanOpen(true)}
                  onUploadClick={() => setIsUploadOpen(true)}
                  onSelectSop={handleSelectSop}
                  onDeleteSop={(id) => {
                    fetch(`/api/repository/sops/${id}`, { method: 'DELETE' });
                    setLessons((prev) => prev.filter((l) => l.id !== id));
                  }}
                  onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
                  onBackToHome={() => {
                    sounds.playTap();
                    setIsRoleModalOpen(true);
                  }}
                />
              ) : currentUserRole === 'manager' ? (
                <ManagerDashboardView
                  lessons={lessons}
                  onSelectSop={handleSelectSop}
                  onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
                  onBackToHome={() => {
                    sounds.playTap();
                    setIsRoleModalOpen(true);
                  }}
                />
              ) : (
                <div className="max-w-lg mx-auto w-full">
                  <HomeScreen
                    lessons={lessons}
                    onScanClick={() => setIsScanOpen(true)}
                    onUploadClick={() => setIsUploadOpen(true)}
                    onSelectSop={handleSelectSop}
                    onExploreLibrary={() => setActiveTab('library')}
                    onOpenPassport={() => setIsPassportModalOpen(true)}
                    onShowGurujiWelcome={() => setIsRoleModalOpen(true)}
                    onOpenLearningJourney={() => setIsLearningJourneyOpen(true)}
                    userRole={currentUserRole}
                  />
                </div>
              )}
            </React.Suspense>
          )}

              {/* Modern Ultra-Sleek Glass SOP Selection Drawer (Role-Permission Aware) */}
              {isSopOptionsOpen && (
                <div className="fixed inset-0 z-50 bg-[#070A14]/80 backdrop-blur-2xl flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                  <div className="w-full max-w-md bg-[#0D1226]/95 backdrop-blur-3xl border-t sm:border border-white/10 rounded-t-[36px] sm:rounded-[36px] p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.7)] space-y-4 animate-in slide-in-from-bottom-8 duration-300 text-white">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-400 block">
                          {currentUserRole === 'admin' ? 'Admin Master Mode' : currentUserRole === 'manager' ? 'Manager SOP Review' : 'Frontline Learning'}
                        </span>
                        <h3 className="text-xl font-bold tracking-tight text-white mt-0.5">
                          {currentUserRole === 'admin' ? 'Manage SOPs' : 'Choose SOP'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsSopOptionsOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
                        aria-label="Close"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Action Cards Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Option 1: Housekeeping Featured SOP */}
                      <button
                        onClick={() => {
                          sounds.playTap();
                          setIsSopOptionsOpen(false);
                          handleSelectSop('housekeeping_sanitization', 'Housekeeping: Room Sanitization');
                        }}
                        className="col-span-2 relative overflow-hidden bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-2xl p-4 transition-all flex items-center justify-between group cursor-pointer text-left shadow-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white text-lg shadow-inner group-hover:scale-105 transition-transform">
                            🧹
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                              Verified SOP
                            </span>
                            <span className="text-sm font-bold text-white block leading-tight">
                              Room Sanitization
                            </span>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>

                      {/* Option 2 & 3: SCAN & UPLOAD (ONLY ADMIN HAS ACCESS) */}
                      {currentUserRole === 'admin' ? (
                        <>
                          <button
                            onClick={() => {
                              sounds.playTap();
                              setIsSopOptionsOpen(false);
                              setIsScanOpen(true);
                            }}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 backdrop-blur-md transition-all flex flex-col justify-between items-start group cursor-pointer text-left h-32"
                          >
                            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                              <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                <circle cx="12" cy="13" r="3" />
                              </svg>
                            </div>
                            <div className="mt-2">
                              <span className="text-[10px] font-semibold text-emerald-400 block uppercase tracking-wider">
                                Admin Scan
                              </span>
                              <span className="text-sm font-bold text-white block leading-tight">
                                Scan SOP
                              </span>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              sounds.playTap();
                              setIsSopOptionsOpen(false);
                              setIsUploadOpen(true);
                            }}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 backdrop-blur-md transition-all flex flex-col justify-between items-start group cursor-pointer text-left h-32"
                          >
                            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" x2="12" y1="3" y2="15" />
                              </svg>
                            </div>
                            <div className="mt-2">
                              <span className="text-[10px] font-semibold text-emerald-400 block uppercase tracking-wider">
                                Admin Upload
                              </span>
                              <span className="text-sm font-bold text-white block leading-tight">
                                Upload PDF
                              </span>
                            </div>
                          </button>
                        </>
                      ) : (
                        /* For Learner & Manager: show curriculum & practice shortcut */
                        <div className="col-span-2 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 flex items-center justify-between">
                          <span>
                            {currentUserRole === 'manager'
                              ? 'Logged in as Manager: Assign SOPs & inspect scores in Manager Hub'
                              : 'Logged in as Learner: Start drills & track your results'}
                          </span>
                          <button
                            onClick={() => {
                              setIsSopOptionsOpen(false);
                              setIsRoleModalOpen(true);
                            }}
                            className="text-xs text-indigo-400 font-bold underline ml-2 shrink-0 cursor-pointer"
                          >
                            Switch
                          </button>
                        </div>
                      )}

                      {/* Option 4: Browse Library */}
                      <button
                        onClick={() => {
                          sounds.playTap();
                          setIsSopOptionsOpen(false);
                          setActiveTab('library');
                        }}
                        className="col-span-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
                      >
                        <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 7v14" />
                          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
                        </svg>
                        <span>{currentUserRole === 'admin' ? 'Manage SOP Repository →' : 'Browse My Learning →'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>
          )}

          {activeTab === 'library' && (
            <React.Suspense fallback={null}>
              <main className="flex-1 flex flex-col max-w-lg mx-auto w-full animate-in fade-in duration-200">
                <LibraryView
                  lessons={lessons}
                  onSelectLesson={(lesson) => {
                    handleSelectSop(lesson.id, lesson.title);
                  }}
                />
              </main>
            </React.Suspense>
          )}

          {activeTab === 'progress' && (
            <React.Suspense fallback={null}>
              <main className="flex-1 flex flex-col max-w-lg mx-auto w-full animate-in fade-in duration-200">
                <ProgressView
                  lessons={lessons}
                  onStartSimulation={(lessonId) => {
                    const found = lessons.find((l) => l.id === lessonId) || lessons[0];
                    handleSelectSop(found.id, found.title);
                  }}
                  onOpenLearningJourney={() => setIsLearningJourneyOpen(true)}
                />
              </main>
            </React.Suspense>
          )}

          {activeTab === 'pilot' && (
            <React.Suspense fallback={null}>
              <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full animate-in fade-in duration-200">
                {currentUserRole === 'manager' ? (
                  <ManagerDashboardView
                    lessons={lessons}
                    onSelectSop={handleSelectSop}
                    onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
                    onBackToHome={() => {
                      sounds.playTap();
                      setCurrentUserRole('learn');
                      localStorage.setItem('guruji_user_role', 'learn');
                      setActiveTab('home');
                    }}
                  />
                ) : currentUserRole === 'admin' ? (
                  <AdminDashboardView
                    lessons={lessons}
                    onScanClick={() => setIsScanOpen(true)}
                    onUploadClick={() => setIsUploadOpen(true)}
                    onSelectSop={handleSelectSop}
                    onDeleteSop={(id) => {
                      fetch(`/api/repository/sops/${id}`, { method: 'DELETE' });
                      setLessons((prev) => prev.filter((l) => l.id !== id));
                    }}
                    onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
                    onBackToHome={() => {
                      sounds.playTap();
                      setCurrentUserRole('learn');
                      localStorage.setItem('guruji_user_role', 'learn');
                      setActiveTab('home');
                    }}
                  />
                ) : (
                  <PilotDashboardView
                    onBackToHome={() => setActiveTab('home')}
                    onSelectLearnerSop={(learner) => {
                      handleSelectSop(learner.assignedSopId, learner.assignedSopTitle);
                    }}
                  />
                )}
              </main>
            </React.Suspense>
          )}

          {activeTab === 'profile' && (
            <React.Suspense fallback={null}>
              <main className="flex-1 flex flex-col max-w-lg mx-auto w-full animate-in fade-in duration-200">
                <ProfileView
                  onResetData={handleResetData}
                  onOpenBentoShowcase={() => setShowBentoShowcase(true)}
                  onOpenPassport={() => setIsPassportModalOpen(true)}
                  onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
                  role={currentUserRole}
                />
              </main>
            </React.Suspense>
          )}

          {/* Back button for navigation on top left */}
          {activeTab !== 'home' && !selectedLesson && (
            <button
              onClick={() => {
                sounds.playTap();
                setActiveTab('home');
                setShowGurujiHome(true);
              }}
              className="fixed top-4 left-4 z-40 p-2 rounded-full bg-slate-900/50 backdrop-blur-md text-white border border-white/10"
            >
              <svg className="rotate-180" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}

          {/* Floating Bottom Navigation Bar (Only on learner specific pages, hide during lessons/home) */}
          {currentUserRole === 'learn' && !selectedLesson && (activeTab === 'library' || activeTab === 'progress' || activeTab === 'profile') && (
            <React.Suspense fallback={null}>
              <BottomNav
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  sounds.playTap();
                  setActiveTab(tab);
                  setShowGurujiHome(tab === 'home');
                }}
                role={currentUserRole}
                onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
              />
            </React.Suspense>
          )}
        </>
      )}

      {/* Localized Suspense Boundary for Conditionally Mounted Modals & Active Lesson Views */}
      <React.Suspense fallback={null}>
        {/* Ensure LessonOverview and following stages are visible */}
        {selectedLesson && !activeSimulator && !isIntroDeckOpen && !isExperiencedCheckOpen && !isVideoDemoOpen && (
          <LessonOverview
            lesson={selectedLesson}
            onBack={() => {
              setSelectedLesson(null);
              setWelcomeLesson(null);
            }}
            onOpenIntroDeck={() => setIsIntroDeckOpen(true)}
            onStartSimulation={(phase) => handleStartSimulation(phase)}
            onOpenVideoDemo={() => setIsVideoDemoOpen(true)}
            onAskTrainer={() => setIsTrainerModalOpen(true)}
          />
        )}

        {/* 1. STARTING OPTION: Scan the SOP Modal */}
        {isScanOpen && (
          <ScanModal
            isOpen={isScanOpen}
            onClose={() => setIsScanOpen(false)}
            onScanSuccess={(extractedDoc) => {
              setIsScanOpen(false);
              setIsAnalyzing(true);
              setTimeout(() => {
                setIsAnalyzing(false);
                setExtractedDocForModal(extractedDoc);
              }, 2000);
            }}
          />
        )}

        {/* 2. UPLOAD FILE / PASTE SOP TEXT MODAL */}
        {isUploadOpen && (
          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onUploadSuccess={(extractedDoc) => {
              setIsUploadOpen(false);
              setIsAnalyzing(true);
              setTimeout(() => {
                setIsAnalyzing(false);
                setExtractedDocForModal(extractedDoc);
              }, 2000);
            }}
          />
        )}

        {/* Analyzing Modal */}
        {isAnalyzing && (
          <AnalyzingModal 
            isOpen={isAnalyzing} 
            onCancel={() => setIsAnalyzing(false)} 
          />
        )}

        {/* 3. SOP GENERATION MODE SELECTION (AUTO-CREATE vs INSTRUCT MODE) */}
        {extractedDocForModal !== null && (
          <SopGenerationModal
            isOpen={extractedDocForModal !== null}
            onClose={() => setExtractedDocForModal(null)}
            extractedDoc={extractedDocForModal}
            onDeckCreated={(lesson) => {
              setExtractedDocForModal(null);
              setSelectedLesson(lesson);
              setLessons((prev) => [lesson, ...prev.filter((l) => l.id !== lesson.id)]);
              saveToPersistentRepository(lesson);
            }}
            onUploadNew={() => {
              setExtractedDocForModal(null);
              setIsUploadOpen(true);
            }}
          />
        )}

        {/* TRANSITION: AI Observes -> Understands SOP -> Ready */}
        {analyzingSop !== null && (
          <AiUnderstandModal
            isOpen={analyzingSop !== null}
            sopTitle={analyzingSop?.title || ''}
            confirmationText={analyzingSop?.confirmationText}
            filename={analyzingSop?.filename}
            onComplete={handleAiUnderstandComplete}
          />
        )}

        {/* STEP 1: WELCOME ONBOARDING JOURNEY: New / Some / Experienced */}
        {welcomeLesson && (
          <WelcomeJourneyModal
            lesson={welcomeLesson}
            isOpen={welcomeLesson !== null}
            onClose={() => setWelcomeLesson(null)}
            onSelectLevel={handleSelectExperienceLevel}
            onAskTrainer={() => setIsTrainerModalOpen(true)}
          />
        )}

        {/* STEP 2 (Experienced branch): 4-Question Check */}
        {isExperiencedCheckOpen && (
          <ExperiencedCheckModal
            isOpen={isExperiencedCheckOpen}
            lesson={welcomeLesson || selectedLesson}
            onClose={() => setIsExperiencedCheckOpen(false)}
            onPass={handleExperiencedCheckPass}
            onFail={handleExperiencedCheckFail}
            onAskTrainer={() => setIsTrainerModalOpen(true)}
          />
        )}

        {/* MODE 1: TRAINING DECK (Universal Teach Me Slide Deck) */}
        {isIntroDeckOpen && selectedLesson && activeDeckPlan && (
          <ExperiencePlayer
            lesson={selectedLesson}
            plan={activeDeckPlan}
            onClose={() => setIsIntroDeckOpen(false)}
            onComplete={() => {
              setIsIntroDeckOpen(false);
              handleStartSimulation(0);
            }}
          />
        )}

        {/* MODE 2: SHOW ME (Google Veo On-Demand AI Video Demonstration) */}
        {isVideoDemoOpen && selectedLesson && (
          <ShowMeVideoModal
            isOpen={isVideoDemoOpen}
            lesson={selectedLesson}
            onClose={() => setIsVideoDemoOpen(false)}
            onContinueToGuideMe={() => {
              setIsVideoDemoOpen(false);
              handleStartSimulation(1);
            }}
          />
        )}

        {/* MODES 2, 3, 4: SHOW ME (0), GUIDE ME (1), TEST ME (2) */}
        {activeSimulator && (
          <SimulatorScreen
            initialPhase={simulatorPhase}
            lesson={activeSimulator}
            sourceMeta={activeSimulator.sourceMeta}
            onClose={() => setActiveSimulator(null)}
            onFinish={handleSimulationFinish}
            onOpenBasics={() => {
              setIsIntroDeckOpen(true);
            }}
            onAskTrainer={() => setIsTrainerModalOpen(true)}
          />
        )}

        {/* OMNIPRESENT: Ask My Trainer Modal */}
        {isTrainerModalOpen && (
          <AskTrainerModal
            isOpen={isTrainerModalOpen}
            onClose={() => setIsTrainerModalOpen(false)}
            currentStepTitle={currentContextTitle}
          />
        )}

        {/* P0/P1/P2 Process Passport Trainer Review Modal */}
        {isPassportModalOpen && activePassport && perceiveObservation && (
          <ProcessPassportModal
            isOpen={isPassportModalOpen}
            passport={activePassport}
            perceiveResult={perceiveObservation}
            onClose={() => setIsPassportModalOpen(false)}
            onApprovePassport={(approved) => {
              setActivePassport(approved);
            }}
          />
        )}

        {/* Employee Learning Journey Modal */}
        {isLearningJourneyOpen && (
          <LearningJourneyModal
            isOpen={isLearningJourneyOpen}
            onClose={() => setIsLearningJourneyOpen(false)}
            onStartSimulation={(lessonId) => {
              handleSelectSop(lessonId);
            }}
          />
        )}

        {/* OMNIPRESENT: On The Floor Quick Micro-Lessons */}
        {isMicroLessonOpen && (
          <MicroLessonSheet
            isOpen={isMicroLessonOpen}
            onClose={() => setIsMicroLessonOpen(false)}
            onOpenBasics={() => {
              setIsIntroDeckOpen(true);
            }}
            onAskTrainer={() => setIsTrainerModalOpen(true)}
          />
        )}

        {/* Fullscreen Bento Architecture Showcase */}
        {showBentoShowcase && (
          <div className="fixed inset-0 z-50 bg-[#F7F7F5] dark:bg-[#0A0D12] overflow-y-auto animate-in fade-in duration-200">
            <BentoArchitectureShowcase onClose={() => setShowBentoShowcase(false)} />
          </div>
        )}

        {/* SOURCE FIDELITY VALIDATION ERROR MODAL */}
        {validationError !== null && (
          <ValidationErrorModal
            isOpen={validationError !== null}
            filename={validationError?.filename || 'Document'}
            errorReason={validationError?.reason || 'Content cannot be used.'}
            onClose={() => setValidationError(null)}
            onTryAnother={() => {
              setValidationError(null);
              setIsUploadOpen(true);
            }}
          />
        )}
      </React.Suspense>

      {/* Gyan AI Work Companion Side-Screen Pull-Out Drawer (Instant Fallback Tab + Lazy Drawer) */}
      <React.Suspense
        fallback={
          <button
            onClick={() => {
              sounds.playTap();
              setIsGyanModalOpen(true);
            }}
            title="Pull out Ask Gyan Drawer"
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center gap-1.5 w-7 sm:w-8 py-4 rounded-l-2xl bg-[#2C3444] hover:bg-[#384357] border-y border-l border-white/30 text-white shadow-[-8px_0_24px_rgba(44,52,68,0.45)] cursor-pointer transition-all active:scale-95 group"
          >
            <svg className="w-4 h-4 text-white/90 group-hover:-translate-x-0.5 transition-transform shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <svg className="w-3.5 h-3.5 text-[#A7C4F2] animate-pulse shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
            <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-extrabold tracking-widest uppercase text-white select-none">
              Ask Gyan
            </span>
          </button>
        }
      >
        <GyanChatModal
          isOpen={isGyanModalOpen}
          onOpen={() => setIsGyanModalOpen(true)}
          onClose={() => setIsGyanModalOpen(false)}
          activeLesson={selectedLesson || lessons[0]}
          onSelectLesson={(lessonId) => handleSelectSop(lessonId)}
          onCallTrainer={() => {
            setIsGyanModalOpen(false);
            setIsTrainerModalOpen(true);
          }}
          userRole={currentUserRole}
          userOrgId="org_default"
        />
      </React.Suspense>

      {isProcessing && (
        <div className="fixed inset-0 z-[60] bg-[#0E1116]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
           <div className="w-16 h-16 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
           <h2 className="text-xl font-bold text-white mb-2">Analyzing document...</h2>
           <p className="text-sm text-slate-300 max-w-xs mb-6">Building your operational training experience.</p>
           <button
             onClick={() => {
               setIsProcessing(false);
               isPipelineProcessingRef.current = false;
             }}
             className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
           >
             Cancel
           </button>
        </div>
      )}

      {/* THE EXACT NAVIGATION: ROLE SELECTION MODAL */}
      <RoleNavigationModal
        isOpen={isRoleModalOpen}
        activeRole={currentUserRole}
        onSelectRole={(role) => {
          setCurrentUserRole(role);
          localStorage.setItem('guruji_user_role', role);
          setShowGurujiHome(false);
          if (role === 'learn') {
            setActiveTab('library');
          } else {
            setActiveTab('home');
          }
        }}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </div>
  );
}
