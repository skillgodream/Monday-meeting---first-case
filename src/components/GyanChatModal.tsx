import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Folder,
  Mic,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  PhoneCall,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Lesson } from '../types';
import { sounds } from '../utils/audio';

export interface GyanCitation {
  docTitle: string;
  section: string;
  version: string;
  excerpt: string;
}

export interface GyanMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: GyanCitation[];
  verificationStatus?: 'verified' | 'partial' | 'insufficient';
  requiresEscalation?: boolean;
  escalationNotice?: string;
  recommendedModule?: {
    id: string;
    title: string;
    reason: string;
  } | null;
}

interface GyanChatModalProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  activeLesson?: Lesson | null;
  onSelectLesson?: (lessonId: string) => void;
  onCallTrainer?: () => void;
  userRole?: string;
  userOrgId?: string;
}

/**
 * Soft-Gradient Blurred Blue Circular Mesh Orb (matching top-left logo in reference screenshots)
 */
function SoftMeshOrb({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims =
    size === 'lg'
      ? 'w-14 h-14'
      : size === 'sm'
      ? 'w-8 h-8'
      : 'w-9 h-9';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      {/* Soft ambient shadow underneath */}
      <div className="absolute -bottom-2 inset-x-1 h-3 rounded-full bg-[#5B7DB1]/25 blur-md pointer-events-none" />
      <div
        className={`${dims} rounded-full relative overflow-hidden shadow-[inset_0_1px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(76,98,138,0.18)]`}
        style={{
          background:
            'radial-gradient(circle at 75% 25%, #DCE5F2 0%, #9BB3D8 36%, #5D7FB2 72%, #BAC9DF 100%)',
        }}
      >
        <div
          className="w-full h-full opacity-80 blur-[2px]"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(93,127,178,0.85) 52%, rgba(225,233,245,0.9) 100%)',
          }}
        />
      </div>
    </div>
  );
}

/**
 * 4-Pointed Star Sparkle SVG for the Circular Send Button (matching Screenshot 1)
 */
function FourPointStarIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.5C12.7 8.1 15.9 11.3 20.5 12C15.9 12.7 12.7 15.9 12 20.5C11.3 15.9 8.1 12.7 3.5 12C8.1 11.3 11.3 8.1 12 3.5Z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface TopicChip {
  id: string;
  label: string;
  prompt: string;
  defaultSelected?: boolean;
}

const SUGGESTIVE_TOPIC_CHIPS: TopicChip[] = [
  {
    id: 'torn-barcode',
    label: 'Torn Barcode',
    prompt: 'Can I scan this item if the barcode is torn?',
    defaultSelected: true,
  },
  {
    id: 'scanner-issue',
    label: 'Scanner Fix',
    prompt: 'My handheld is not working. How do I fix it?',
  },
  {
    id: 'pallet-close',
    label: 'Close Pallet',
    prompt: 'How do I close a pallet step by step?',
  },
  {
    id: 'safety-stop',
    label: 'Safety Stop',
    prompt: 'The conveyor is making a loud noise and smoking. What should I do?',
  },
  {
    id: 'room-sanitization',
    label: 'Sanitization SOP',
    prompt: 'What is the disinfectant dwell time for high-touch surfaces?',
  },
  {
    id: 'chemical-safety',
    label: 'PPE & Chemicals',
    prompt: 'What PPE is required before handling disinfectant chemicals?',
  },
  {
    id: 'damaged-return',
    label: 'Damaged Goods',
    prompt: 'What do I do when receiving a leaking or damaged return item?',
  },
  {
    id: 'new-joiner',
    label: 'Beginner Guide',
    prompt: 'I am new on the floor. What are the critical safety rules I must follow?',
    defaultSelected: true,
  },
  {
    id: 'cycle-count',
    label: 'Cycle Count',
    prompt: 'How do I handle a bin count variance during inventory cycle count?',
  },
  {
    id: 'forklift-check',
    label: 'Forklift Safety',
    prompt: 'What is the maximum stacking height and load rule for pallets?',
  },
  {
    id: 'shift-handover',
    label: 'Shift Rules',
    prompt: 'Can I swap shifts with my friend tomorrow?',
  },
  {
    id: 'quality-audit',
    label: 'Quality Check',
    prompt: 'How do I verify my station checklist before closing a task?',
    defaultSelected: true,
  },
];

const QUICK_ACTION_CARDS = [
  {
    id: 'card-1',
    text: 'Can I scan an item if the barcode is torn or smudged?',
  },
  {
    id: 'card-2',
    text: 'My handheld scanner screen is on but not scanning...',
  },
  {
    id: 'card-3',
    text: 'Walk me through closing and wrapping a pallet safely',
  },
];

export default function GyanChatModal({
  isOpen,
  onOpen,
  onClose,
  activeLesson,
  onSelectLesson,
  onCallTrainer,
  userRole = 'learn',
  userOrgId = 'org_default',
}: GyanChatModalProps) {
  // View state: 'topics' (View 1: Preference/Topic Pill Cloud) | 'chat' (View 2: Main Chatbot Interface)
  const [activeView, setActiveView] = useState<'topics' | 'chat'>('chat');

  // Selected topic chip IDs (up to 5)
  const [selectedChips, setSelectedChips] = useState<string[]>(
    SUGGESTIVE_TOPIC_CHIPS.filter((c) => c.defaultSelected).map((c) => c.id)
  );

  const [messages, setMessages] = useState<GyanMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [messages, isOpen, isLoading]);

  const toggleChipSelection = (chip: TopicChip) => {
    sounds.playTap();
    setSelectedChips((prev) => {
      if (prev.includes(chip.id)) {
        return prev.filter((id) => id !== chip.id);
      }
      if (prev.length >= 5) {
        return [...prev.slice(1), chip.id];
      }
      return [...prev, chip.id];
    });
  };

  const sendQueryToGyan = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    sounds.playTap();
    setActiveView('chat');

    const userMsg: GyanMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputQuery('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const selectedTopicNames = SUGGESTIVE_TOPIC_CHIPS.filter((c) =>
        selectedChips.includes(c.id)
      ).map((c) => c.label);

      const response = await fetch('/api/gyan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: updatedMessages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            activeLessonId: activeLesson?.id || '',
            activeLessonTitle: activeLesson?.title || 'Floor Operations SOP',
            currentStepTitle:
              selectedTopicNames.length > 0
                ? `Focus Topics: ${selectedTopicNames.join(', ')}`
                : 'Interactive Floor Support',
          },
          userRole,
          userOrgId,
        }),
      });

      const data = await response.json();

      const botMsg: GyanMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content:
          data.answer ||
          "Let's sort this out. Tell me what you see on your station right now.",
        citations: Array.isArray(data.citations) ? data.citations : [],
        verificationStatus: data.verificationStatus || 'verified',
        requiresEscalation: Boolean(data.requiresEscalation),
        escalationNotice: data.escalationNotice || '',
        recommendedModule: data.recommendedModule || null,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'assistant',
          content:
            "I couldn't reach the SOP server right now. If this is safety-critical, stop and check with your team lead directly.",
          requiresEscalation: true,
          escalationNotice: 'Check with your team lead or supervisor.',
        },
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    sounds.playTap();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleCopy = (id: string, text: string) => {
    sounds.playTap();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleVoiceInput = () => {
    sounds.playTap();
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInputQuery((prev) =>
        prev ? prev : 'My handheld scanner is not scanning barcodes.'
      );
      textareaRef.current?.focus();
      return;
    }
    if (isListening) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim().length > 0);
    return (
      <div className="space-y-1.5 text-[#1E2530] text-[15px] leading-[1.58] font-normal">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          const numberedMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
          if (numberedMatch) {
            return (
              <div key={i} className="flex items-start gap-2 pl-0.5">
                <span className="font-semibold text-[#2C4464] shrink-0">
                  {numberedMatch[1]}
                </span>
                <span className="flex-1">{numberedMatch[2].replace(/\*\*/g, '')}</span>
              </div>
            );
          }

          const bulletMatch = trimmed.match(/^([•\-*])\s+(.*)$/);
          if (bulletMatch) {
            return (
              <div key={i} className="flex items-start gap-2 pl-1">
                <span className="text-[#4C628A] font-bold shrink-0">•</span>
                <span className="flex-1">{bulletMatch[2].replace(/\*\*/g, '')}</span>
              </div>
            );
          }

          return <p key={i}>{trimmed.replace(/\*\*/g, '')}</p>;
        })}
      </div>
    );
  };

  // Active chips to show as quick suggestive pills in the Chat view
  const prioritizedChips = [
    ...SUGGESTIVE_TOPIC_CHIPS.filter((c) => selectedChips.includes(c.id)),
    ...SUGGESTIVE_TOPIC_CHIPS.filter((c) => !selectedChips.includes(c.id)),
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop overlay when pulled out */}
      <div
        onClick={() => {
          if (!isOpen) return;
          sounds.playTap();
          onClose();
        }}
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Side-Screen Pull-Out Drawer Container — stays inside right side screen (translate-x-full) until clicked */}
      <div
        className={`relative z-10 w-[calc(100%-2rem)] sm:w-[440px] h-[100dvh] rounded-l-[36px] flex flex-col overflow-visible border-l border-white/60 shadow-[-24px_0_70px_rgba(25,38,62,0.45)] font-sans transition-transform duration-300 ease-in-out pointer-events-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background:
            'linear-gradient(180deg, #FFFFFF 0%, #F7F9FC 42%, #DFG7F3 72%, #9AB0CE 86%, #4C628A 100%)',
          backgroundImage:
            'linear-gradient(180deg, #FFFFFF 0%, #F6F8FC 45%, #D9E3F1 73%, #89A2C6 88%, #4C628A 100%)',
        }}
      >
        {/* Attached Side-Screen Pull Handle Tab on Left Edge of Drawer */}
        <button
          onClick={() => {
            sounds.playTap();
            if (isOpen) {
              onClose();
            } else {
              onOpen?.();
            }
          }}
          title={isOpen ? 'Push Ask Gyan Drawer Back' : 'Pull out Ask Gyan Drawer'}
          className="flex flex-col items-center justify-center gap-1.5 absolute left-0 -translate-x-full top-1/2 -translate-y-1/2 w-7 sm:w-8 py-4 rounded-l-2xl bg-[#2C3444] hover:bg-[#384357] border-y border-l border-white/30 text-white shadow-[-8px_0_24px_rgba(44,52,68,0.45)] cursor-pointer transition-all active:scale-95 group"
        >
          {isOpen ? (
            <ChevronRight className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform shrink-0" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white/90 group-hover:-translate-x-0.5 transition-transform shrink-0" />
          )}
          <Sparkles className="w-3.5 h-3.5 text-[#A7C4F2] animate-pulse shrink-0" />
          <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-extrabold tracking-widest uppercase text-white select-none">
            Ask Gyan
          </span>
        </button>

        {/* ============================================================
            VIEW 1: ONBOARDING / TOPIC PREFERENCE SELECTION SCREEN
            ============================================================ */}
        {activeView === 'topics' ? (
          <div className="flex-1 flex flex-col justify-between px-6 pt-7 pb-9 overflow-y-auto rounded-l-[36px]">
            <div>
              {/* Top Header Group */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SoftMeshOrb size="md" />
                  <span className="text-[19px] font-bold tracking-tight text-[#11161F]">
                    Gyan Ai
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setActiveView('chat');
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-[#2C3444] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Back to Chat
                  </button>
                  <button
                    onClick={() => {
                      sounds.playTap();
                      onClose();
                    }}
                    className="w-8 h-8 rounded-full bg-slate-900/5 hover:bg-slate-900/10 text-[#2C3444] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-10">
                <h1 className="text-[32px] leading-[1.15] font-medium text-[#1A212B] tracking-tight">
                  Customize your SOP companion
                </h1>
                <p className="text-[14px] text-[#7B8492] mt-2.5 font-normal">
                  You can select up to 5 topics ({selectedChips.length}/5 selected)
                </p>
              </div>

              {/* Interactive Asymmetrical Chip Cloud */}
              <div className="flex flex-wrap gap-3 mt-8">
                {SUGGESTIVE_TOPIC_CHIPS.map((chip) => {
                  const isSelected = selectedChips.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      onClick={() => toggleChipSelection(chip)}
                      className={`rounded-full px-5 py-3 text-[14px] font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-[#2C3444] text-white border border-[#2C3444] shadow-[0_8px_20px_rgba(44,52,68,0.22)]'
                          : 'bg-white/95 hover:bg-white text-[#2E4668] border border-gray-200/80 shadow-[0_2px_10px_rgba(76,98,138,0.06)]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Glassy Pill CTA Button */}
            <div className="pt-8 flex justify-center">
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveView('chat');
                }}
                className="w-[82%] rounded-full py-4 px-8 text-center bg-gradient-to-b from-white/95 to-[#DCE6F5]/90 backdrop-blur-xl border border-white/90 shadow-[0_14px_34px_rgba(32,52,84,0.28)] text-[#243B5A] text-[15px] font-medium tracking-[0.06em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>GET STARTED</span>
                <span className="text-lg leading-none font-normal">+</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================
             VIEW 2: MAIN CHATBOT INTERFACE
             ============================================================ */
          <div className="flex-1 flex flex-col justify-between overflow-hidden rounded-l-[36px]">
            {/* Top Navigation & Orb Bar */}
            <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <SoftMeshOrb size="lg" />
                {messages.length > 0 && (
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1A212B] leading-tight">
                      Gyan Ai
                    </h2>
                    <span className="text-[11px] text-[#68778D] block">
                      {activeLesson?.title || 'SOP Floor Companion'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      sounds.playTap();
                      setMessages([]);
                    }}
                    title="Reset chat"
                    className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-gray-200/70 text-[#2C3444] flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <button
                  onClick={() => {
                    sounds.playTap();
                    setActiveView('topics');
                  }}
                  title="Customize suggestive topics"
                  className="px-3.5 py-2 rounded-full bg-white/85 hover:bg-white border border-gray-200/70 text-[#2C3444] text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <SlidersHorizontal size={13} />
                  <span>Topics</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playTap();
                    onClose();
                  }}
                  title="Close drawer"
                  className="w-9 h-9 rounded-full bg-white/85 hover:bg-white border border-gray-200/70 text-[#2C3444] flex items-center justify-center shadow-xs transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Body: Welcome State OR Active Conversation Stream */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5">
              {messages.length === 0 ? (
                <div className="space-y-6 pt-2 animate-in fade-in duration-200">
                  {/* Salutation & Large Light Prompt Text (Exact match to Screenshot 1) */}
                  <div className="space-y-3">
                    <h1 className="text-[34px] leading-[1.14] font-medium text-[#171C24] tracking-tight">
                      Good morning,
                      <br />
                      {userRole === 'manager'
                        ? 'Supervisor'
                        : userRole === 'admin'
                        ? 'Admin'
                        : 'Partner'}
                    </h1>
                    <p className="text-[24px] sm:text-[25px] leading-[1.28] text-[#9AA1AC] font-light tracking-tight">
                      What is your plan for today’s shift? Don’t be afraid to ask any SOP or floor question.
                    </p>
                  </div>

                  {/* Suggestive Topic Pills Cloud (One-tap to ask or populate) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Suggested Topics — Tap to Ask
                      </span>
                      <button
                        onClick={() => {
                          sounds.playTap();
                          setActiveView('topics');
                        }}
                        className="text-[11px] font-medium text-[#3B5984] hover:underline cursor-pointer"
                      >
                        Customize ({selectedChips.length}/5)
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prioritizedChips.slice(0, 7).map((chip) => {
                        const isSelected = selectedChips.includes(chip.id);
                        return (
                          <button
                            key={chip.id}
                            onClick={() => sendQueryToGyan(chip.prompt)}
                            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
                              isSelected
                                ? 'bg-[#2C3444] text-white shadow-sm'
                                : 'bg-white/90 hover:bg-white text-[#2E4668] border border-gray-200/80 shadow-xs'
                            }`}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horizontal Quick Action Suggestion Cards (Exact match to Screenshot 1) */}
                  <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
                    {QUICK_ACTION_CARDS.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => sendQueryToGyan(card.text)}
                        className="min-w-[215px] max-w-[230px] shrink-0 bg-white/95 hover:bg-white rounded-[22px] rounded-br-[6px] p-4 text-left shadow-[0_8px_24px_rgba(76,98,138,0.08)] border border-white transition-all hover:-translate-y-0.5 active:scale-98 cursor-pointer"
                      >
                        <p className="text-[14px] text-[#1E2530] font-normal leading-snug line-clamp-2">
                          {card.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Active Chat Conversation Messages */
                <div className="space-y-4 pt-2 pb-2">
                  {/* Compact Suggestive Topic Pills strip at top of chat */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-6 px-6 no-scrollbar">
                    {prioritizedChips.slice(0, 6).map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => sendQueryToGyan(chip.prompt)}
                        disabled={isLoading}
                        className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium bg-white/85 hover:bg-white text-[#2C3444] border border-gray-200/70 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {messages.map((msg) => {
                    if (msg.role === 'user') {
                      return (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[85%] rounded-[24px] rounded-br-[6px] bg-[#2C3444] text-white px-4 py-3 shadow-[0_8px_22px_rgba(44,52,68,0.2)]">
                            <p className="text-[14px] leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className="bg-white/95 backdrop-blur-xl rounded-[26px] rounded-tl-[8px] p-4 shadow-[0_10px_28px_rgba(56,78,114,0.12)] border border-white space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <SoftMeshOrb size="sm" />
                            <span className="text-xs font-bold text-[#2C3444] tracking-tight">
                              Gyan Ai
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="text-gray-400 hover:text-gray-700 p-1 transition-colors cursor-pointer"
                            title="Copy answer"
                          >
                            {copiedId === msg.id ? (
                              <Check size={15} className="text-emerald-600" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                        </div>

                        {renderFormattedContent(msg.content)}

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {msg.citations.map((cit, cIdx) => (
                              <span
                                key={cIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#3B5984] text-[11px] font-medium"
                              >
                                <BookOpen size={11} />
                                {cit.docTitle} ({cit.version})
                              </span>
                            ))}
                          </div>
                        )}

                        {msg.requiresEscalation && msg.escalationNotice && (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-rose-900">
                              {msg.escalationNotice}
                            </span>
                            {onCallTrainer && (
                              <button
                                onClick={onCallTrainer}
                                className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold shrink-0 hover:bg-rose-700 cursor-pointer flex items-center gap-1"
                              >
                                <PhoneCall size={12} />
                                <span>Call Lead</span>
                              </button>
                            )}
                          </div>
                        )}

                        {msg.recommendedModule &&
                          msg.recommendedModule.id &&
                          onSelectLesson && (
                            <button
                              onClick={() => {
                                sounds.playTap();
                                onClose();
                                onSelectLesson(msg.recommendedModule!.id);
                              }}
                              className="w-full p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-slate-200/80 flex items-center justify-between text-left transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <BookOpen size={15} className="text-[#3B5984] shrink-0" />
                                <div className="truncate">
                                  <span className="text-xs font-semibold text-[#1E2530] block truncate">
                                    {msg.recommendedModule.title}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block truncate">
                                    Open interactive training module
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-[#3B5984] ml-2">→</span>
                            </button>
                          )}
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="space-y-2">
                      <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-4 shadow-md border border-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SoftMeshOrb size="sm" />
                          <span className="text-xs font-medium text-[#4C628A] animate-pulse">
                            Gyan is checking the SOP...
                          </span>
                        </div>
                        <button
                          onClick={handleStopGenerating}
                          className="px-3 py-1 rounded-full bg-[#2C3444] text-white text-[11px] font-medium hover:bg-black transition-colors cursor-pointer"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* ============================================================
                BOTTOM FLOATING GLASSMORPHIC CONSOLE (Exact Match to Screenshot 1)
                ============================================================ */}
            <div className="px-5 pb-6 pt-2 shrink-0">
              <div className="rounded-[32px] bg-white/55 backdrop-blur-2xl border border-white/75 shadow-[0_20px_50px_rgba(32,50,82,0.28)] overflow-hidden transition-all">
                {/* Upper Message Textarea Block */}
                <div className="px-5 pt-4 pb-3">
                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendQueryToGyan(inputQuery);
                      }
                    }}
                    placeholder="Ask Gyan any SOP question, or tap a suggested topic above..."
                    className="w-full bg-transparent border-none outline-none resize-none text-[14.5px] leading-[1.48] text-[#1A212B] placeholder:text-[#526075]/75 font-normal"
                  />
                </div>

                {/* Lower White Rounded Action Toolbar */}
                <div className="bg-white/95 rounded-[28px] px-5 py-3 flex items-center justify-between shadow-[0_-2px_14px_rgba(44,52,68,0.04)]">
                  {/* Left-Aligned Minimalist Outline Icons: Camera, Folder, Microphone */}
                  <div className="flex items-center gap-5 text-[#1E2530]">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setInputQuery(
                          'Can I scan this item if the barcode label is torn or damaged?'
                        );
                        textareaRef.current?.focus();
                      }}
                      title="Insert scanner / camera inspection question"
                      className="hover:text-[#4C628A] active:scale-90 transition-all cursor-pointer"
                    >
                      <Camera size={21} strokeWidth={1.7} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setActiveView('topics');
                      }}
                      title="Browse SOP topic pills"
                      className="hover:text-[#4C628A] active:scale-90 transition-all cursor-pointer"
                    >
                      <Folder size={21} strokeWidth={1.7} />
                    </button>

                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      title="Speak your question"
                      className={`hover:text-[#4C628A] active:scale-90 transition-all cursor-pointer ${
                        isListening ? 'text-rose-600 animate-pulse' : ''
                      }`}
                    >
                      <Mic size={21} strokeWidth={1.7} />
                    </button>
                  </div>

                  {/* Right-Aligned Circular Gradient Send Button with 4-Pointed Star Sparkle */}
                  <button
                    type="button"
                    onClick={() => sendQueryToGyan(inputQuery)}
                    disabled={!inputQuery.trim() || isLoading}
                    aria-label="Send question to Gyan"
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-[0_6px_18px_rgba(70,96,138,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-55"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 25%, #8BA6CE 0%, #5B79A6 55%, #415B84 100%)',
                    }}
                  >
                    <FourPointStarIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
