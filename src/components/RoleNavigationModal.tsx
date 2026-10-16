import React from 'react';
import { ShieldCheck, Users, GraduationCap, X } from 'lucide-react';
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

  const navItems = [
    {
      id: 'admin' as UserRole,
      title: 'Admin',
      icon: ShieldCheck,
      descriptor: 'Users · Content · Assignments · Reports · Settings',
    },
    {
      id: 'manager' as UserRole,
      title: 'Manager',
      icon: Users,
      descriptor: 'My Team · Assign Training · Progress & Scores',
    },
    {
      id: 'learn' as UserRole,
      title: 'Learn',
      icon: GraduationCap,
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
            <X size={16} />
          </button>
        </div>

        {/* The Exact Container (Matching attached screenshot with no card nesting and no neon) */}
        <div className="rounded-2xl border border-white/15 bg-black overflow-hidden divide-y divide-white/10 shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
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
                  <Icon size={18} className="text-white shrink-0" strokeWidth={2} />
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
