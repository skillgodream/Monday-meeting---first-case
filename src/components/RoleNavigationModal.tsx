import React from 'react';
import { sounds } from '../utils/audio';

export type UserRole = 'admin' | 'manager' | 'learn';

interface RoleNavigationModalProps {
  isOpen: boolean;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onClose: () => void;
}

export default function RoleNavigationModal({
  isOpen,
  activeRole,
  onSelectRole,
  onClose,
}: RoleNavigationModalProps) {
  if (!isOpen) return null;

  const renderRoleIcon = (id: UserRole) => {
    if (id === 'admin') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white shrink-0">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    }
    if (id === 'manager') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white shrink-0">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    }
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white shrink-0">
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </svg>
    );
  };

  const navItems: { id: UserRole; title: string; descriptor: string }[] = [
    {
      id: 'admin',
      title: 'Admin',
      descriptor: 'Users · Content · Assignments · Reports · Settings',
    },
    {
      id: 'manager',
      title: 'Manager',
      descriptor: 'My Team · Assign Training · Progress & Scores',
    },
    {
      id: 'learn',
      title: 'Learn',
      descriptor: 'My Learning · My Progress · My Results',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl text-white space-y-3">
        
        {/* Title matching exact screenshot: "The exact navigation" */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            The exact navigation
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* The Exact Container (Matching attached screenshot with no card nesting and no neon) */}
        <div className="rounded-2xl border border-white/15 bg-black overflow-hidden divide-y divide-white/10 shadow-2xl">
          {navItems.map((item) => {
            const isCurrent = activeRole === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectRole(item.id);
                  onClose();
                }}
                className={`w-full py-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all cursor-pointer text-left group ${
                  isCurrent ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Left side: Icon + Title */}
                <div className="flex items-center gap-3 shrink-0">
                  {renderRoleIcon(item.id)}
                  <span className="text-base font-bold text-white tracking-tight">
                    {item.title}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                      Active
                    </span>
                  )}
                </div>

                {/* Right side: Descriptor (matching screenshot text exactly) */}
                <span className="text-xs sm:text-[13px] text-white/60 group-hover:text-white/80 transition-colors tracking-tight truncate sm:text-right">
                  {item.descriptor}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
