import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, BookOpen, AlertTriangle, ShieldCheck, PhoneCall, Bot, User, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Lesson } from '../types';

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
  timestamp: string;
  citations?: GyanCitation[];
  verificationStatus?: 'verified' | 'partial' | 'insufficient';
  missingInformation?: string;
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
  onClose: () => void;
  activeLesson?: Lesson | null;
  onSelectLesson?: (lessonId: string) => void;
  onCallTrainer?: () => void;
  userRole?: string;
  userOrgId?: string;
}

export default function GyanChatModal({
  isOpen,
  onClose,
  activeLesson,
  onSelectLesson,
  onCallTrainer,
  userRole = 'learn',
  userOrgId = 'org_default',
}: GyanChatModalProps) {
  const [messages, setMessages] = useState<GyanMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Hello! I am Gyan, your AI Work Companion. Ask me anything about approved standard operating procedures, prerequisites, equipment parameters, exception rules, or safety protocols.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verificationStatus: 'verified',
      citations: activeLesson ? [
        {
          docTitle: activeLesson.title,
          section: 'Active Working Context',
          version: activeLesson.sourceMeta?.version || 'v1.0',
          excerpt: activeLesson.description || 'Grounded operational guidelines.',
        }
      ] : [],
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const starterPrompts = [
    'How do I handle damaged or unsealed items?',
    'What are the critical pressure & temperature thresholds?',
    'What is the procedure during scanner network disconnect?',
    'Who has authority to approve custom exception overrides?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isTyping) return;

    sounds.playTap();
    setInputQuery('');

    const userMsg: GyanMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gyan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: historyPayload,
          context: {
            activeLessonId: activeLesson?.id,
            activeLessonTitle: activeLesson?.title,
            currentStepTitle: activeLesson?.operationalBlueprint?.process || 'Operational Execution',
          },
          userOrgId,
          userRole,
        }),
      });

      const data = await res.json();

      if (data.success) {
        sounds.playCorrect();
        const assistantMsg: GyanMessage = {
          id: `msg-asst-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: data.citations || [],
          verificationStatus: data.verificationStatus || 'verified',
          missingInformation: data.missingInformation,
          requiresEscalation: data.requiresEscalation,
          escalationNotice: data.escalationNotice,
          recommendedModule: data.recommendedModule,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        sounds.playWrong();
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-err-${Date.now()}`,
            role: 'assistant',
            content: data.answer || 'I could not process this request against approved SOP guidelines.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            verificationStatus: 'insufficient',
            requiresEscalation: true,
            escalationNotice: data.escalationNotice || 'Security or verification exception. Please contact shift supervisor.',
          },
        ]);
      }
    } catch (err) {
      sounds.playWrong();
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-fail-${Date.now()}`,
          role: 'assistant',
          content: 'Network connection issue. Please refer to printed SOP manual or notify your shift supervisor.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verificationStatus: 'insufficient',
          requiresEscalation: true,
          escalationNotice: 'Service network exception. Notify lead trainer Marcus.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* BACKDROP OVERLAY */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in cursor-pointer"
        onClick={() => {
          sounds.playTap();
          onClose();
        }}
      />

      {/* PULL-OUT SIDE DRAWER */}
      <div className="fixed top-0 right-0 bottom-0 h-full w-full sm:w-[460px] lg:w-[480px] bg-[#FBFBFD] z-50 shadow-2xl border-l border-slate-200/90 flex flex-col transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 select-none font-sans text-slate-900">
        
        {/* DRAWER HEADER */}
        <div className="px-6 py-4 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Gyan</h3>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  AI Work Companion
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-0.5">
                <span>Grounded SOPs</span>
                <span aria-hidden="true">·</span>
                <span>Role & Org Protected</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCallTrainer && (
              <button
                onClick={onCallTrainer}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Call Trainer to Station"
              >
                <PhoneCall size={16} />
              </button>
            )}
            <button
              onClick={() => {
                sounds.playTap();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-sm font-bold"
              aria-label="Close Gyan Drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ACTIVE SOP CONTEXT BANNER */}
        {activeLesson && (
          <div className="px-6 py-3 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen size={14} className="text-indigo-600 shrink-0" />
              <span className="font-bold text-slate-800 truncate">
                Context: {activeLesson.title}
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-500 font-bold uppercase shrink-0">
              {activeLesson.sourceMeta?.version || 'v1.0'}
            </span>
          </div>
        )}

        {/* MESSAGES CONVERSATION CONTAINER */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
            >
              {/* Message Meta Info */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
                {msg.role === 'user' ? (
                  <>
                    <span>YOU ({userRole.toUpperCase()})</span>
                    <User size={12} />
                  </>
                ) : (
                  <>
                    <Bot size={12} className="text-indigo-600" />
                    <span>GYAN AI ASSISTANT</span>
                  </>
                )}
                <span>· {msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 text-left ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white font-medium rounded-tr-xs'
                    : 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs'
                }`}
              >
                {/* Grounding Verification Badge */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    {msg.verificationStatus === 'verified' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-mono font-bold uppercase">
                        <ShieldCheck size={12} className="text-emerald-600" />
                        Approved SOP Grounded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-mono font-bold uppercase">
                        <AlertTriangle size={12} className="text-amber-600" />
                        Verification Gap / Escalation
                      </span>
                    )}
                  </div>
                )}

                {/* Message Body Content */}
                <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal">
                  {msg.content}
                </div>

                {/* Information Gap Box */}
                {msg.missingInformation && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">
                      Information Gap
                    </span>
                    <p className="font-medium text-xs leading-snug">{msg.missingInformation}</p>
                  </div>
                )}

                {/* Supervisor Escalation Banner */}
                {msg.requiresEscalation && msg.escalationNotice && (
                  <div className="p-4 rounded-xl bg-rose-50/90 border border-rose-200 text-xs text-rose-950 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold uppercase text-[10px] tracking-wider">
                      <AlertTriangle size={14} />
                      <span>Supervisor Escalation Directive</span>
                    </div>
                    <p className="font-semibold text-xs leading-relaxed">{msg.escalationNotice}</p>
                    {onCallTrainer && (
                      <button
                        onClick={() => {
                          sounds.playTap();
                          onCallTrainer();
                        }}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <PhoneCall size={14} /> Dispatch Shift Supervisor
                      </button>
                    )}
                  </div>
                )}

                {/* Approved Document Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      APPROVED DOCUMENT CITATIONS
                    </span>
                    <div className="space-y-2">
                      {msg.citations.map((cite, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{cite.docTitle}</span>
                            <span className="font-mono text-[9px] text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded font-semibold">
                              {cite.version}
                            </span>
                          </div>
                          <div className="text-slate-500 font-medium">Ref: {cite.section}</div>
                          {cite.excerpt && (
                            <p className="text-slate-700 italic border-l-2 border-indigo-500 pl-2 mt-1">
                              "{cite.excerpt}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Training Module */}
                {msg.recommendedModule && msg.recommendedModule.id && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-wider">
                          RECOMMENDED TRAINING MODULE
                        </span>
                        <Sparkles size={12} className="text-indigo-600" />
                      </div>
                      <h4 className="text-xs font-bold text-indigo-950">{msg.recommendedModule.title}</h4>
                      <p className="text-[11px] text-indigo-800 font-medium">{msg.recommendedModule.reason}</p>
                      {onSelectLesson && (
                        <button
                          onClick={() => {
                            sounds.playTap();
                            onSelectLesson(msg.recommendedModule!.id);
                            onClose();
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 mt-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Open Training Module</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 max-w-xs shadow-xs">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-xs font-medium text-slate-600">Gyan is checking approved SOPs...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* STARTER SUGGESTIONS */}
        {messages.length <= 2 && (
          <div className="px-6 py-3 space-y-2 bg-[#FBFBFD] shrink-0 border-t border-slate-200/60">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block text-left">
              RECOMMENDED WORKPLACE QUESTIONS
            </span>
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all cursor-pointer text-left shadow-2xs active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* INPUT FORM CONTAINER */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 flex items-center gap-2 bg-slate-100 focus-within:bg-white border border-slate-200/90 focus-within:border-slate-900 rounded-full px-4 py-2.5 transition-all shadow-inner">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask Gyan about procedures, limits, or exceptions..."
                disabled={isTyping}
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 focus:outline-none placeholder:text-slate-400 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shrink-0 cursor-pointer ${
                inputQuery.trim() && !isTyping
                  ? 'bg-slate-900 hover:bg-slate-800 shadow-md active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </form>
          <div className="text-[10px] text-slate-400 font-medium text-center mt-2">
            Grounded in approved company SOPs · Zero unapproved improvisation
          </div>
        </div>

      </div>
    </div>
  );
}
