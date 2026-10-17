import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Lesson } from '../types';

export interface GyanMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
}: GyanChatModalProps) {
  const [messages, setMessages] = useState<GyanMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: "Hello! I am Gyan, your AI Work Companion. How can I help you today?",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!inputQuery.trim()) return;
    const userMsg: GyanMessage = { id: `u-${Date.now()}`, role: 'user', content: inputQuery };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    
    setTimeout(() => {
      const botMsg: GyanMessage = { 
        id: `b-${Date.now()}`, 
        role: 'assistant', 
        content: "I've received your query and am processing it based on approved SOPs."
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white text-black flex flex-col font-sans">
      {/* HEADER - Minimalist Apple Style */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="font-semibold text-lg">Gyan</h2>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">AI Companion</span>
        </div>
        <button className="p-2 -mr-2 rounded-full hover:bg-gray-100">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-black text-white rounded-br-none' 
                : 'bg-gray-100 text-black rounded-bl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA - Minimalist */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative flex items-center bg-gray-50 rounded-2xl px-4 py-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            onClick={handleSendMessage} 
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              inputQuery.trim() ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
